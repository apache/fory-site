---
title: 字段配置
sidebar_position: 5
id: field_configuration
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

本页说明如何在 Rust 中配置字段级序列化元信息。

## 概述

Apache Fory™ 提供 `#[fory(...)]` 属性宏，可在编译期为字段声明可选元信息。它支持：

- **Tag ID**：为字段分配紧凑的数字 ID，减少字段元信息开销
- **可空性**：控制字段是否允许为 null
- **引用跟踪**：为共享所有权类型开启引用跟踪
- **跳过字段**：将字段排除在序列化之外
- **编码控制**：指定整数的编码方式（varint、fixed、tagged）

## 基本语法

`#[fory(...)]` 写在单个结构体字段上：

```rust
use fory::ForyObject;

#[derive(ForyObject)]
struct Person {
    #[fory(id = 0)]
    name: String,

    #[fory(id = 1)]
    age: i32,

    #[fory(id = 2, nullable)]
    nickname: Option<String>,
}
```

多个选项之间使用逗号分隔。

## 可用选项

### 字段 ID（`id = N`）

为字段分配数字 ID，可减少结构体字段元信息体积：

```rust
#[derive(ForyObject)]
struct User {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(id = 2)]
    age: i32,
}
```

优点：

- 序列化结果更小（元信息里写数字 ID，而不是字段名）
- 字段改名后仍可保持二进制兼容

建议：在兼容模式下，推荐始终配置字段 ID，以降低序列化成本。

注意事项：

- 同一结构体中的 ID 必须唯一
- ID 必须大于等于 `0`（使用 `-1` 表示显式退出 tag ID 编码）
- 如果不指定，就会在元信息中写字段名，开销更大

### 跳过字段（`skip`）

将字段排除出序列化：

```rust
#[derive(ForyObject)]
struct User {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(skip)]
    password: String,
}
```

`password` 不会出现在序列化结果中，反序列化后保持默认值。

### 可空（`nullable`）

控制字段是否写入 null 标记：

```rust
use fory::{Fory, RcWeak};

#[derive(ForyObject)]
struct Record {
    // RcWeak 默认可空，这里强制设为不可空
    #[fory(id = 0, nullable = false)]
    required_ref: RcWeak<Data>,
}
```

默认行为：

| 类型 | 默认可空 |
| --- | --- |
| `Option<T>` | `true` |
| `RcWeak<T>`、`ArcWeak<T>` | `true` |
| 其他类型 | `false` |

说明：

- `Option<T>`、`RcWeak<T>`、`ArcWeak<T>` 默认可空
- 其他类型默认不可空
- 可用 `nullable = false` 覆盖默认可空类型

### 引用跟踪（`ref`）

控制共享所有权类型的字段级引用跟踪：

```rust
use std::rc::Rc;
use std::sync::Arc;

#[derive(ForyObject)]
struct Container {
    #[fory(id = 0, ref = true)]
    shared_data: Rc<Data>,

    #[fory(id = 1, ref = false)]
    unique_data: Rc<Data>,
}
```

默认行为：

| 类型 | 默认引用跟踪 |
| --- | --- |
| `Rc<T>`、`Arc<T>` | `true` |
| `RcWeak<T>`、`ArcWeak<T>` | `true` |
| `Option<Rc<T>>`、`Option<Arc<T>>` | `true`（继承内部类型） |
| 其他类型 | `false` |

适用场景：

- 字段中对象可能被共享或形成环时，建议开启
- 字段值始终唯一时，可关闭作为优化

### 编码（`encoding`）

控制整数字段的编码方式：

```rust
#[derive(ForyObject)]
struct Metrics {
    #[fory(id = 0, encoding = "varint")]
    count: i64,

    #[fory(id = 1, encoding = "fixed")]
    timestamp: i64,

    #[fory(id = 2, encoding = "tagged")]
    value: u64,
}
```

支持的编码方式：

| 类型 | 可选值 | 默认值 |
| --- | --- | --- |
| `i32`、`u32` | `varint`、`fixed` | `varint` |
| `i64`、`u64` | `varint`、`fixed`、`tagged` | `varint` |

适用建议：

- `varint`：适合值通常较小的字段
- `fixed`：适合会用满数值范围的字段，例如时间戳、哈希
- `tagged`：需要保留类型信息时使用（仅 `u64`）

### 压缩（`compress`）

这是整数编码的简写形式：

```rust
#[derive(ForyObject)]
struct Data {
    #[fory(id = 0, compress)]
    small_value: i32,

    #[fory(id = 1, compress = false)]
    fixed_value: u32,
}
```

说明：

- `compress` 或 `compress = true` 等价于 `encoding = "varint"`
- `compress = false` 等价于 `encoding = "fixed"`
- 若同时指定 `compress` 和 `encoding`，两者不能冲突

## 类型分类

Fory 会根据字段类型推断默认行为：

| 类型类别 | 示例 | 默认可空 | 默认引用跟踪 |
| --- | --- | --- | --- |
| Primitive | `i8`、`i32`、`f64`、`bool` | `false` | `false` |
| Option | `Option<T>` | `true` | `false` |
| Rc | `Rc<T>` | `false` | `true` |
| Arc | `Arc<T>` | `false` | `true` |
| RcWeak | `RcWeak<T>` | `true` | `true` |
| ArcWeak | `ArcWeak<T>` | `true` | `true` |
| Other | `String`、`Vec<T>`、用户类型 | `false` | `false` |

特殊情况：`Option<Rc<T>>` 与 `Option<Arc<T>>` 会继承内部类型的引用跟踪行为。

## 完整示例

```rust
use fory::ForyObject;
use std::rc::Rc;

#[derive(ForyObject, Default)]
struct Document {
    #[fory(id = 0)]
    title: String,

    #[fory(id = 1)]
    version: i32,

    #[fory(id = 2)]
    description: Option<String>,

    #[fory(id = 3)]
    parent: Rc<Document>,

    #[fory(id = 4, nullable)]
    related: Option<Rc<Document>>,

    #[fory(id = 5, encoding = "varint")]
    view_count: u64,

    #[fory(id = 6, encoding = "fixed")]
    created_at: i64,

    #[fory(skip)]
    internal_state: String,
}

fn main() {
    let fory = fory::Fory::default();

    let doc = Document {
        title: "My Document".to_string(),
        version: 1,
        description: Some("A sample document".to_string()),
        parent: Rc::new(Document::default()),
        related: None,
        view_count: 42,
        created_at: 1704067200,
        internal_state: "secret".to_string(),
    };

    let bytes = fory.serialize(&doc);
    let decoded: Document = fory.deserialize(&bytes).unwrap();
}
```

## 编译期校验

非法配置会在编译期直接报错：

```rust
// Error: duplicate field IDs
#[derive(ForyObject)]
struct Bad {
    #[fory(id = 0)]
    field1: String,

    #[fory(id = 0)]
    field2: String,
}

// Error: invalid id value
#[derive(ForyObject)]
struct Bad2 {
    #[fory(id = -2)]
    field: String,
}

// Error: conflicting encoding attributes
#[derive(ForyObject)]
struct Bad3 {
    #[fory(compress = true, encoding = "fixed")]
    field: i32,
}
```

## 跨语言兼容性

当序列化数据需要被 Java、C++、Go、Python 等语言消费时，应通过字段配置对齐编码预期：

```rust
#[derive(ForyObject)]
struct CrossLangData {
    #[fory(id = 0, encoding = "varint")]
    int_var: i32,

    #[fory(id = 1, encoding = "fixed")]
    int_fixed: i32,

    #[fory(id = 2, encoding = "tagged")]
    long_tagged: u64,

    #[fory(id = 3, nullable)]
    optional: Option<String>,
}
```

## Schema 演进

兼容模式支持 Schema 演进。建议始终配置字段 ID，以降低序列化成本：

```rust
// 版本 1
#[derive(ForyObject)]
struct DataV1 {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,
}

// 版本 2：新增字段
#[derive(ForyObject)]
struct DataV2 {
    #[fory(id = 0)]
    id: i64,

    #[fory(id = 1)]
    name: String,

    #[fory(id = 2)]
    email: Option<String>,
}
```

V1 生成的数据可以被 V2 反序列化，新字段会得到 `None`。

也可以不写字段 ID，这时元信息中会使用字段名，兼容性仍然成立，只是开销更大：

```rust
#[derive(ForyObject)]
struct Data {
    id: i64,
    name: String,
}
```

## 默认值

- **可空性**：`Option<T>`、`RcWeak<T>`、`ArcWeak<T>` 默认可空，其余类型默认不可空
- **引用跟踪**：`Rc<T>`、`Arc<T>`、`RcWeak<T>`、`ArcWeak<T>` 默认启用引用跟踪，其余类型默认关闭

以下场景需要显式配置字段：

- 字段可能为 `None`（使用 `Option<T>`）
- 字段需要为共享 / 循环对象启用引用跟踪（使用 `ref = true`）
- 整数字段需要特定编码以适配跨语言
- 希望减少元信息大小（使用字段 ID）

```rust
#[derive(ForyObject)]
struct User {
    #[fory(id = 0)]
    name: String,

    #[fory(id = 1)]
    email: Option<String>,

    #[fory(id = 2, ref = true)]
    friend: Rc<User>,
}
```

### 默认值汇总

| 类型 | 默认可空 | 默认引用跟踪 |
| --- | --- | --- |
| 基础类型、`String` | `false` | `false` |
| `Option<T>` | `true` | `false` |
| `Rc<T>`、`Arc<T>` | `false` | `true` |
| `RcWeak<T>`、`ArcWeak<T>` | `true` | `true` |

## 最佳实践

1. 在兼容模式下优先配置字段 ID，减少元信息开销。
2. 对密码、令牌、内部状态等敏感字段使用 `skip`。
3. 共享对象可能重复出现时启用引用跟踪。
4. 对确定唯一的字段关闭引用跟踪，以减少开销。
5. 根据数值分布选择合适编码：小值用 `varint`，全范围值用 `fixed`。
6. 字段 ID 一旦分配，就尽量保持稳定。

## 选项速查

| 选项 | 写法 | 说明 | 适用范围 |
| --- | --- | --- | --- |
| `id` | `id = N` | 字段 tag ID，用于缩小元信息 | 全部字段 |
| `skip` | `skip` | 跳过该字段 | 全部字段 |
| `nullable` | `nullable` 或 `nullable = bool` | 控制是否写 null 标记 | 全部字段 |
| `ref` | `ref` 或 `ref = bool` | 控制引用跟踪 | `Rc`、`Arc`、weak 类型 |
| `encoding` | `encoding = "varint/fixed/tagged"` | 指定整数编码方式 | `i32`、`u32`、`i64`、`u64` |
| `compress` | `compress` 或 `compress = bool` | `varint/fixed` 的简写 | `i32`、`u32` |

## 相关主题

- [基础序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
- [跨语言](cross-language.md)
