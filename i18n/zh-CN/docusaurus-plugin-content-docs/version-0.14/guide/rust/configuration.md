---
title: 配置
sidebar_position: 1
id: configuration
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

本页涵盖 Fory 配置选项和序列化模式。

## 序列化模式

Apache Fory™ 支持两种序列化模式：

### SchemaConsistent 模式（默认）

类型声明必须在对等方之间完全匹配：

```rust
let fory = Fory::default(); // 默认为 SchemaConsistent
```

### Compatible 模式

允许独立的 schema 演化：

```rust
let fory = Fory::default().compatible(true);
```

## 配置选项

### 最大动态对象嵌套深度

Apache Fory™ 提供针对反序列化期间深度嵌套动态对象导致的栈溢出保护。默认情况下，trait 对象和容器的最大嵌套深度设置为 5 层。

**默认配置：**

```rust
let fory = Fory::default(); // max_dyn_depth = 5
```

**自定义深度限制：**

```rust
let fory = Fory::default().max_dyn_depth(10); // 允许最多 10 层
```

**何时调整：**

- **增加**：用于合法的深度嵌套数据结构
- **减少**：用于更严格的安全要求或浅层数据结构

**受保护的类型：**

- `Box<dyn Any>`、`Rc<dyn Any>`、`Arc<dyn Any>`
- `Box<dyn Trait>`、`Rc<dyn Trait>`、`Arc<dyn Trait>`（trait 对象）
- `RcWeak<T>`、`ArcWeak<T>`
- 集合类型（Vec、HashMap、HashSet）
- Compatible 模式下的嵌套结构体类型

注意：静态数据类型（非动态类型）本质上是安全的，不受深度限制约束，因为它们的结构在编译时就已知。

### 跨语言模式

启用跨语言序列化：

```rust
let fory = Fory::default()
    .compatible(true)
    .xlang(true);
```

## 构建器模式

```rust
use fory::Fory;

// 默认配置
let fory = Fory::default();

// 用于 schema 演化的兼容模式
let fory = Fory::default().compatible(true);

// 跨语言模式
let fory = Fory::default()
    .compatible(true)
    .xlang(true);

// 自定义深度限制
let fory = Fory::default().max_dyn_depth(10);

// 组合配置
let fory = Fory::default()
    .compatible(true)
    .xlang(true)
    .max_dyn_depth(10);
```

## 配置摘要

| 选项                 | 描述                   | 默认值  |
| -------------------- | ---------------------- | ------- |
| `compatible(bool)`   | 启用 schema 演化       | `false` |
| `xlang(bool)`        | 启用跨语言模式         | `false` |
| `max_dyn_depth(u32)` | 动态类型的最大嵌套深度 | `5`     |

## 相关主题

- [基础序列化](basic-serialization.md) - 使用已配置的 Fory
- [Schema 演化](schema-evolution.md) - Compatible 模式详情
- [跨语言](cross-language.md) - XLANG 模式
