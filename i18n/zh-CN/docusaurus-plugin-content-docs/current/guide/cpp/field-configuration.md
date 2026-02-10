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

本页说明如何在 C++ 中配置序列化字段级元信息。

## 概述

Apache Fory™ 在编译期提供两种字段元信息配置方式：

1. **`fory::field<>` 模板**：在 struct 定义中内联声明元信息
2. **`FORY_FIELD_TAGS` 宏**：在 struct 外部附加元信息（非侵入）

这些机制可用于：

- **Tag ID**：为 schema 演进分配紧凑数值 ID
- **可空控制**：将指针字段标记为可空
- **引用跟踪**：为共享指针启用引用跟踪

## `fory::field` 模板

```cpp
template <typename T, int16_t Id, typename... Options>
class field;
```

### 模板参数

| 参数      | 说明                                          |
| --------- | --------------------------------------------- |
| `T`       | 底层字段类型                                  |
| `Id`      | 字段 tag ID（`int16_t`），用于紧凑序列化      |
| `Options` | 可选标签：`fory::nullable`、`fory::ref` 等    |

### 基本用法

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

struct Person {
  fory::field<std::string, 0> name;
  fory::field<int32_t, 1> age;
  fory::field<std::optional<std::string>, 2> nickname;
};
FORY_STRUCT(Person, name, age, nickname);
```

`fory::field<>` 是透明包装，可像底层类型一样使用：

```cpp
Person person;
person.name = "Alice";           // Direct assignment
person.age = 30;
std::string n = person.name;     // Implicit conversion
int a = person.age.get();        // Explicit get()
```

## 标签类型

### `fory::nullable`

将智能指针字段标记为可空（可为 `nullptr`）：

```cpp
struct Node {
  fory::field<std::string, 0> name;
  fory::field<std::shared_ptr<Node>, 1, fory::nullable> next;  // Can be nullptr
};
FORY_STRUCT(Node, name, next);
```

**适用类型：** `std::shared_ptr<T>`、`std::unique_ptr<T>`

**说明：** 对原生值类型或字符串的可空语义，请使用 `std::optional<T>`：

```cpp
// Correct: use std::optional for nullable primitives
fory::field<std::optional<int32_t>, 0> optional_value;

// Wrong: nullable is not allowed for primitives
// fory::field<int32_t, 0, fory::nullable> value;  // Compile error!
```

### `fory::not_null`

显式声明指针字段不可空。虽然这是智能指针的默认行为，但可用于增强可读性：

```cpp
fory::field<std::shared_ptr<Data>, 0, fory::not_null> data;  // Must not be nullptr
```

**适用类型：** `std::shared_ptr<T>`、`std::unique_ptr<T>`

### `fory::ref`

为共享指针字段启用引用跟踪。多个字段引用同一对象时，仅序列化一次并保持共享关系：

```cpp
struct Graph {
  fory::field<std::string, 0> name;
  fory::field<std::shared_ptr<Graph>, 1, fory::ref> left;    // Ref tracked
  fory::field<std::shared_ptr<Graph>, 2, fory::ref> right;   // Ref tracked
};
FORY_STRUCT(Graph, name, left, right);
```

**适用类型：** 仅 `std::shared_ptr<T>`（需要共享所有权）

### 组合标签

共享指针可组合多个标签：

```cpp
// Nullable + ref tracking
fory::field<std::shared_ptr<Node>, 0, fory::nullable, fory::ref> link;
```

## 类型规则

| 类型                  | 可用选项            | 可空语义                                  |
| --------------------- | ------------------- | ----------------------------------------- |
| 原生类型、字符串      | 无                  | 若需可空请使用 `std::optional<T>`         |
| `std::optional<T>`    | 无                  | 天然可空                                  |
| `std::shared_ptr<T>`  | `nullable`、`ref`   | 默认不可空                                |
| `std::unique_ptr<T>`  | `nullable`          | 默认不可空                                |

## 完整示例

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// Define a struct with various field configurations
struct Document {
  // Required fields (non-nullable)
  fory::field<std::string, 0> title;
  fory::field<int32_t, 1> version;

  // Optional primitive using std::optional
  fory::field<std::optional<std::string>, 2> description;

  // Nullable pointer
  fory::field<std::unique_ptr<std::string>, 3, fory::nullable> metadata;

  // Reference-tracked shared pointer
  fory::field<std::shared_ptr<Document>, 4, fory::ref> parent;

  // Nullable + reference-tracked
  fory::field<std::shared_ptr<Document>, 5, fory::nullable, fory::ref> related;
};
FORY_STRUCT(Document, title, version, description, metadata, parent, related);

int main() {
  auto fory = Fory::builder().xlang(true).build();
  fory.register_struct<Document>(100);

  Document doc;
  doc.title = "My Document";
  doc.version = 1;
  doc.description = "A sample document";
  doc.metadata = nullptr;  // Allowed because nullable
  doc.parent = std::make_shared<Document>();
  doc.parent->title = "Parent Doc";
  doc.related = nullptr;  // Allowed because nullable

  auto bytes = fory.serialize(doc).value();
  auto decoded = fory.deserialize<Document>(bytes).value();
}
```

## 编译期校验

非法配置会在编译期报错：

```cpp
// Error: nullable and not_null are mutually exclusive
fory::field<std::shared_ptr<int>, 0, fory::nullable, fory::not_null> bad1;

// Error: nullable only valid for smart pointers
fory::field<int32_t, 0, fory::nullable> bad2;

// Error: ref only valid for shared_ptr
fory::field<std::unique_ptr<int>, 0, fory::ref> bad3;

// Error: options not allowed for std::optional (inherently nullable)
fory::field<std::optional<int>, 0, fory::nullable> bad4;
```

## 向后兼容

未使用 `fory::field<>` 包装的旧 struct 仍可正常工作：

```cpp
// Old style - still works
struct LegacyPerson {
  std::string name;
  int32_t age;
};
FORY_STRUCT(LegacyPerson, name, age);

// New style with field metadata
struct ModernPerson {
  fory::field<std::string, 0> name;
  fory::field<int32_t, 1> age;
};
FORY_STRUCT(ModernPerson, name, age);
```

## `FORY_FIELD_TAGS` 宏

`FORY_FIELD_TAGS` 提供了一种非侵入式方案：无需修改 struct 定义即可附加字段元信息。适用场景：

- **第三方类型**：为非自有类型添加元信息
- **纯净结构定义**：保持 struct 仅包含标准 C++ 类型
- **依赖隔离**：将 Fory 头文件限制在序列化配置文件中

### 用法

```cpp
// user_types.h - NO fory headers needed!
struct Document {
  std::string title;
  int32_t version;
  std::optional<std::string> description;
  std::shared_ptr<User> author;
  std::shared_ptr<User> reviewer;
  std::shared_ptr<Document> parent;
  std::unique_ptr<Data> data;
};

// serialization_config.cpp - fory config isolated here
#include "fory/serialization/fory.h"
#include "user_types.h"

FORY_STRUCT(Document, title, version, description, author, reviewer, parent, data)

FORY_FIELD_TAGS(Document,
  (title, 0),                      // string: non-nullable
  (version, 1),                    // int: non-nullable
  (description, 2),                // optional: inherently nullable
  (author, 3),                     // shared_ptr: non-nullable (default)
  (reviewer, 4, nullable),         // shared_ptr: nullable
  (parent, 5, ref),                // shared_ptr: non-nullable, with ref tracking
  (data, 6, nullable)              // unique_ptr: nullable
)
```

### `FORY_FIELD_TAGS` 选项

| 字段类型              | 合法组合                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- |
| 原生类型、字符串      | 仅 `(field, id)`                                                                           |
| `std::optional<T>`    | 仅 `(field, id)`                                                                           |
| `std::shared_ptr<T>`  | `(field, id)`、`(field, id, nullable)`、`(field, id, ref)`、`(field, id, nullable, ref)` |
| `std::unique_ptr<T>`  | `(field, id)`、`(field, id, nullable)`                                                     |

### API 对比

| 维度                 | `fory::field<>` 包装        | `FORY_FIELD_TAGS` 宏        |
| -------------------- | --------------------------- | --------------------------- |
| **结构定义**         | 需要改动（包装字段类型）     | 无需改动（保持纯 C++）       |
| **IDE 体验**         | 有模板噪音                  | 更清晰（原生字段类型）      |
| **第三方类型**       | 不支持                      | 支持                        |
| **头文件依赖**       | 各处都需要                  | 可集中在配置文件             |
| **迁移成本**         | 高（修改全部字段）          | 低（新增一个宏）             |

## `FORY_FIELD_CONFIG` 宏

`FORY_FIELD_CONFIG` 是更强、更灵活的字段配置方式，提供：

- **Builder 风格 API**：链式配置 `F(id).option1().option2()`
- **编码控制**：指定无符号整数编码（varint、fixed、tagged）
- **编译期校验**：通过成员指针校验字段名
- **跨语言兼容**：按 Java、Rust 等语言期望配置编码

### 基本语法

```cpp
FORY_FIELD_CONFIG(StructType,
    (field1, fory::F(0)),                           // Simple: just ID
    (field2, fory::F(1).nullable()),                // With nullable
    (field3, fory::F(2).varint()),                  // With encoding
    (field4, fory::F(3).nullable().ref()),          // Multiple options
    (field5, 4)                                     // Backward compatible: integer ID
);
```

### `F()` Builder

`fory::F(id)` 工厂函数会创建支持链式调用的 `FieldMeta` 对象：

```cpp
fory::F(0)                    // Create with field ID 0
    .nullable()               // Mark as nullable
    .ref()                    // Enable reference tracking
    .varint()                 // Use variable-length encoding
    .fixed()                  // Use fixed-size encoding
    .tagged()                 // Use tagged encoding
    .monomorphic()            // Mark as monomorphic type
    .compress(false)          // Disable compression
```

**提示：** 若希望省略 `fory::` 前缀，可添加 `using` 声明：

```cpp
using fory::F;

FORY_FIELD_CONFIG(MyStruct,
    (field1, F(0).varint()),      // No prefix needed
    (field2, F(1).nullable())
);
```

### 无符号整数编码选项

对于 `uint32_t` 与 `uint64_t` 字段，可显式指定线格式编码：

| 方法        | Type ID       | 说明                                       | 适用场景                           |
| ----------- | ------------- | ------------------------------------------ | ---------------------------------- |
| `.varint()` | VAR_UINT32/64 | 变长编码（1-5 或 1-10 字节）              | 数值通常较小                       |
| `.fixed()`  | UINT32/64     | 定长编码（固定 4 或 8 字节）              | 数值分布较均匀                     |
| `.tagged()` | TAGGED_UINT64 | 带大小提示的混合编码（仅 uint64）         | 小值与大值混合（uint64）           |

**说明：** `uint8_t` 与 `uint16_t` 始终使用定长编码（UINT8、UINT16）。

### 完整示例

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// Define struct with unsigned integer fields
struct MetricsData {
  // Counters - often small values, use varint for space efficiency
  uint32_t requestCount;
  uint64_t bytesSent;

  // IDs - uniformly distributed, use fixed for consistent performance
  uint32_t userId;
  uint64_t sessionId;

  // Timestamps - use tagged encoding for mixed value ranges
  uint64_t createdAt;

  // Nullable fields
  std::optional<uint32_t> errorCount;
  std::optional<uint64_t> lastAccessTime;
};

FORY_STRUCT(MetricsData, requestCount, bytesSent, userId, sessionId,
            createdAt, errorCount, lastAccessTime);

// Configure field encoding
FORY_FIELD_CONFIG(MetricsData,
    // Small counters - varint saves space
    (requestCount, fory::F(0).varint()),
    (bytesSent, fory::F(1).varint()),

    // IDs - fixed for consistent performance
    (userId, fory::F(2).fixed()),
    (sessionId, fory::F(3).fixed()),

    // Timestamp - tagged encoding
    (createdAt, fory::F(4).tagged()),

    // Nullable fields
    (errorCount, fory::F(5).nullable().varint()),
    (lastAccessTime, fory::F(6).nullable().tagged())
);

int main() {
  auto fory = Fory::builder().xlang(true).build();
  fory.register_struct<MetricsData>(100);

  MetricsData data{
      .requestCount = 42,
      .bytesSent = 1024,
      .userId = 12345678,
      .sessionId = 9876543210,
      .createdAt = 1704067200000000000ULL, // 2024-01-01 in nanoseconds
      .errorCount = 3,
      .lastAccessTime = std::nullopt
  };

  auto bytes = fory.serialize(data).value();
  auto decoded = fory.deserialize<MetricsData>(bytes).value();
}
```

### 跨语言兼容

当序列化数据会被其他语言读取时，建议通过 `FORY_FIELD_CONFIG` 显式匹配目标语言编码约定。

**Java 兼容示例：**

```cpp
// Java uses these type IDs for unsigned integers:
// - Byte (u8): UINT8 (fixed)
// - Short (u16): UINT16 (fixed)
// - Integer (u32): VAR_UINT32 (varint) or UINT32 (fixed)
// - Long (u64): VAR_UINT64 (varint), UINT64 (fixed), or TAGGED_UINT64

struct JavaCompatible {
  uint8_t byteField;      // Maps to Java Byte
  uint16_t shortField;    // Maps to Java Short
  uint32_t intVarField;   // Maps to Java Integer with varint
  uint32_t intFixedField; // Maps to Java Integer with fixed
  uint64_t longVarField;  // Maps to Java Long with varint
  uint64_t longTagged;    // Maps to Java Long with tagged
};

FORY_STRUCT(JavaCompatible, byteField, shortField, intVarField,
            intFixedField, longVarField, longTagged);

FORY_FIELD_CONFIG(JavaCompatible,
    (byteField, fory::F(0)),                    // UINT8 (auto)
    (shortField, fory::F(1)),                   // UINT16 (auto)
    (intVarField, fory::F(2).varint()),         // VAR_UINT32
    (intFixedField, fory::F(3).fixed()),        // UINT32
    (longVarField, fory::F(4).varint()),        // VAR_UINT64
    (longTagged, fory::F(5).tagged())           // TAGGED_UINT64
);
```

### 使用 `FORY_FIELD_CONFIG` 做 Schema 演进

在兼容模式下，发送端和接收端可以对字段使用不同可空策略：

```cpp
// Version 1: All fields non-nullable
struct DataV1 {
  uint32_t id;
  uint64_t timestamp;
};
FORY_STRUCT(DataV1, id, timestamp);
FORY_FIELD_CONFIG(DataV1,
    (id, fory::F(0).varint()),
    (timestamp, fory::F(1).tagged())
);

// Version 2: Added nullable fields
struct DataV2 {
  uint32_t id;
  uint64_t timestamp;
  std::optional<uint32_t> version;  // New nullable field
};
FORY_STRUCT(DataV2, id, timestamp, version);
FORY_FIELD_CONFIG(DataV2,
    (id, fory::F(0).varint()),
    (timestamp, fory::F(1).tagged()),
    (version, fory::F(2).nullable().varint())  // New field with nullable
);
```

### `FORY_FIELD_CONFIG` 选项速查

| 方法              | 说明                                   | 适用范围                  |
| ----------------- | -------------------------------------- | ------------------------- |
| `.nullable()`     | 将字段标记为可空                        | 智能指针、可空值类型       |
| `.ref()`          | 启用引用跟踪                            | 仅 `std::shared_ptr`      |
| `.monomorphic()`  | 标记指针始终指向单一类型                | 智能指针                  |
| `.varint()`       | 变长编码                                | `uint32_t`、`uint64_t`    |
| `.fixed()`        | 定长编码                                | `uint32_t`、`uint64_t`    |
| `.tagged()`       | tagged 混合编码                         | 仅 `uint64_t`             |
| `.compress(v)`    | 启用/禁用字段压缩                       | 所有类型                  |

### 字段配置方案对比

| 特性                    | `fory::field<>`       | `FORY_FIELD_TAGS`        | `FORY_FIELD_CONFIG`             |
| ----------------------- | --------------------- | ------------------------ | ------------------------------- |
| **需要修改 struct**     | 是（包装字段类型）     | 否                       | 否                              |
| **编码控制**            | 否                    | 否                       | 是（varint/fixed/tagged）       |
| **Builder 风格**        | 否                    | 否                       | 是                              |
| **编译期校验**          | 是                    | 有限                     | 是（成员指针校验）              |
| **跨语言兼容能力**      | 有限                  | 有限                     | 完整                            |
| **推荐场景**            | 简单结构体            | 第三方类型               | 复杂/跨语言结构体               |

## 相关主题

- [类型注册](type-registration.md) - 使用 FORY_STRUCT 注册类型
- [Schema 演进](schema-evolution.md) - 基于 tag ID 的演进策略
- [配置](configuration.md) - 全局启用引用跟踪等选项
- [跨语言](cross-language.md) - 与 Java、Rust、Python 的互操作
