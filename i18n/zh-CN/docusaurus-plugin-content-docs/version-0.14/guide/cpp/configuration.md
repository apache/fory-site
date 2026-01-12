---
title: 配置
sidebar_position: 1
id: cpp_configuration
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

本页介绍 Fory 配置选项和序列化模式。

## 序列化模式

Apache Fory™ 支持两种序列化模式：

### SchemaConsistent 模式（默认）

类型声明必须在通信双方完全匹配：

```cpp
auto fory = Fory::builder().build(); // 默认为 SchemaConsistent
```

### Compatible 模式

允许独立的 schema 演化：

```cpp
auto fory = Fory::builder().compatible(true).build();
```

## 构建器模式

使用 `ForyBuilder` 构造具有自定义配置的 Fory 实例：

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// 默认配置
auto fory = Fory::builder().build();

// 用于 schema 演化的兼容模式
auto fory = Fory::builder()
    .compatible(true)
    .build();

// 跨语言模式
auto fory = Fory::builder()
    .xlang(true)
    .build();

// 完整配置
auto fory = Fory::builder()
    .compatible(true)
    .xlang(true)
    .track_ref(true)
    .max_dyn_depth(10)
    .check_struct_version(true)
    .build();
```

## 配置选项

### xlang(bool)

启用/禁用跨语言（xlang）序列化模式。

```cpp
auto fory = Fory::builder()
    .xlang(true)  // 启用跨语言兼容性
    .build();
```

启用后，包含用于与 Java、Python、Go、Rust 和 JavaScript 跨语言兼容的元数据。

**默认值：** `true`

### compatible(bool)

启用/禁用用于 schema 演化的兼容模式。

```cpp
auto fory = Fory::builder()
    .compatible(true)  // 启用 schema 演化
    .build();
```

启用后，支持读取使用不同 schema 版本序列化的数据。

**默认值：** `false`

### track_ref(bool)

启用/禁用共享引用和循环引用的引用跟踪。

```cpp
auto fory = Fory::builder()
    .track_ref(true)  // 启用引用跟踪
    .build();
```

启用后，避免重复序列化共享对象并处理循环引用。

**默认值：** `true`

### max_dyn_depth(uint32_t)

设置动态类型对象的最大允许嵌套深度。

```cpp
auto fory = Fory::builder()
    .max_dyn_depth(10)  // 允许最多 10 层
    .build();
```

这限制了嵌套多态对象序列化的最大深度（例如 `shared_ptr<Base>`、`unique_ptr<Base>`）。防止深度嵌套结构在动态序列化场景中导致栈溢出。

**默认值：** `5`

**何时调整：**

- **增加**：对于合法的深度嵌套数据结构
- **减少**：对于更严格的安全要求或浅层数据结构

### check_struct_version(bool)

启用/禁用结构体版本检查。

```cpp
auto fory = Fory::builder()
    .check_struct_version(true)  // 启用版本检查
    .build();
```

启用后，验证类型哈希以检测 schema 不匹配。

**默认值：** `false`

## 线程安全 vs 单线程

### 单线程（最快）

```cpp
auto fory = Fory::builder()
    .xlang(true)
    .build();  // 返回 Fory
```

单线程 `Fory` 是最快的选项，但非线程安全。每个线程使用一个实例。

### 线程安全

```cpp
auto fory = Fory::builder()
    .xlang(true)
    .build_thread_safe();  // 返回 ThreadSafeFory
```

`ThreadSafeFory` 使用 Fory 实例池提供线程安全的序列化。由于池开销略慢，但可以从多个线程并发安全使用。

## 配置摘要

| 选项                         | 说明                   | 默认值  |
| ---------------------------- | ---------------------- | ------- |
| `xlang(bool)`                | 启用跨语言模式         | `true`  |
| `compatible(bool)`           | 启用 schema 演化       | `false` |
| `track_ref(bool)`            | 启用引用跟踪           | `true`  |
| `max_dyn_depth(uint32_t)`    | 动态类型的最大嵌套深度 | `5`     |
| `check_struct_version(bool)` | 启用结构体版本检查     | `false` |

## 相关主题

- [基础序列化](basic-serialization.md) - 使用配置的 Fory
- [跨语言](cross-language.md) - XLANG 模式详情
- [类型注册](type-registration.md) - 注册类型
