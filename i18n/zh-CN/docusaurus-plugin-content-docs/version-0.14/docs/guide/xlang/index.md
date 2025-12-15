---
title: 跨语言序列化指南
sidebar_position: 0
id: xlang_serialization_index
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

Apache Fory™ xlang（跨语言）序列化实现了不同编程语言之间的无缝数据交换。在一种语言中序列化数据，并在另一种语言中反序列化——无需 IDL 定义、schema 编译或手动数据转换。

## 特性

- **无需 IDL**：自动序列化任何对象，无需 Protocol Buffers、Thrift 或其他 IDL 定义
- **多语言支持**：Java、Python、C++、Go、Rust、JavaScript 之间无缝互操作
- **引用支持**：跨语言边界支持共享引用和循环引用
- **Schema 演化**：类定义变更时的前向/后向兼容性
- **零拷贝**：大型二进制数据的带外序列化
- **高性能**：JIT 编译和优化的二进制协议

## 支持的语言

| 语言       | 状态 | 包                               |
| ---------- | ---- | -------------------------------- |
| Java       | ✅   | `org.apache.fory:fory-core`      |
| Python     | ✅   | `pyfory`                         |
| C++        | ✅   | Bazel/CMake 构建                 |
| Go         | ✅   | `github.com/apache/fory/go/fory` |
| Rust       | ✅   | `fory` crate                     |
| JavaScript | ✅   | `@apache-fory/fory`              |

## 何时使用 Xlang 模式

**使用 xlang 模式的场景：**

- 构建多语言微服务
- 创建多语言数据管道
- 在前端（JavaScript）和后端（Java/Python/Go）之间共享数据

**使用语言原生模式的场景：**

- 所有序列化/反序列化都在同一语言中进行
- 需要最大性能（原生模式更快）
- 需要特定语言功能（Python pickle 兼容性、Java 序列化钩子）

## 快速示例

### Java（生产者）

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Person {
    public String name;
    public int age;
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .build();
fory.register(Person.class, "example.Person");

Person person = new Person();
person.name = "Alice";
person.age = 30;
byte[] bytes = fory.serialize(person);
// 将 bytes 发送到 Python、Go、Rust 等
```

### Python（消费者）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32Type

fory = pyfory.Fory()
fory.register_type(Person, typename="example.Person")

# 从 Java 接收 bytes
person = fory.deserialize(bytes_from_java)
print(f"{person.name}, {person.age}")  # Alice, 30
```

## 文档

| 主题                                                                              | 描述                         |
| --------------------------------------------------------------------------------- | ---------------------------- |
| [入门指南](getting-started.md)                                                    | 所有语言的安装和基本设置     |
| [类型映射](https://fory.apache.org/docs/specification/xlang_type_mapping)         | 跨语言类型映射参考           |
| [序列化](serialization.md)                                                        | 内置类型、自定义类型、引用处理 |
| [零拷贝](zero-copy.md)                                                            | 大型数据的带外序列化         |
| [行格式](row_format.md)                                                           | 具有随机访问的缓存友好二进制格式 |
| [故障排查](troubleshooting.md)                                                    | 常见问题及解决方案           |

## 特定语言指南

有关特定语言的详细信息和 API 参考：

- [Java 跨语言指南](../java/cross-language.md)
- [Python 跨语言指南](../python/cross-language.md)
- [C++ 跨语言指南](../cpp/cross-language.md)
- [Rust 跨语言指南](../rust/cross-language.md)

## 规范

- [Xlang 序列化规范](https://fory.apache.org/docs/next/specification/fory_xlang_serialization_spec) - 二进制协议详情
- [类型映射规范](https://fory.apache.org/docs/next/specification/xlang_type_mapping) - 完整的类型映射参考
