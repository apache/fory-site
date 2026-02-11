---
title: Xlang 实现指南
sidebar_position: 10
id: xlang_implementation_guide
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

## 实现建议

### 如何减少内存读写开销

- 尽量把多次 byte 写入合并为 int/long 写入，降低内存 IO 与边界检查成本。
- 读取时可一次读取 int/long，再拆分字节，减少内存访问次数。
- 尽可能把 flag 与 length 合并到同一个 varint/long，减少字节数与 IO。
- 在分支数量可控的前提下，分支开销通常小于内存 IO 开销。

### 静态语言（无运行时代码生成）如何做高性能反序列化

在类型演进场景，序列化数据会携带 type meta。反序列化端会比较“数据内 meta”与“本地类 meta”，根据差异执行字段映射。

对 Java/Javascript/Python，可在运行时根据 diff 动态生成并加载反序列化逻辑，从而接近 schema-consistent 模式性能。

对 C++/Rust，通常无法在运行时动态生成 serializer，只能在编译期元编程生成。此时无法提前知道对端 schema，
因此需要在运行时根据字段元信息逐个判断“赋值或跳过”。

可行优化：将字符串字段匹配尽量提前转换为 `field id`，再在反序列化路径用 `switch` 处理，利用连续 case 的跳转优化。

思路：

- 假设本地类型字段数为 `n`，对端字段数为 `n1`
- 编译期先为本地排序字段分配连续 `field id`（从 0 开始）
- 运行时比较对端 type meta：同名字段复用本地 id，不同字段分配从 `n` 开始的新 id，并缓存映射
- 反序列化遍历对端字段时对 `field_id` 做 `switch`，命中则赋值，未命中则跳过

示例：A 进程持有 `Foo1`，B 进程持有演进后的 `Foo2`：

```c++
// class Foo with version 1
class Foo1 {
  int32_t v1; // id 0
  std::string v2; // id 1
};
// class Foo with version 2
class Foo2 {
  // id 0, but will have id 2 in process A
  bool v0;
  // id 1, but will have id 0 in process A
  int32_t v1;
  // id 2, but will have id 3 in process A
  int64_t long_value;
  // id 3, but will have id 1 in process A
  std::string v2;
  // id 4, but will have id 4 in process A
  std::vector<std::string> list;
};
```

A 收到 B 发送的 `Foo2` 数据后，可按 `field_id` 快速分发：

```c++
Foo1 foo1 = ...;
const std::vector<fory::FieldInfo> &field_infos = type_meta.field_infos;
for (const auto &field_info : field_infos) {
  switch (field_info.field_id) {
    case 0:
      foo1.v1 = buffer.read_varint32();
      break;
    case 1:
      foo1.v2 = fory.read_string();
      break;
    default:
      fory.skip_data(field_info);
  }
}
```

## 新语言实现检查清单

本节给出在新语言中落地 Fory xlang 序列化的阶段性清单。

### 阶段 1：核心基础设施

1. **Buffer 实现**
   - [ ] 提供带读写游标的字节缓冲区
   - [ ] 所有多字节读写统一使用 little-endian
   - [ ] 实现 `write_int8/int16/int32/int64`
   - [ ] 实现 `write_float32/write_float64`
   - [ ] 实现对应 `read_*` 方法
   - [ ] 实现缓冲区扩容策略（如倍增）

2. **Varint 编码**
   - [ ] `write_varuint32/read_varuint32`
   - [ ] `write_varint32/read_varint32`（含 ZigZag）
   - [ ] `write_varuint64/read_varuint64`
   - [ ] `write_varint64/read_varint64`（含 ZigZag）
   - [ ] `write_varuint36_small/read_varuint36_small`（字符串头使用）
   - [ ] 可选：实现 int64 Hybrid 编码（TAGGED_INT64/TAGGED_UINT64）

3. **头部处理**
   - [ ] 读写 bitmap flags（null、xlang、oob）

### 阶段 2：基础类型序列化

4. **基础类型**
   - [ ] bool（1 字节：0/1）
   - [ ] int8/int16/int32/int64（little-endian）
   - [ ] float32/float64（IEEE 754，little-endian）

5. **字符串序列化**
   - [ ] 实现字符串头：`(byte_length << 2) | encoding`
   - [ ] 支持 UTF-8（xlang 必需）
   - [ ] 可选支持 LATIN1 与 UTF-16

6. **时间类型**
   - [ ] Duration（seconds + nanoseconds）
   - [ ] Timestamp（epoch 以来 seconds + nanoseconds）
   - [ ] Date（epoch 以来天数）

7. **引用跟踪**
   - [ ] 写侧对象跟踪（object -> ref_id）
   - [ ] 读侧对象跟踪（ref_id -> object）
   - [ ] 支持 4 种引用标记：NULL(-3)、REF(-2)、NOT_NULL(-1)、REF_VALUE(0)
   - [ ] 支持按类型或全局关闭引用跟踪

### 阶段 3：集合类型

8. **List/Array**
   - [ ] 长度写为 varuint32
   - [ ] 写 elements header byte
   - [ ] 处理同构/异构元素
   - [ ] 处理 null 元素

9. **Map**
   - [ ] 总大小写为 varuint32
   - [ ] 实现分块格式（每块最多 255 对）
   - [ ] 每块写 KV header
   - [ ] 处理 key/value 类型变化

10. **Set**
    - [ ] 与 List 复用同一套实现

### 阶段 4：Meta String 编码

meta string 用于 enum/struct 的字段名、类型名、命名空间编码。

11. **Meta String 压缩**
    - [ ] LOWER_SPECIAL（5 bits/char）
    - [ ] LOWER_UPPER_DIGIT_SPECIAL（6 bits/char）
    - [ ] FIRST_TO_LOWER_SPECIAL
    - [ ] ALL_TO_LOWER_SPECIAL
    - [ ] 编码选择算法
    - [ ] meta string 去重

### 阶段 5：Enum 序列化

12. **Enum**
    - [ ] ordinal 写为 varuint32
    - [ ] 支持命名 enum（namespace + typename）

### 阶段 6：Struct 序列化

13. **类型注册**
    - [ ] 支持按数值 ID 注册
    - [ ] 支持按 namespace + typename 注册
    - [ ] 维护 type -> serializer 映射
    - [ ] 生成 type ID：先写 internal type ID，再写 `user_type_id(varuint32)`

14. **字段排序**
    - [ ] 实现规范定义的分组与排序（primitive/boxed/builtin、collections/maps、other）
    - [ ] 组内使用稳定比较器（type ID + name）
    - [ ] 指纹字段标识使用 tag ID 或 snake_case 字段名

15. **Schema Consistent 模式**
    - [ ] 开启类版本校验时，按字段标识计算 schema hash
    - [ ] 在字段前写 4-byte schema hash
    - [ ] 按 Fory 字段顺序序列化

16. **Compatible/Meta Share 模式**
    - [ ] 实现共享 TypeDef 流（新 TypeDef 内联，已存在用索引）
    - [ ] 按字段名或 tag ID 做映射，未知字段跳过
    - [ ] 按 TypeDef 元信息应用 nullable/ref 规则

### 阶段 7：其他类型

17. **Binary/Array**

- [ ] 基础类型数组支持直接 buffer copy
- [ ] 多维数组按嵌套 list 表达（不做 tensor 专用编码）

### 测试策略

18. **跨语言兼容测试**
    - [ ] 新语言写 -> Java/Python 读
    - [ ] Java/Python 写 -> 新语言读
    - [ ] 覆盖所有基础类型
    - [ ] 覆盖不同字符串编码
    - [ ] 覆盖集合（空、单元素、多元素）
    - [ ] 覆盖不同 key/value map
    - [ ] 覆盖嵌套 struct
    - [ ] 覆盖循环引用（若支持）

## 各语言实现备注

### Java

- 通过运行时代码生成（JIT）获得高性能
- 支持完整引用跟踪模式
- 利用 String coder 做编码选择
- 可通过 `ThreadSafeFory` 提供线程安全封装

### Python

- 提供纯 Python（调试）与 Cython（性能）两种模式
- 使用 `id(obj)` 做引用跟踪
- xlang 模式支持 LATIN1/UTF-16/UTF-8
- 通过代码生成增强 `dataclass` 支持

### C++

- 通过宏（`FORY_STRUCT`）做编译期反射
- 模板元编程进行类型分发与 serializer 选择
- 使用 `std::shared_ptr` 支持引用跟踪
- 编译期字段排序
- 不依赖运行时代码生成

### Rust

- 使用 derive 宏自动生成序列化代码（`#[derive(ForyObject)]`）
- 使用 `Rc<T>`/`Arc<T>` 做引用跟踪
- 通过线程本地上下文缓存优化性能
- 编译期字段排序

### Go

- 支持反射模式与代码生成模式
- 通过 struct tag 提供字段元信息
- 通过接口类型支持多态语义
