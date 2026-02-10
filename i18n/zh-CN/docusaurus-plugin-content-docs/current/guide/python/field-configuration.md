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

本页说明如何在 Python 中配置序列化字段级元信息。

## 概述

Apache ForyTM 通过以下机制提供字段级配置：

- **`pyfory.field()`**：配置字段元信息（id、nullable、ref、ignore、dynamic）
- **类型注解**：控制整数编码（varint、fixed、tagged）
- **`Optional[T]`**：标记字段可空

这些能力可用于：

- **Tag ID**：分配紧凑数值 ID，降低 struct 字段元信息开销
- **可空控制**：声明字段是否可为 null/None
- **引用跟踪**：为共享对象启用引用跟踪
- **字段跳过**：从序列化中排除字段
- **编码控制**：指定整数编码方式（varint、fixed、tagged）
- **多态控制**：控制 struct 字段是否写入类型信息

## 基本语法

结合 `@dataclass`、类型注解与 `pyfory.field()`：

```python
from dataclasses import dataclass
from typing import Optional
import pyfory

@dataclass
class Person:
    name: str = pyfory.field(id=0)
    age: pyfory.int32 = pyfory.field(id=1, default=0)
    nickname: Optional[str] = pyfory.field(id=2, nullable=True, default=None)
```

## `pyfory.field()` 函数

使用 `pyfory.field()` 配置字段级元信息：

```python
@dataclass
class User:
    id: pyfory.int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)
    friends: List["User"] = pyfory.field(id=3, ref=True, default_factory=list)
    _cache: dict = pyfory.field(ignore=True, default_factory=dict)
```

### 参数

| 参数              | 类型       | 默认值    | 说明                                 |
| ----------------- | ---------- | --------- | ------------------------------------ |
| `id`              | `int`      | `-1`      | 字段 tag ID（`-1` 表示使用字段名）   |
| `nullable`        | `bool`     | `False`   | 字段是否可为 null/None               |
| `ref`             | `bool`     | `False`   | 是否启用引用跟踪                     |
| `ignore`          | `bool`     | `False`   | 是否从序列化中排除                   |
| `dynamic`         | `bool`     | `None`    | 控制是否写入类型信息                 |
| `default`         | Any        | `MISSING` | 字段默认值                           |
| `default_factory` | Callable   | `MISSING` | 默认值工厂函数                       |

## 字段 ID（`id`）

通过给字段分配数值 ID，可减少 struct 字段元信息开销：

```python
@dataclass
class User:
    id: pyfory.int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    age: pyfory.int32 = pyfory.field(id=2, default=0)
```

**收益：**

- 序列化体积更小（元信息中数值 ID 替代字段名）
- struct 字段元信息开销更低
- 字段重命名时可保持二进制兼容

**建议：** 兼容模式下建议配置字段 ID，以降低序列化成本。

**注意：**

- 同一类内 ID 必须唯一
- ID 必须 `>= 0`（`-1` 表示使用字段名编码，默认行为）
- 未指定时会使用字段名写入元信息（开销更大）

**不配置字段 ID**（元信息使用字段名）示例：

```python
@dataclass
class User:
    id: pyfory.int64 = 0
    name: str = ""
```

## 可空字段（`nullable`）

对可能为 `None` 的字段使用 `nullable=True`：

```python
from typing import Optional

@dataclass
class Record:
    # 可空字符串字段
    optional_name: Optional[str] = pyfory.field(id=0, nullable=True, default=None)

    # 可空整数字段
    optional_count: Optional[pyfory.int32] = pyfory.field(id=1, nullable=True, default=None)
```

**注意：**

- `Optional[T]` 字段应配合 `nullable=True`
- 非 Optional 字段默认 `nullable=False`

## 引用跟踪（`ref`）

对于可能共享或循环引用的字段启用引用跟踪：

```python
@dataclass
class RefOuter:
    # 两个字段可能指向同一个内部对象
    inner1: Optional[RefInner] = pyfory.field(id=0, ref=True, nullable=True, default=None)
    inner2: Optional[RefInner] = pyfory.field(id=1, ref=True, nullable=True, default=None)


@dataclass
class CircularRef:
    name: str = pyfory.field(id=0, default="")
    # 自引用字段，用于循环引用
    self_ref: Optional["CircularRef"] = pyfory.field(id=1, ref=True, nullable=True, default=None)
```

**适用场景：**

- 字段可能形成循环或共享关系
- 同一对象被多个字段引用

**注意：**

- 只有全局设置 `Fory(ref=True)` 时，引用跟踪才生效
- 字段级 `ref=True` 与全局 `ref=True` 必须同时开启

## 跳过字段（`ignore`）

将字段排除在序列化之外：

```python
@dataclass
class User:
    id: pyfory.int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    # 不序列化
    _cache: dict = pyfory.field(ignore=True, default_factory=dict)
    _internal_state: str = pyfory.field(ignore=True, default="")
```

## Dynamic 字段（`dynamic`）

控制 struct 字段是否写入类型信息，这是支持多态的关键：

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

@dataclass
class Circle(Shape):
    radius: float = 0.0

    def area(self) -> float:
        return 3.14159 * self.radius * self.radius

@dataclass
class Container:
    # 抽象类：dynamic 总为 True（写类型信息）
    shape: Shape = pyfory.field(id=0)

    # 对具体类型强制写类型信息（支持运行时子类）
    circle: Circle = pyfory.field(id=1, dynamic=True)

    # 对具体类型跳过类型信息（按声明类型处理）
    fixed_circle: Circle = pyfory.field(id=2, dynamic=False)
```

**默认行为：**

| 模式        | 抽象类 | 具体对象类型 | 数值/str/time 类型 |
| ----------- | ------ | ------------ | ------------------ |
| Native 模式 | `True` | `True`       | `False`            |
| Xlang 模式  | `True` | `False`      | `False`            |

**注意：**

- **抽象类**：`dynamic` 始终为 `True`（必须写类型信息）
- **Native 模式**：对象类型默认 `dynamic=True`；数值/str/time 默认 `False`
- **Xlang 模式**：具体类型默认 `dynamic=False`
- 当具体字段可能持有子类实例时，使用 `dynamic=True`
- 当类型固定且追求性能时，可使用 `dynamic=False`

## 整数类型注解

Fory 提供类型注解来控制整数编码。

### 有符号整数

```python
@dataclass
class SignedIntegers:
    byte_val: pyfory.int8 = 0      # 8-bit signed
    short_val: pyfory.int16 = 0    # 16-bit signed
    int_val: pyfory.int32 = 0      # 32-bit signed (varint encoding)
    long_val: pyfory.int64 = 0     # 64-bit signed (varint encoding)
```

### 无符号整数

```python
@dataclass
class UnsignedIntegers:
    # Fixed-size encoding
    u8_val: pyfory.uint8 = 0       # 8-bit unsigned (fixed)
    u16_val: pyfory.uint16 = 0     # 16-bit unsigned (fixed)

    # Variable-length encoding (default for u32/u64)
    u32_var: pyfory.uint32 = 0     # 32-bit unsigned (varint)
    u64_var: pyfory.uint64 = 0     # 64-bit unsigned (varint)

    # Explicit fixed-size encoding
    u32_fixed: pyfory.fixed_uint32 = 0   # 32-bit unsigned (fixed 4 bytes)
    u64_fixed: pyfory.fixed_uint64 = 0   # 64-bit unsigned (fixed 8 bytes)

    # Tagged encoding (includes type tag)
    u64_tagged: pyfory.tagged_uint64 = 0  # 64-bit unsigned (tagged)
```

### 浮点数

```python
@dataclass
class FloatingPoint:
    float_val: pyfory.float32 = 0.0   # 32-bit float
    double_val: pyfory.float64 = 0.0  # 64-bit double
```

### 编码汇总

| 类型                   | 编码    | 大小       |
| ---------------------- | ------- | ---------- |
| `pyfory.int8`          | fixed   | 1 字节     |
| `pyfory.int16`         | fixed   | 2 字节     |
| `pyfory.int32`         | varint  | 1-5 字节   |
| `pyfory.int64`         | varint  | 1-10 字节  |
| `pyfory.uint8`         | fixed   | 1 字节     |
| `pyfory.uint16`        | fixed   | 2 字节     |
| `pyfory.uint32`        | varint  | 1-5 字节   |
| `pyfory.uint64`        | varint  | 1-10 字节  |
| `pyfory.fixed_uint32`  | fixed   | 4 字节     |
| `pyfory.fixed_uint64`  | fixed   | 8 字节     |
| `pyfory.tagged_uint64` | tagged  | 1-9 字节   |
| `pyfory.float32`       | fixed   | 4 字节     |
| `pyfory.float64`       | fixed   | 8 字节     |

**何时使用：**

- `varint`：适合小值占多数的场景（int32/int64/uint32/uint64 默认）
- `fixed`：适合覆盖全值域的场景（例如时间戳、哈希）
- `tagged`：适合需要保留类型信息的场景（仅 uint64）

## 完整示例

```python
from dataclasses import dataclass
from typing import Optional, List, Dict, Set
import pyfory


@dataclass
class Document:
    # Fields with tag IDs (recommended for compatible mode)
    title: str = pyfory.field(id=0, default="")
    version: pyfory.int32 = pyfory.field(id=1, default=0)

    # Nullable field
    description: Optional[str] = pyfory.field(id=2, nullable=True, default=None)

    # Collection fields
    tags: List[str] = pyfory.field(id=3, default_factory=list)
    metadata: Dict[str, str] = pyfory.field(id=4, default_factory=dict)
    categories: Set[str] = pyfory.field(id=5, default_factory=set)

    # Unsigned integers with different encodings
    view_count: pyfory.uint64 = pyfory.field(id=6, default=0)           # varint encoding
    file_size: pyfory.fixed_uint64 = pyfory.field(id=7, default=0)      # fixed encoding
    checksum: pyfory.tagged_uint64 = pyfory.field(id=8, default=0)      # tagged encoding

    # Reference-tracked field for shared/circular references
    parent: Optional["Document"] = pyfory.field(id=9, ref=True, nullable=True, default=None)

    # Ignored field (not serialized)
    _cache: dict = pyfory.field(ignore=True, default_factory=dict)


def main():
    fory = pyfory.Fory(xlang=True, compatible=True, ref=True)
    fory.register_type(Document, type_id=100)

    doc = Document(
        title="My Document",
        version=1,
        description="A sample document",
        tags=["tag1", "tag2"],
        metadata={"key": "value"},
        categories={"cat1"},
        view_count=42,
        file_size=1024,
        checksum=123456789,
        parent=None,
    )

    # Serialize
    data = fory.serialize(doc)

    # Deserialize
    decoded = fory.deserialize(data)
    assert decoded.title == doc.title
    assert decoded.version == doc.version


if __name__ == "__main__":
    main()
```

## 跨语言兼容

当序列化数据将被其他语言（Java、Rust、C++、Go）读取时，建议使用字段 ID 并配套类型注解：

```python
@dataclass
class CrossLangData:
    # Use field IDs for cross-language compatibility
    int_var: pyfory.int32 = pyfory.field(id=0, default=0)
    long_fixed: pyfory.fixed_uint64 = pyfory.field(id=1, default=0)
    long_tagged: pyfory.tagged_uint64 = pyfory.field(id=2, default=0)
    optional_value: Optional[str] = pyfory.field(id=3, nullable=True, default=None)
```

## Schema 演进

兼容模式支持 Schema 演进。建议通过字段 ID 降低序列化成本：

```python
# Version 1
@dataclass
class DataV1:
    id: pyfory.int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")


# Version 2: Added new field
@dataclass
class DataV2:
    id: pyfory.int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)  # New field
```

V1 写出的数据可由 V2 读取（新增字段将为 `None`）。

也可以不配置字段 ID（此时元信息使用字段名，开销更大）：

```python
@dataclass
class Data:
    id: pyfory.int64 = 0
    name: str = ""
```

## Native 模式与 Xlang 模式

字段配置会随序列化模式不同而变化。

### Native 模式（仅 Python）

Native 模式默认值更宽松，以获得更高兼容性：

- **Nullable**：`str` 和数值类型默认不可空，除非使用 `Optional`
- **Ref tracking**：对象引用默认开启（`str` 与数值类型除外）

在 Native 模式中，通常**不需要显式字段配置**，除非你希望：

- 通过字段 ID 降低序列化体积
- 关闭不必要的 ref 跟踪以优化性能

```python
# Native mode: works without field configuration
@dataclass
class User:
    id: int = 0
    name: str = ""
    tags: List[str] = None
```

### Xlang 模式（跨语言）

由于语言间类型系统差异，Xlang 模式默认值更严格：

- **Nullable**：默认不可空（`nullable=False`）
- **Ref tracking**：默认关闭（`ref=False`）

在 Xlang 模式中，以下情况需要显式配置：

- 字段可能为 None（`Optional[T]` + `nullable=True`）
- 字段需要共享/循环引用语义（`ref=True`）
- 整数类型需要指定跨语言编码
- 需要减少元信息开销（字段 ID）

```python
# Xlang mode: explicit configuration required for nullable/ref fields
@dataclass
class User:
    id: pyfory.int64 = pyfory.field(id=0, default=0)
    name: str = pyfory.field(id=1, default="")
    email: Optional[str] = pyfory.field(id=2, nullable=True, default=None)  # Must declare nullable
    friend: Optional["User"] = pyfory.field(id=3, ref=True, nullable=True, default=None)  # Must declare ref
```

### 默认值汇总

| 选项       | Native 模式默认值                                 | Xlang 模式默认值 |
| ---------- | -------------------------------------------------- | ---------------- |
| `nullable` | `str`/数值类型为 `False`，其余对象通常可空         | `False`          |
| `ref`      | `True`（`str` 和数值类型除外）                    | `False`          |
| `dynamic`  | `True`（数值/str/time 类型除外）                  | `False`（具体类型） |

## 最佳实践

1. **配置字段 ID**：兼容模式下建议配置，降低序列化成本
2. **`Optional[T]` 配合 `nullable=True`**：xlang 下可空字段需要显式声明
3. **共享对象启用 ref**：共享或循环关系使用 `ref=True`
4. **敏感字段使用 `ignore=True`**：例如密码、令牌、内部状态
5. **选择合适编码**：小值用 `varint`，全范围值用 `fixed`
6. **保持 ID 稳定**：分配后不要更改字段 ID

## 选项速查

| 配置                                           | 说明                                  |
| ---------------------------------------------- | ------------------------------------- |
| `pyfory.field(id=N)`                           | 字段 tag ID，减少元信息开销           |
| `pyfory.field(nullable=True)`                  | 标记字段可空                          |
| `pyfory.field(ref=True)`                       | 启用引用跟踪                          |
| `pyfory.field(ignore=True)`                    | 将字段排除在序列化之外                |
| `pyfory.field(dynamic=True)`                   | 强制写入类型信息                      |
| `pyfory.field(dynamic=False)`                  | 跳过类型信息（按声明类型处理）        |
| `Optional[T]`                                  | 可空字段类型提示                      |
| `pyfory.int32`, `pyfory.int64`                 | 有符号整数（varint 编码）             |
| `pyfory.uint32`, `pyfory.uint64`               | 无符号整数（varint 编码）             |
| `pyfory.fixed_uint32`, `pyfory.fixed_uint64`   | 定长无符号整数                        |
| `pyfory.tagged_uint64`                         | uint64 的 tagged 编码                 |

## 相关主题

- [基础序列化](basic_serialization) - 快速上手 Fory 序列化
- [Schema 演进](schema_evolution) - 兼容模式与 schema 演进
- [跨语言](cross_language) - 与 Java、Rust、C++、Go 互操作
