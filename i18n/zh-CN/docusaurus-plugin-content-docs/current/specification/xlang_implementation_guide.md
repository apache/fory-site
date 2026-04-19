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

## 概览

本指南描述当前 xlang 运行时的所有权模型。该模型由参考 Java
运行时采用，并由 Dart 运行时重写版本镜像实现。

编码格式由 [Xlang Serialization Spec](xlang_serialization_spec.md)
定义。本文关注的是服务边界、操作流程与内部所有权。新运行时不必使用相同的类名，
但应保持相同的控制流：

- 根级操作留在运行时门面上
- 嵌套载荷处理留在显式的读写上下文中
- 类型元信息留在类型解析层
- serializer 只关注载荷本身

如果本指南与编码格式规范冲突，应以
`docs/specification/xlang_serialization_spec.md` 为准；如果与某个语言运行时的实现细节冲突，则以该语言当前运行时代码为准。

## 事实来源

按以下顺序使用这些来源：

1. `docs/specification/xlang_serialization_spec.md`
2. 该语言当前的运行时实现
3. `integration_tests/` 下的跨语言测试

对于 Dart，运行时形态主要围绕以下组件展开：

- `Fory`
- `WriteContext`
- `ReadContext`
- `RefWriter`
- `RefReader`
- `TypeResolver`
- `StructCodec`

## 运行时所有权模型

### `Fory` 是根操作门面

`Fory` 持有一个运行时实例可复用的运行时服务。

在 Dart 中，`Fory` 恰好持有四个运行时成员：

- `Buffer`
- `WriteContext`
- `ReadContext`
- `TypeResolver`

在 Java 中，`Fory` 还持有 `JITContext`、`CopyContext`
等运行时本地服务，但所有权规则相同：`Fory`
是根级门面，而不是嵌套 serializer 执行工作的地方。

`Fory` 负责：

- 为根级操作准备共享 buffer
- 写入和读取根级 xlang 头部位图
- 将嵌套值编码委托给 `WriteContext`
- 将嵌套值解码委托给 `ReadContext`
- 通过 `TypeResolver` 持有注册能力
- 在顶层 `finally` 中重置操作级上下文状态

嵌套 serializer 不得回调根级 `serialize(...)` 或 `deserialize(...)`
入口。

### `WriteContext` 和 `ReadContext` 持有操作级状态

`WriteContext` 与 `ReadContext`
由 `Fory` 为一次根级操作准备，并在复用前由 `Fory`
在 `finally` 块中重置。

`prepare(...)` 应只绑定当前 buffer 和根级操作输入。`reset()`
应清理操作级可变状态。

这些操作级状态包括：

- 当前 buffer
- 当前活动的 `RefWriter` 或 `RefReader`
- meta string 状态
- 共享 TypeDef 状态
- 以对象 identity 为键的操作级临时状态
- compatible struct slot 状态
- 逻辑对象图深度

无论是生成的还是手写的 serializer，都应把这些 context
视为操作级服务的唯一来源。serializer
不得把环境运行时状态保存在 thread local、全局变量或 serializer
实例字段中。

### `WriteContext`

`WriteContext` 持有写侧的全部操作级状态：

- 当前 `Buffer`
- `RefWriter`
- `MetaStringWriter`
- 共享 TypeDef 写入状态
- 根级 `trackRef` 模式
- 递归深度与限制
- compatible 写入使用的本地 struct slot 状态

它暴露一组一次性基础类型 helper，例如：

- `writeBool`
- `writeInt32`
- `writeVarUint32`

这些 helper 只是便捷方法。若 serializer
需要执行大量重复的基础类型 IO，应缓存 `final buffer = context.buffer;`
并直接调用 buffer 方法。

### `ReadContext`

`ReadContext` 持有读侧的全部操作级状态：

- 当前 `Buffer`
- `RefReader`
- `MetaStringReader`
- 共享 TypeDef 读取状态
- 递归深度与限制
- compatible 读取使用的本地 struct slot 状态

它暴露对应的一次性基础类型 helper，例如：

- `readBool`
- `readInt32`
- `readVarUint32`

生成的 struct serializer 在构造目标实例后，应立即调用
`context.reference(value)`，这样回引用才能解析到该对象。

## 引用跟踪

引用处理被拆分到两个显式服务之后：

- `RefWriter` 写入 null、ref 与 new-value 标记，并按对象 identity
  记住已经写出的对象。
- `RefReader` 解码这些标记，预留读取侧引用 ID，并解析已经实例化过的对象。

xlang 的引用标记如下：

- `NULL_FLAG (-3)`
- `REF_FLAG (-2)`
- `NOT_NULL_VALUE_FLAG (-1)`
- `REF_VALUE_FLAG (0)`

关键行为：

- 基础值永远不使用引用跟踪
- 生成的 struct 内部由字段元信息控制引用行为
- 根级 `trackRef` 只用于顶层对象图以及没有字段元信息的容器根对象
- 若 serializer 在所有嵌套读取完成之前就分配了对象，则必须通过
  `context.reference(...)` 尽早绑定该对象

## 类型解析

`TypeResolver` 持有：

- 内建类型解析
- 按数值 ID 或 `namespace + typeName` 注册
- serializer 查找
- struct 元数据查找
- 类型元信息编码与解码
- 包名、类型名、字段名的规范化编码 meta string
- 用于 named 类型解析的已编码名称查找
- struct、compatible struct、enum、ext、union 等形式的编码类型判定

在 Java xlang 模式中，具体实现是 `XtypeResolver`。在 Dart 中，相同的所有权仍由内部 `TypeResolver` 持有。

serializer 自身不负责解析类元数据。它们通过当前 context
请求读写嵌套值，再由 context 将类型相关工作委托给 `TypeResolver`。

## 根帧职责

每个根载荷都以一个 1-byte 位图开头，该位图由 `Fory`
自身写入和读取，而不是由 serializer 负责。

当前 xlang 根级位定义如下：

| Bit | Meaning                    |
| --- | -------------------------- |
| `0` | null root payload          |
| `1` | xlang payload              |
| `2` | out-of-band buffers in use |

应将根级位图与逐对象引用标记区分开：

- 根级位图描述整个载荷
- 引用标记一次只描述一个嵌套值

## 序列化流程

### 根级写路径

当前根级写流程如下：

1. `Fory.serialize(...)` 或 `serializeTo(...)` 准备目标 buffer。
2. `Fory` 调用 `writeContext.prepare(...)`。
3. `Fory` 写入根级位图。
4. `Fory` 将根对象委托给 `WriteContext`。
5. `writeContext.reset()` 在 `finally` 中执行。

对于非空根值，`WriteContext.writeRootValue(...)` 会执行：

1. 引用/null 包装
2. 类型元信息写入
3. 载荷写入

载荷 serializer 只负责自身类型的载荷。它们不写根级位图，也不负责注册或类型头编码。

### 嵌套写入使用 `WriteContext`

重要规则：

- 当嵌套 serializer 需要引用处理或类型元信息时，必须使用
  `WriteContext` 的 helper，例如 `writeRef(...)`、`writeNonRef(...)`
  以及容器 helper
- 重复的基础类型写入应直接走 buffer
- 嵌套 serializer 的流程应保持直线式，不要仅为了清理操作级状态而添加内部
  `try/finally`
- 顶层 `Fory.serialize(...)` 持有操作重置所需的 `finally`

## 反序列化流程

### 根级读路径

当前根级读流程与写流程对称：

1. `Fory.deserialize(...)` 或 `deserializeFrom(...)` 读取根级位图。
2. 若根值为 null，立即返回。
3. `Fory` 校验 xlang 模式与其他根帧要求。
4. `Fory` 调用 `readContext.prepare(...)`。
5. `Fory` 委托给 `ReadContext`。
6. `readContext.reset()` 在 `finally` 中执行。

### `ReadContext` 持有引用预留与载荷实例化

`ReadContext.readRef()` 执行标准的 xlang 读取序列：

1. 消费下一个引用标记
2. 在适当情况下立即返回 `null` 或回引用
3. 为新的可引用值预留新的读取侧引用 ID
4. 读取类型元信息
5. 读取载荷
6. 将预留的读取侧引用 ID 绑定到完成构造的对象

基础类型和类字符串的热点路径应直接从 buffer 读取；复杂载荷则委托给解析出的 serializer。

### 嵌套读取使用 `ReadContext`

重要规则：

- 若 serializer 会提前分配结果对象，则必须在读取可能回指它的嵌套子对象之前调用
  `context.reference(obj)`
- 嵌套 serializer 的流程应保持直线式，不要添加内部 `try/finally`
  来恢复操作级状态
- 顶层 `Fory.deserialize(...)` 持有操作重置所需的 `finally`

## 深度跟踪

`WriteContext` 与 `ReadContext` 会显式跟踪逻辑对象深度。`increaseDepth()`
负责执行 `Config.maxDepth` 限制。

深度应显式保存在 context 上，而不是只依赖原生调用栈。同时，深度清理也不应依赖散落在 serializer
代码中的嵌套 `try/finally`。顶层 context reset
必须能够在失败后恢复操作级状态。

## Struct 兼容性

struct 专属的 schema/version 包装与 compatible-field staging
应归属在 struct serializer 层，而不是 `Fory` 上，也不是公共 serializer API
上。

在 Dart 中，这个内部所有者是 `StructCodec`。

`StructCodec` 负责：

- 在兼容模式关闭且版本校验开启时写入 schema hash 包装
- 在兼容模式开启时执行 compatible struct 字段重映射
- 缓存 compatible 写布局与读布局
- 为生成的 serializer 提供 compatible 读写 slot 状态
- 在读取成功后记住远端 struct 元数据

当 `Config.compatible` 启用且 struct 被标记为 evolving 时：

- 编码类型使用 compatible struct 形式
- 运行时写入共享 TypeDef 元数据
- 读取侧按标识符映射输入字段，并跳过未知字段

当 `compatible` 关闭而 `checkStructVersion` 启用时：

- 运行时会在 struct 载荷前写入 schema hash
- 读取侧会在读字段之前检查该 hash

## Meta string 与共享类型元信息

xlang 类型元信息由两类显式状态支撑：

- `MetaStringWriter` 和 `MetaStringReader`
  负责去重与解码命名空间和类型名字串
- 共享 TypeDef 的读写状态负责跟踪已声明的 compatible struct 元数据

所有权规则：

- 规范化后的编码名称由 `TypeResolver` 持有
- 每次操作的动态 meta string ID 由 `MetaStringWriter` 和
  `MetaStringReader` 持有
- 共享类型定义表属于操作级 context 状态

## Xlang 模式下的 enum

在 xlang 模式中，enum 按数值 tag 序列化，而不是按名称序列化。

在 Java 中：

- 默认 tag 是声明顺序对应的 ordinal
- `@ForyEnumId` 可将其覆盖为稳定的显式 tag
- `serializeEnumByName(true)` 影响的是 Java native 模式，而不是 xlang 模式

即便配置接口或注解形式不同，其他运行时也应保持相同的编码规则。

## Out-Of-Band Buffer Object

buffer object 的处理也遵循同样的拆分原则：

- 一个根级 bit 声明当前是否使用 out-of-band buffer
- 嵌套 buffer object 载荷仍按单个值决定是 in-band 还是 out-of-band
- serializer 应使用读写 context helper，而不是绕过运行时

## 代码生成

Dart 的常规集成路径如下：

1. 使用 `@ForyStruct` 标注 struct
2. 使用 `@ForyField` 标注字段覆盖
3. 运行 `build_runner`
4. 在源码库中私有绑定生成的元数据，并通过 `Fory.register(...)`
   注册生成的类型

生成代码应产出：

- 私有 serializer 类
- 私有元数据常量
- 每个被标注库对应的私有生成安装 helper
- 保持 serializer factory 私有的生成绑定安装逻辑

生成代码不应创建公共全局 registry，也不应创建第二套公共 API
族。

## 目录布局

在每个 Dart package 的 `lib/` 树下，只允许一层嵌套源码目录。

允许：

- `lib/fory.dart`
- `lib/src/<file>.dart`
- `lib/src/<area>/<file>.dart`

不允许：

- `lib/src/<area>/<subarea>/<file>.dart`

## 新运行时的 serializer 设计规则

任何新的 xlang 运行时都应遵循以下规则，即便其表面 API
有所不同：

1. 根级操作保留在运行时门面上，嵌套载荷处理放在显式读写 context 中。
2. 引用跟踪放在专门的读侧/写侧服务之后，使禁用引用跟踪的路径保持低成本。
3. 让 serializer 只负责载荷。类型元信息、注册与根帧包装属于运行时与类型解析层。
4. 显式跟踪操作级状态。不要依赖隐式 thread-local 运行时状态。
5. 在实例化新对象之前预留读取侧引用 ID，并在嵌套子对象可能回指它时尽早绑定部分构造对象。
6. 将操作准备与操作清理分离。`prepare(...)` 负责绑定当前操作输入，`reset()`
   负责清理操作级状态。
7. 保持根级位图、逐对象引用标记、类型头与载荷字节之间的边界清晰。
8. 内部命名应停留在序列化领域。优先使用 `codec`、`binding`、`layout`、
   `slots` 这类词，避免使用 `session` 这类 RPC 风格术语，或 `plan`
   这类含义模糊的控制流词汇。
9. 每次 xlang 协议或所有权模型变更后，都要运行跨语言测试矩阵，并同时更新本指南与
   [Xlang Serialization Spec](xlang_serialization_spec.md)。

## 验证

对于 Dart 运行时改动，至少运行：

```bash
cd dart
dart run build_runner build --delete-conflicting-outputs
dart analyze
dart test
```

若要覆盖生成代码的使用方，也应运行：

```bash
cd dart/packages/fory-test
dart run build_runner build --delete-conflicting-outputs
dart test
```
