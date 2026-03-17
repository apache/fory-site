---
title: 字段可空性
sidebar_position: 40
id: field_nullability
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

本页说明 Fory 在跨语言（xlang）序列化模式下如何处理字段可空性。

## 默认行为

在 xlang 模式下，**字段默认都是不可空的**。这意味着：

- 字段值必须始终存在，不能为 null
- 不会为该字段额外写入 null 标记字节
- 序列化结果更紧凑

以下类型默认是可空的：

- Java 和 C++ 可空包装类型：`Optional<T>`
- Java 装箱类型（`Integer`、`Long`、`Double` 等）
- Go 指针类型（`*int32`、`*string` 等）
- Rust `Option<T>`
- Python 类型提示：`Optional[T]`

| 字段类型 | 默认可空 | 是否写入 null 标记 |
| --- | --- | --- |
| 基础类型（`int`、`bool`、`float` 等） | 否 | 否 |
| `String` | 否 | 否 |
| `List<T>`、`Map<K,V>`、`Set<T>` | 否 | 否 |
| 自定义结构体 | 否 | 否 |
| 枚举 | 否 | 否 |
| Java 装箱类型（`Integer`、`Long` 等） | 是 | 是 |
| Go 指针类型（`*int32`、`*string`） | 是 | 是 |
| `Optional<T>` / `Option<T>` | 是 | 是 |

## 编码格式

字段是否可空决定了值前面是否需要写入 **null 标记字节**：

```text
不可空字段: [value data]
可空字段:   [null_flag] [value data if not null]
```

其中 `null_flag` 的含义如下：

- `-1`（`NULL_FLAG`）：值为 null
- `-2`（`NOT_NULL_VALUE_FLAG`）：值存在

## 可空性与引用跟踪

这两个概念相关，但并不相同：

| 概念 | 目的 | 标记值 |
| --- | --- | --- |
| **可空性** | 允许字段值为 null | `-1`（null）、`-2`（非 null） |
| **引用跟踪** | 对共享引用做去重 | `-1`（null）、`-2`（非 null）、`≥0`（引用 ID） |

关键区别：

- **仅可空**：只会写入 `-1` 或 `-2`，不会去重共享引用。
- **引用跟踪**：在可空语义之上增加引用 ID（`≥0`），用于表示已出现过的对象。
- 二者占用的是同一个标记字节位置，引用跟踪可以理解为可空机制的超集。

当 `refTracking=true` 时，这个标记字节会同时承担引用标记的职责：

```text
ref_flag = -1  -> null 值
ref_flag = -2  -> 新对象（第一次出现）
ref_flag >= 0  -> 指向索引为 ref_flag 的已序列化对象
```

更详细的引用跟踪行为可参考 [Reference Tracking](field-reference-tracking.md)。

## 各语言示例

### Java

```java
public class Person {
    // xlang 模式下默认不可空
    String name;        // 不能为 null
    int age;            // 基础类型，始终不可空
    List<String> tags;  // 不能为 null

    // 显式声明为可空
    @ForyField(nullable = true)
    String nickname;    // 可以为 null

    // Optional 包装类型默认可空
    Optional<String> bio; // 可以为空
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .build();
fory.register(Person.class, "example.Person");
```

### Python

```python
from dataclasses import dataclass
from typing import Optional, List
import pyfory

@dataclass
class Person:
    # 默认不可空
    name: str
    age: pyfory.int32
    tags: List[str]

    # Optional 表示可空
    nickname: Optional[str] = None
    bio: Optional[str] = None

fory = pyfory.Fory(xlang=True)
fory.register_type(Person, typename="example.Person")
```

### Rust

```rust
use fory::{Fory, ForyObject};

#[derive(ForyObject)]
struct Person {
    // 默认不可空
    name: String,
    age: i32,
    tags: Vec<String>,

    // Option<T> 默认可空
    nickname: Option<String>,
    bio: Option<String>,
}
```

### Go

```go
type Person struct {
    // 默认不可空
    Name string
    Age  int32
    Tags []string

    // 指针类型可表示可空字段
    Nickname *string
    Bio      *string
}

fory := forygo.NewFory(forygo.WithXlang(true))
fory.RegisterNamedStruct(Person{}, "example.Person")
```

### C++

```cpp
struct Person {
    // 默认不可空
    std::string name;
    int32_t age;
    std::vector<std::string> tags;

    // 使用 std::optional 表示可空
    std::optional<std::string> nickname;
    std::optional<std::string> bio;
};
FORY_STRUCT(Person, name, age, tags, nickname, bio);
```

## 自定义可空性

### Java：`@ForyField` 注解

```java
public class Config {
    @ForyField(nullable = true)
    String optionalSetting;  // 显式可空

    @ForyField(nullable = false)
    String requiredSetting;  // 显式不可空（也是默认行为）
}
```

### C++：`fory::field` 包装器

```cpp
struct Config {
    // 显式声明为可空
    fory::field<std::string, 1, fory::nullable<true>> optional_setting;

    // 显式声明为不可空
    fory::field<std::string, 2, fory::nullable<false>> required_setting;
};
FORY_STRUCT(Config, optional_setting, required_setting);
```

## null 值处理

当不可空字段收到 null 值时，各语言的表现通常如下：

| 语言 | 行为 |
| --- | --- |
| Java | 抛出 `NullPointerException` 或序列化错误 |
| Python | 抛出 `TypeError` 或序列化错误 |
| Rust | 编译期就不允许把 `None` 赋给非 `Option` 字段 |
| Go | 使用零值（空字符串、0 等） |
| C++ | 使用默认构造值，或出现未定义行为 |

## Schema 兼容性

可空标记是结构体 Schema 指纹的一部分。修改字段的可空性属于**破坏性变更**，会导致 Schema 版本不匹配。

```text
Schema A: { name: String (不可空) }
Schema B: { name: String (可空) }
// 两者的指纹不同，因此不兼容
```

## 最佳实践

1. 默认优先使用不可空字段，只在 null 具有明确语义时再声明为可空。
2. 优先使用 `Optional<T>` / `Option<T>` 这类包装类型，而不是原始类型加注解。
3. 跨语言字段要保持一致的可空语义。
4. 在 API 或文档中明确说明哪些字段允许为 null。

## 相关主题

- [Reference Tracking](field-reference-tracking.md) - 共享引用与循环引用处理
- [Serialization](serialization.md) - 跨语言序列化基础
- [Type Mapping](../../specification/xlang_type_mapping.md) - 跨语言类型映射
- [Xlang Specification](../../specification/xlang_serialization_spec.md) - 二进制协议细节
