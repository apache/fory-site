---
title: Go 序列化指南
sidebar_position: 0
id: index
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

Apache Fory Go 是一个面向 Go 的高性能跨语言序列化库。它支持自动对象图序列化，并具备循环引用、多态和跨语言兼容能力。

## 为什么选择 Fory Go？

- **高性能**：序列化速度快，二进制协议经过优化
- **跨语言**：可与 Java、Python、C++、Rust、JavaScript 无缝交换数据
- **自动序列化**：无需 IDL 定义或 schema 编译
- **引用跟踪**：内置循环引用和共享对象支持
- **类型安全**：强类型能力，并可选用代码生成实现编译期校验
- **Schema 演进**：兼容模式支持前向/后向兼容
- **线程安全选项**：提供基于池化的线程安全封装，适用于并发场景

## 快速开始

### 安装

**要求**：Go 1.24 或更高版本

```bash
go get github.com/apache/fory/go/fory
```

### 基本用法

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

type User struct {
    ID   int64
    Name string
    Age  int32
}

func main() {
    // Create a Fory instance
    f := fory.New()

    // Register struct with a type ID
    if err := f.RegisterStruct(User{}, 1); err != nil {
        panic(err)
    }

    // Serialize
    user := &User{ID: 1, Name: "Alice", Age: 30}
    data, err := f.Serialize(user)
    if err != nil {
        panic(err)
    }

    // Deserialize
    var result User
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    fmt.Printf("Deserialized: %+v\n", result)
    // Output: Deserialized: {ID:1 Name:Alice Age:30}
}
```

## 架构

Fory Go 提供两条序列化路径：

### 基于反射（默认）

默认路径使用 Go 反射在运行时检查类型。它开箱即用，可处理任意结构体。虽然该模式依赖反射，但通过类型缓存和热点路径内联优化，在绝大多数场景下都能提供优秀性能：

```go
f := fory.New()
data, _ := f.Serialize(myStruct)
```

### 代码生成（实验特性）

对性能极其敏感的路径，可以使用可选的预编译代码生成，消除反射开销。详见 [代码生成](codegen.md)。

## 配置

Fory Go 使用函数式选项模式进行配置：

```go
f := fory.New(
    fory.WithTrackRef(true),      // Enable reference tracking
    fory.WithCompatible(true),    // Enable schema evolution
    fory.WithMaxDepth(20),       // Set max nesting depth
)
```

全部可选项请参考 [配置](configuration.md)。

## 支持类型

Fory Go 支持广泛的数据类型：

- **基础类型**：`bool`、`int8`-`int64`、`uint8`-`uint64`、`float32`、`float64`、`string`
- **集合类型**：slice、map、set
- **时间类型**：`time.Time`、`time.Duration`
- **指针类型**：自动处理 nil 的各类指针
- **结构体**：任意包含导出字段的结构体

完整映射请见 [支持类型](supported-types.md)。

## 跨语言序列化

Fory Go 与其他 Fory 实现完全兼容。在 Go 中序列化的数据可在 Java、Python、C++、Rust 或 JavaScript 中反序列化：

```go
// Go serialization
f := fory.New()
f.RegisterStruct(User{}, 1)
data, _ := f.Serialize(&User{ID: 1, Name: "Alice"})
// 'data' can be deserialized by Java, Python, etc.
```

类型映射与兼容性细节请参考 [跨语言序列化](cross-language.md)。

## 文档导航

| 主题                                         | 说明                                   |
| -------------------------------------------- | -------------------------------------- |
| [配置](configuration.md)                     | 配置项与运行参数                       |
| [基本序列化](basic-serialization.md)         | 核心 API 与使用模式                    |
| [类型注册](type-registration.md)             | 序列化前的类型注册                     |
| [支持类型](supported-types.md)               | 完整类型支持说明                       |
| [引用](references.md)                        | 循环引用与共享对象                     |
| [Struct 标签](struct-tags.md)                | 字段级配置                             |
| [Schema 演进](schema-evolution.md)           | 前向/后向兼容策略                      |
| [跨语言](cross-language.md)                  | 多语言序列化                           |
| [代码生成](codegen.md)                       | 实验性的 AOT 代码生成                  |
| [线程安全](thread-safety.md)                 | 并发使用模式                           |
| [故障排查](troubleshooting.md)               | 常见问题与解决方案                     |

## 相关资源

- [Xlang 序列化规范](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec)
- [跨语言类型映射](https://fory.apache.org/docs/specification/xlang_type_mapping)
- [GitHub 仓库](https://github.com/apache/fory)
