---
title: Python Native Mode
sidebar_position: 5
id: native_mode
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

`pyfory` provides a Python-native serialization mode that offers the same functionality as pickle/cloudpickle, but with **significantly better performance, smaller data size, and enhanced security features**.

## Overview

The binary protocol and API are similar to Fory's xlang mode, but Python-native mode can serialize any Python object—including global functions, local functions, lambdas, local classes and types with customized serialization using `__getstate__/__reduce__/__reduce_ex__`, which are not allowed in xlang mode.

To use Python-native mode, create `Fory` with `xlang=False`:

```python
import pyfory
fory = pyfory.Fory(xlang=False, ref=False, strict=True)
```

## Drop-in Replacement for Pickle/Cloudpickle

`pyfory` can serialize any Python object with the following configuration:

- **For circular references**: Set `ref=True` to enable reference tracking
- **For functions/classes**: Set `strict=False` to allow deserialization of dynamic types

**⚠️ Security Warning**: When `strict=False`, Fory will deserialize arbitrary types, which can pose security risks if data comes from untrusted sources. Only use `strict=False` in controlled environments where you trust the data source completely.

### Common Usage

```python
import pyfory

# Create Fory instance
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# serialize common Python objects
data = fory.dumps({"name": "Alice", "age": 30, "scores": [95, 87, 92]})
print(fory.loads(data))

# serialize custom objects
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

person = Person("Bob", 25)
data = fory.dumps(person)
print(fory.loads(data))  # Person(name='Bob', age=25)
```

## Serialize Global Functions

Capture and serialize functions defined at module level. Fory deserialize and return same function object:

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

def my_global_function(x):
    return 10 * x

data = fory.dumps(my_global_function)
print(fory.loads(data)(10))  # 100
```

## Serialize Local Functions/Lambdas

Serialize functions with closures and lambda expressions. Fory captures the closure variables automatically:

```python
import pyfory

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# Local functions with closures
def my_function():
    local_var = 10
    def local_func(x):
        return x * local_var
    return local_func

data = fory.dumps(my_function())
print(fory.loads(data)(10))  # 100

# Lambdas
data = fory.dumps(lambda x: 10 * x)
print(fory.loads(data)(10))  # 100
```

## Serialize Global Classes/Methods

Serialize class objects, instance methods, class methods, and static methods:

```python
from dataclasses import dataclass
import pyfory
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

@dataclass
class Person:
    name: str
    age: int

    def f(self, x):
        return self.age * x

    @classmethod
    def g(cls, x):
        return 10 * x

    @staticmethod
    def h(x):
        return 10 * x

# Serialize global class
print(fory.loads(fory.dumps(Person))("Bob", 25))  # Person(name='Bob', age=25)

# Serialize instance method
print(fory.loads(fory.dumps(Person("Bob", 20).f))(10))  # 200

# Serialize class method
print(fory.loads(fory.dumps(Person.g))(10))  # 100

# Serialize static method
print(fory.loads(fory.dumps(Person.h))(10))  # 100
```

## Serialize Local Classes/Methods

Serialize classes defined inside functions along with their methods:

```python
from dataclasses import dataclass
import pyfory
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

def create_local_class():
    class LocalClass:
        def f(self, x):
            return 10 * x

        @classmethod
        def g(cls, x):
            return 10 * x

        @staticmethod
        def h(x):
            return 10 * x
    return LocalClass

# Serialize local class
data = fory.dumps(create_local_class())
print(fory.loads(data)().f(10))  # 100

# Serialize local class instance method
data = fory.dumps(create_local_class()().f)
print(fory.loads(data)(10))  # 100

# Serialize local class method
data = fory.dumps(create_local_class().g)
print(fory.loads(data)(10))  # 100

# Serialize local class static method
data = fory.dumps(create_local_class().h)
print(fory.loads(data)(10))  # 100
```

## Performance Comparison

```python
import pyfory
import pickle
import timeit

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

obj = {f"key{i}": f"value{i}" for i in range(10000)}
print(f"Fory: {timeit.timeit(lambda: fory.dumps(obj), number=1000):.3f}s")
print(f"Pickle: {timeit.timeit(lambda: pickle.dumps(obj), number=1000):.3f}s")
```

## Related Topics

- [Configuration](configuration.md) - Python mode configuration
- [Out-of-Band Serialization](out-of-band.md) - Zero-copy buffers
- [Security](security.md) - DeserializationPolicy
