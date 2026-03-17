---
title: 引用跟踪
sidebar_position: 45
id: reference_tracking
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

本页说明 Fory 在跨语言序列化中如何通过引用跟踪处理共享引用与循环引用。

## 概述

引用跟踪带来以下能力：

- **共享引用**：同一个对象被多次引用时，只序列化一次
- **循环引用**：对象可以引用自身，或形成环状结构
- **内存效率**：避免重复写出完全相同的对象数据

## 启用引用跟踪

### Java

```java
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();
```

### Python

```python
fory = pyfory.Fory(xlang=True, ref=True)
```

### Go

```go
fory := forygo.NewFory(
    forygo.WithXlang(true),
    forygo.WithTrackRef(true),
)
```

### C++

```cpp
auto fory = fory::Fory::builder().xlang(true).track_ref(true).build();
```

### Rust

```rust
let fory = Fory::default()
    .xlang(true)
    .track_ref(true);
```

## 编码格式

启用引用跟踪后，可空字段在值前会写入一个 **ref 标记字节**：

```text
[ref_flag] [value data if not null/ref]
```

其中 `ref_flag` 的含义如下：

| 值 | 含义 |
| --- | --- |
| `-1`（`NULL_FLAG`） | 值为 null |
| `-2`（`NOT_NULL_VALUE_FLAG`） | 值存在，且是第一次出现 |
| `≥0` | 指向此前已经序列化对象的引用 ID |

## 引用跟踪与可空性

这两个概念是**相互独立**的：

| 概念 | 目的 | 控制方式 |
| --- | --- | --- |
| **可空性** | 决定字段是否可以为 null | 字段类型（如 `Optional<T>`）或注解 |
| **引用跟踪** | 决定是否对重复对象做去重 | 全局 `refTracking` 开关 |

关键行为：

- 只有**可空字段**才会写入 ref 标记字节。
- 即使 `refTracking=true`，不可空字段也不会写 ref 标记。
- 引用去重只针对多次出现的同一对象。

```java
// 即使开启了引用跟踪，不可空字段仍然不会写 ref 标记
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();
```

## 字段级引用跟踪

即使全局启用了 `refTracking=true`，**大多数字段默认也不会做引用跟踪**。只有少数指针 / 智能指针类型会默认跟踪引用。

### 各语言默认行为

| 语言 | 默认字段级引用跟踪 | 默认会跟踪引用的类型 |
| --- | --- | --- |
| Java | 否 | 无，需要通过注解开启 |
| Python | 否 | 无，需要通过注解开启 |
| Go | 否 | 无，需要使用 `fory:"ref"` |
| C++ | 是 | `std::shared_ptr<T>`、`fory::serialization::SharedWeak<T>` |
| Rust | 否 | `Rc<T>`、`Arc<T>`、`Weak<T>` |

### 自定义字段级引用跟踪

#### Java：`@ForyField` 注解

```java
public class Document {
    // 默认不做引用跟踪
    String title;

    // 为该字段启用引用跟踪
    @ForyField(trackingRef = true)
    Author author;

    // 如果多个文档共享同一组 Tag，可启用引用跟踪避免重复
    @ForyField(trackingRef = true)
    List<Tag> tags;
}
```

#### C++：`fory::field` 包装器

```cpp
struct Document {
    std::string title;

    // shared_ptr / SharedWeak 默认就会做引用跟踪
    std::shared_ptr<Author> author;
    fory::serialization::SharedWeak<Data> data;

    // 使用 field 包装器时也可以显式声明
    fory::field<std::shared_ptr<Tag>, 1, fory::ref> tag_owner;
};
FORY_STRUCT(Document, title, author, data, tag_owner);
```

如果想在 C++ 侧完全关闭引用跟踪，可以在构建序列化器时设置 `Fory::builder().track_ref(false)`。

#### Rust：字段属性

```rust
use fory::ForyObject;
use std::rc::Rc;

#[derive(ForyObject)]
struct Document {
    title: String,

    // Rc / Arc 默认启用引用跟踪
    author: Rc<Author>,

    // 显式开启引用跟踪
    #[fory(ref = true)]
    tags: Vec<Tag>,
}
```

#### Go：结构体 Tag

```go
type Document struct {
    Title string

    // 为结构体指针启用引用跟踪
    Author *Author `fory:"ref"`

    // 为 slice 启用引用跟踪
    Tags []Tag `fory:"ref"`
}
```

### 何时启用字段级引用跟踪

以下场景建议开启：

- 同一个对象实例可能在多个位置重复出现
- 字段处于循环引用链路上
- 字段中保存的是较大且可能被共享的对象

以下场景建议关闭或保持默认：

- 字段值始终唯一
- 字段是基础类型或简单值类型
- 字段不会参与对象共享

## 示例：共享引用

```java
public class Container {
    List<String> data;
    List<String> sameData;  // 指向同一个列表
}

Container obj = new Container();
obj.data = Arrays.asList("a", "b", "c");
obj.sameData = obj.data;  // 共享引用

// refTracking=true：data 只序列化一次，sameData 写入引用 ID
// refTracking=false：data 会被写两次
```

## 示例：循环引用

```java
public class Node {
    String value;
    Node next;
}

Node a = new Node("A");
Node b = new Node("B");
a.next = b;
b.next = a;  // 形成循环引用

// refTracking=true：可以正确处理
// refTracking=false：会导致无限递归错误
```

## 语言支持

| 语言 | 共享引用 | 循环引用 |
| --- | --- | --- |
| Java | 是 | 是 |
| Python | 是 | 是 |
| Go | 是 | 是 |
| C++ | 是 | 是 |
| JavaScript | 是 | 是 |
| Rust | 是 | 否（受所有权规则限制） |

## 性能考量

- **额外开销**：引用跟踪会为每个对象增加一次哈希查找
- **适合开启**：数据中存在共享引用或循环引用
- **适合关闭**：数据结构简单，不存在共享对象

## 相关主题

- [Field Nullability](field-nullability.md) - 可空性如何影响序列化
- [Serialization](serialization.md) - 跨语言序列化基础示例
- [Xlang Specification](../../specification/xlang_serialization_spec.md) - 二进制协议细节
