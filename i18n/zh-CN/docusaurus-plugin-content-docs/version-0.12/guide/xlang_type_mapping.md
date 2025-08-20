---
title: 跨语言类型映射
sidebar_position: 3
id: xlang_type_mapping
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

注意：

- 类型定义请参见 [规范中的类型系统](/specification/xlang_serialization_spec.md#type-systems)
- `int16_t[n]/vector<T>` 表示 `int16_t[n]/vector<int16_t>`
- 跨语言序列化功能尚不稳定，请勿在生产环境中使用。

## 类型映射

| Fory Type               | Fory Type ID | Java            | Python                            | Javascript      | C++                            | Golang           | Rust             |
| ----------------------- | ------------ | --------------- | --------------------------------- | --------------- | ------------------------------ | ---------------- | ---------------- |
| bool                    | 1            | bool/Boolean    | bool                              | Boolean         | bool                           | bool             | bool             |
| int8                    | 2            | byte/Byte       | int/pyfory.Int8                   | Type.int8()     | int8_t                         | int8             | i8               |
| int16                   | 3            | short/Short     | int/pyfory.Int16                  | Type.int16()    | int16_t                        | int16            | i6               |
| int32                   | 4            | int/Integer     | int/pyfory.Int32                  | Type.int32()    | int32_t                        | int32            | i32              |
| var_int32               | 5            | int/Integer     | int/pyfory.VarInt32               | Type.varint32() | fory::varint32_t               | fory.varint32    | fory::varint32   |
| int64                   | 6            | long/Long       | int/pyfory.Int64                  | Type.int64()    | int64_t                        | int64            | i64              |
| var_int64               | 7            | long/Long       | int/pyfory.VarInt64               | Type.varint64() | fory::varint64_t               | fory.varint64    | fory::varint64   |
| sli_int64               | 8            | long/Long       | int/pyfory.SliInt64               | Type.sliint64() | fory::sliint64_t               | fory.sliint64    | fory::sliint64   |
| float16                 | 9            | float/Float     | float/pyfory.Float16              | Type.float16()  | fory::float16_t                | fory.float16     | fory::f16        |
| float32                 | 10           | float/Float     | float/pyfory.Float32              | Type.float32()  | float                          | float32          | f32              |
| float64                 | 11           | double/Double   | float/pyfory.Float64              | Type.float64()  | double                         | float64          | f64              |
| string                  | 12           | String          | str                               | String          | string                         | string           | String/str       |
| enum                    | 13           | Enum subclasses | enum subclasses                   | /               | enum                           | /                | enum             |
| named_enum              | 14           | Enum subclasses | enum subclasses                   | /               | enum                           | /                | enum             |
| struct                  | 15           | pojo/record     | data class / type with type hints | object          | struct/class                   | struct           | struct           |
| compatible_struct       | 16           | pojo/record     | data class / type with type hints | object          | struct/class                   | struct           | struct           |
| named_struct            | 17           | pojo/record     | data class / type with type hints | object          | struct/class                   | struct           | struct           |
| named_compatible_struct | 18           | pojo/record     | data class / type with type hints | object          | struct/class                   | struct           | struct           |
| ext                     | 19           | pojo/record     | data class / type with type hints | object          | struct/class                   | struct           | struct           |
| named_ext               | 20           | pojo/record     | data class / type with type hints | object          | struct/class                   | struct           | struct           |
| list                    | 21           | List/Collection | list/tuple                        | array           | vector                         | slice            | Vec              |
| set                     | 22           | Set             | set                               | /               | set                            | fory.Set         | Set              |
| map                     | 23           | Map             | dict                              | Map             | unordered_map                  | map              | HashMap          |
| duration                | 24           | Duration        | timedelta                         | Number          | duration                       | Duration         | Duration         |
| timestamp               | 25           | Instant         | datetime                          | Number          | std::chrono::nanoseconds       | Time             | DateTime         |
| local_date              | 26           | Date            | datetime                          | Number          | std::chrono::nanoseconds       | Time             | DateTime         |
| decimal                 | 27           | BigDecimal      | Decimal                           | bigint          | /                              | /                | /                |
| binary                  | 28           | byte[]          | bytes                             | /               | `uint8_t[n]/vector<T>`         | `[n]uint8/[]T`   | `Vec<uint8_t>`   |
| array                   | 29           | array           | np.ndarray                        | /               | /                              | array/slice      | Vec              |
| bool_array              | 30           | bool[]          | ndarray(np.bool\_)                | /               | `bool[n]`                      | `[n]bool/[]T`    | `Vec<bool>`      |
| int8_array              | 31           | byte[]          | ndarray(int8)                     | /               | `int8_t[n]/vector<T>`          | `[n]int8/[]T`    | `Vec<i18>`       |
| int16_array             | 32           | short[]         | ndarray(int16)                    | /               | `int16_t[n]/vector<T>`         | `[n]int16/[]T`   | `Vec<i16>`       |
| int32_array             | 33           | int[]           | ndarray(int32)                    | /               | `int32_t[n]/vector<T>`         | `[n]int32/[]T`   | `Vec<i32>`       |
| int64_array             | 34           | long[]          | ndarray(int64)                    | /               | `int64_t[n]/vector<T>`         | `[n]int64/[]T`   | `Vec<i64>`       |
| float16_array           | 35           | float[]         | ndarray(float16)                  | /               | `fory::float16_t[n]/vector<T>` | `[n]float16/[]T` | `Vec<fory::f16>` |
| float32_array           | 36           | float[]         | ndarray(float32)                  | /               | `float[n]/vector<T>`           | `[n]float32/[]T` | `Vec<f32>`       |
| float64_array           | 37           | double[]        | ndarray(float64)                  | /               | `double[n]/vector<T>`          | `[n]float64/[]T` | `Vec<f64>`       |
| arrow record batch      | 38           | /               | /                                 | /               | /                              | /                | /                |
| arrow table             | 39           | /               | /                                 | /               | /                              | /                | /                |

## 类型信息（当前未实现）

由于各语言的类型系统存在差异，某些类型无法做到一一映射。

如果用户发现某一语言的类型在 Fory 类型系统中对应多个类型，例如 Java 中的 `long` 对应 `int64/varint64/sliint64`，这意味着该语言缺少某些类型，用户在使用 Fory 时需要额外提供类型信息。

## 类型注解

如果类型是另一个类的字段，用户可以为类型的字段或整个类型提供元信息提示。
这些信息在其他语言中也可以提供：

- Java：使用 annotation。
- C++：使用宏和模板。
- Golang：使用 struct tag。
- Python：使用 typehint。
- Rust：使用宏。

示例：

- Java:

  ```java
  class Foo {
    @Int32Type(varint = true)
    int f1;
    List<@Int32Type(varint = true) Integer> f2;
  }
  ```

- Python:

  ```python
  class Foo:
      f1: Int32Type(varint=True)
      f2: List[Int32Type(varint=True)]
  ```

## 类型包装器

如果类型不是类的字段，用户必须用 Fory 类型包装该类型以传递额外的类型信息。

例如，假设 Fory Java 提供了 `VarInt64` 类型，当用户调用 `fory.serialize(long_value)` 时，需要这样调用：`fory.serialize(new VarInt64(long_value))`。
