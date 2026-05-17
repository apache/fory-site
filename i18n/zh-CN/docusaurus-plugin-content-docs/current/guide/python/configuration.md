---
title: Configuration
sidebar_position: 3
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

This page covers Python runtime configuration. `pyfory.Fory()` defaults to xlang mode with
compatible schema evolution. Native mode is selected explicitly with `xlang=False` and defaults to
schema-consistent payloads.

## Fory Class

The main serialization interface:

```python
class Fory:
    def __init__(
        self,
        xlang: bool = True,
        ref: bool = False,
        strict: bool = True,
        compatible: Optional[bool] = None,
        max_depth: int = 50,
        policy: DeserializationPolicy = None,
        field_nullable: bool = False,
        meta_compressor=None,
    )
```

## ThreadSafeFory Class

Thread-safe serialization interface using a pooled wrapper:

```python
class ThreadSafeFory:
    def __init__(
        self, fory_factory=None, **kwargs
    )
```

## Parameters

| Parameter         | Type                            | Default | Description                                                                                                                                             |
| ----------------- | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xlang`           | `bool`                          | `True`  | Use xlang mode. Set `False` for Python native mode.                                                                                                     |
| `ref`             | `bool`                          | `False` | Enable reference tracking for shared/circular references. Disable for better performance if your data has no shared references.                         |
| `strict`          | `bool`                          | `True`  | Require type registration for security. Keep this enabled for production unless a policy owns trust decisions.                                          |
| `compatible`      | `bool \| None`                  | `None`  | Schema evolution mode. `None` follows the wire mode: xlang defaults to compatible mode, while native mode defaults to schema-consistent mode.           |
| `max_depth`       | `int`                           | `50`    | Maximum deserialization depth for security, preventing stack overflow attacks.                                                                          |
| `policy`          | `DeserializationPolicy \| None` | `None`  | Deserialization policy used for security checks. Strongly recommended when `strict=False`.                                                              |
| `field_nullable`  | `bool`                          | `False` | Treat dataclass fields as nullable by default.                                                                                                          |
| `meta_compressor` | `Any`                           | `None`  | Optional metadata compressor used for compatible-mode metadata encoding.                                                                                |
| `fory_factory`    | `Callable \| None`              | `None`  | `ThreadSafeFory` factory hook. When set, `ThreadSafeFory` creates instances via this callback; otherwise it forwards `**kwargs` to `Fory` construction. |

## Key Methods

```python
# Serialization (serialize/deserialize are identical to dumps/loads)
data: bytes = fory.serialize(obj)
obj = fory.deserialize(data)

# Alternative API (aliases)
data: bytes = fory.dumps(obj)
obj = fory.loads(data)

# Type registration by id
fory.register(MyClass, type_id=123)
fory.register(MyClass, type_id=123, serializer=custom_serializer)

# Type registration by name
fory.register(MyClass, typename="my.package.MyClass")
fory.register(MyClass, typename="my.package.MyClass", serializer=custom_serializer)
```

## Xlang And Native Mode Comparison

| Feature             | Native mode (`xlang=False`)                    | Xlang mode (default)                  |
| ------------------- | ---------------------------------------------- | ------------------------------------- |
| Use case            | Python-only applications                       | Multi-language systems                |
| Compatibility       | Python only                                    | Java, Go, Rust, C++, JavaScript, etc. |
| Supported types     | Python object surface                          | Cross-language compatible types       |
| Functions/lambdas   | Supported with trusted dynamic deserialization | Not allowed                           |
| Local classes       | Supported with trusted dynamic deserialization | Not allowed                           |
| Dynamic classes     | Supported with trusted dynamic deserialization | Not allowed                           |
| Schema mode default | Schema-consistent                              | Compatible                            |

## Xlang Mode

Xlang mode is the default and restricts payloads to types compatible across Fory runtimes:

```python
import pyfory

fory = pyfory.Fory(xlang=True, ref=True)
fory.register(MyDataClass, typename="com.example.MyDataClass")
data = fory.serialize(MyDataClass(field1="value", field2=42))
```

Use `compatible=False` only when every xlang peer updates schema together and you want
schema-consistent xlang payloads.

## Native Mode

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)
```

Native mode supports Python-specific object features such as functions, local classes, methods,
`__reduce__`, and `__getstate__`. It defaults to schema-consistent mode. Set
`compatible=True` only when Python-only deployments need schema evolution.

## Example Configurations

### Xlang Service

```python
import pyfory

fory = pyfory.Fory(
    xlang=True,
    ref=False,
    strict=True,
    max_depth=20,
)

fory.register(UserModel, typename="example.User")
```

### Native Mode With Dynamic Types

```python
import pyfory

fory = pyfory.Fory(
    xlang=False,
    ref=True,
    strict=False,
    max_depth=1000,
)
```

Use `strict=False` only for trusted data, preferably with a `policy=` deserialization policy.

## Related Topics

- [Basic Serialization](basic-serialization.md) - Using configured Fory
- [Type Registration](type-registration.md) - Registration patterns
- [Python Native Mode](python-native.md) - Python-only object serialization
- [Security](security.md) - Security best practices
