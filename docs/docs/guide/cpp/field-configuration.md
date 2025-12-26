---
title: Field Configuration
sidebar_position: 5
id: cpp_field_configuration
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

This page explains how to configure field-level metadata for serialization.

## Overview

Apache Fory™ provides two ways to specify field-level metadata at compile time:

1. **`fory::field<>` template** - Inline metadata in struct definition
2. **`FORY_FIELD_TAGS` macro** - Non-invasive metadata added separately

These enable:

- **Tag IDs**: Assign compact numeric IDs for schema evolution
- **Nullability**: Mark pointer fields as nullable
- **Reference Tracking**: Enable reference tracking for shared pointers

## The fory::field Template

```cpp
template <typename T, int16_t Id, typename... Options>
class field;
```

### Template Parameters

| Parameter | Description                                      |
| --------- | ------------------------------------------------ |
| `T`       | The underlying field type                        |
| `Id`      | Field tag ID (int16_t) for compact serialization |
| `Options` | Optional tags: `fory::nullable`, `fory::ref`     |

### Basic Usage

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

The `fory::field<>` wrapper is transparent - you can use it like the underlying type:

```cpp
Person person;
person.name = "Alice";           // Direct assignment
person.age = 30;
std::string n = person.name;     // Implicit conversion
int a = person.age.get();        // Explicit get()
```

## Tag Types

### fory::nullable

Marks a smart pointer field as nullable (can be `nullptr`):

```cpp
struct Node {
  fory::field<std::string, 0> name;
  fory::field<std::shared_ptr<Node>, 1, fory::nullable> next;  // Can be nullptr
};
FORY_STRUCT(Node, name, next);
```

**Valid for:** `std::shared_ptr<T>`, `std::unique_ptr<T>`

**Note:** For nullable primitives or strings, use `std::optional<T>` instead:

```cpp
// Correct: use std::optional for nullable primitives
fory::field<std::optional<int32_t>, 0> optional_value;

// Wrong: nullable is not allowed for primitives
// fory::field<int32_t, 0, fory::nullable> value;  // Compile error!
```

### fory::not_null

Explicitly marks a pointer field as non-nullable. This is the default for smart pointers, but can be used for documentation:

```cpp
fory::field<std::shared_ptr<Data>, 0, fory::not_null> data;  // Must not be nullptr
```

**Valid for:** `std::shared_ptr<T>`, `std::unique_ptr<T>`

### fory::ref

Enables reference tracking for shared pointer fields. When multiple fields reference the same object, it will be serialized once and shared:

```cpp
struct Graph {
  fory::field<std::string, 0> name;
  fory::field<std::shared_ptr<Graph>, 1, fory::ref> left;    // Ref tracked
  fory::field<std::shared_ptr<Graph>, 2, fory::ref> right;   // Ref tracked
};
FORY_STRUCT(Graph, name, left, right);
```

**Valid for:** `std::shared_ptr<T>` only (requires shared ownership)

### Combining Tags

Multiple tags can be combined for shared pointers:

```cpp
// Nullable + ref tracking
fory::field<std::shared_ptr<Node>, 0, fory::nullable, fory::ref> link;
```

## Type Rules

| Type                 | Allowed Options   | Nullability                        |
| -------------------- | ----------------- | ---------------------------------- |
| Primitives, strings  | None              | Use `std::optional<T>` if nullable |
| `std::optional<T>`   | None              | Inherently nullable                |
| `std::shared_ptr<T>` | `nullable`, `ref` | Non-null by default                |
| `std::unique_ptr<T>` | `nullable`        | Non-null by default                |

## Complete Example

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

## Compile-Time Validation

Invalid configurations are caught at compile time:

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

## Backwards Compatibility

Existing structs without `fory::field<>` wrappers continue to work:

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

## FORY_FIELD_TAGS Macro

The `FORY_FIELD_TAGS` macro provides a non-invasive way to add field metadata without modifying struct definitions. This is useful for:

- **Third-party types**: Add metadata to types you don't own
- **Clean structs**: Keep struct definitions as pure C++
- **Isolated dependencies**: Confine Fory headers to serialization config files

### Usage

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

### FORY_FIELD_TAGS Options

| Field Type           | Valid Combinations                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Primitives, strings  | `(field, id)` only                                                                       |
| `std::optional<T>`   | `(field, id)` only                                                                       |
| `std::shared_ptr<T>` | `(field, id)`, `(field, id, nullable)`, `(field, id, ref)`, `(field, id, nullable, ref)` |
| `std::unique_ptr<T>` | `(field, id)`, `(field, id, nullable)`                                                   |

### API Comparison

| Aspect                  | `fory::field<>` Wrapper  | `FORY_FIELD_TAGS` Macro |
| ----------------------- | ------------------------ | ----------------------- |
| **Struct definition**   | Modified (wrapped types) | Unchanged (pure C++)    |
| **IDE support**         | Template noise           | Excellent (clean types) |
| **Third-party classes** | Not supported            | Supported               |
| **Header dependencies** | Required everywhere      | Isolated to config      |
| **Migration effort**    | High (change all fields) | Low (add one macro)     |

## Related Topics

- [Type Registration](type-registration.md) - Registering types with FORY_STRUCT
- [Schema Evolution](schema-evolution.md) - Using tag IDs for schema evolution
- [Configuration](configuration.md) - Enabling reference tracking globally
