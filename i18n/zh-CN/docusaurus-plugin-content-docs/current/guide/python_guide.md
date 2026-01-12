---
title: Python 序列化
sidebar_position: 1
id: python_serialization
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

## Apache Fory™ Python

**Apache Fory™** 是一个极速的多语言序列化框架，基于 **JIT 编译**和**零拷贝**技术，在保持易用性和安全性的同时提供**超高性能**。

`pyfory` 提供了 Apache Fory™ 的 Python 实现，同时支持高性能对象序列化和用于数据处理任务的高级行格式能力。

## 🚀 核心特性

### 🔧 **灵活的序列化模式**

- **Python 原生模式**：完全兼容 Python，可作为 pickle/cloudpickle 的直接替代品
- **跨语言模式**：针对多语言数据交换优化
- **行格式**：用于分析工作负载的零拷贝行格式

### 🎯 多样的序列化功能

- **共享/循环引用支持**：在 Python 原生模式和跨语言模式中支持复杂对象图
- **多态支持**：支持自定义类型的自动类型分发
- **Schema 演化**：在跨语言模式下使用 dataclass 时支持向后/向前兼容
- **带外缓冲区支持**：支持大型数据结构（如 NumPy 数组和 Pandas DataFrame）的零拷贝序列化，兼容 pickle protocol 5

### ⚡ **极速性能**

- 相比其他序列化框架具有**极快的性能**
- **运行时代码生成**和 **Cython 加速**的核心实现，获得最佳性能

### 📦 紧凑的数据大小

- **紧凑的对象图协议**，空间开销极小——相比 pickle/cloudpickle 最多减少 3 倍大小
- **元数据打包和共享**，最小化类型向前/向后兼容的空间开销

### 🛡️ **安全性**

- **严格模式**通过类型注册和检查防止反序列化不受信任的类型
- **引用跟踪**安全处理循环引用

## 📦 安装

### 基础安装

使用 pip 安装 pyfory：

```bash
pip install pyfory
```

### 可选依赖

```bash
# 安装行格式支持（需要 Apache Arrow）
pip install pyfory[format]

# 从源码安装用于开发
git clone https://github.com/apache/fory.git
cd fory/python
pip install -e ".[dev,format]"
```

### 环境要求

- **Python**：3.8 或更高版本
- **操作系统**：Linux、macOS、Windows

## 🐍 Python 原生序列化

`pyfory` 提供了 Python 原生序列化模式，提供与 pickle/cloudpickle 相同的功能，但具有**显著更好的性能、更小的数据大小和增强的安全特性**。

二进制协议和 API 与 Fory 的 xlang 模式类似，但 Python 原生模式可以序列化任何 Python 对象——包括全局函数、局部函数、lambda 表达式、局部类以及使用 `__getstate__/__reduce__/__reduce_ex__` 自定义序列化的类型，这些在 xlang 模式中是不允许的。

要使用 Python 原生模式，请创建 `xlang=False` 的 `Fory`。此模式针对纯 Python 应用程序优化：

```python
import pyfory
fory = pyfory.Fory(xlang=False, ref=False, strict=True)
```

### 基础对象序列化

使用简单的 API 序列化和反序列化 Python 对象。此示例展示了序列化包含混合类型的字典：

```python
import pyfory

# 创建 Fory 实例
fory = pyfory.Fory(xlang=True)

# 序列化任何 Python 对象
data = fory.dumps({"name": "Alice", "age": 30, "scores": [95, 87, 92]})

# 反序列化回 Python 对象
obj = fory.loads(data)
print(obj)  # {'name': 'Alice', 'age': 30, 'scores': [95, 87, 92]}
```

**注意**：`dumps()`/`loads()` 是 `serialize()`/`deserialize()` 的别名。两组 API 完全相同，使用您觉得更直观的即可。

### 自定义类序列化

Fory 自动处理 dataclass 和自定义类型。注册您的类一次，然后无缝序列化实例：

```python
import pyfory
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Person:
    name: str
    age: int
    scores: List[int]
    metadata: Dict[str, str]

# Python 模式 - 支持所有 Python 类型，包括 dataclass
fory = pyfory.Fory(xlang=False, ref=True)
fory.register(Person)
person = Person("Bob", 25, [88, 92, 85], {"team": "engineering"})
data = fory.serialize(person)
result = fory.deserialize(data)
print(result)  # Person(name='Bob', age=25, ...)
```

### Pickle/Cloudpickle 的直接替代品

`pyfory` 可以使用以下配置序列化任何 Python 对象：

- **循环引用**：设置 `ref=True` 启用引用跟踪
- **函数/类**：设置 `strict=False` 允许反序列化动态类型

**⚠️ 安全警告**：当 `strict=False` 时，Fory 将反序列化任意类型，如果数据来自不可信来源，这可能带来安全风险。仅在您完全信任数据源的受控环境中使用 `strict=False`。如果确实需要使用 `strict=False`，请在创建 fory 时使用 `policy=your_policy` 配置 `DeserializationPolicy` 来控制反序列化行为。

#### 常见用法

序列化常见的 Python 对象，包括字典、列表和自定义类，无需任何注册：

```python
import pyfory

# 创建 Fory 实例
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 序列化常见的 Python 对象
data = fory.dumps({"name": "Alice", "age": 30, "scores": [95, 87, 92]})
print(fory.loads(data))

# 序列化自定义对象
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

person = Person("Bob", 25)
data = fory.dumps(person)
print(fory.loads(data))  # Person(name='Bob', age=25)
```

#### 序列化全局函数

捕获和获取在模块级别定义的函数。Fory 反序列化并返回相同的函数对象：

```python
import pyfory

# 创建 Fory 实例
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 序列化全局函数
def my_global_function(x):
    return 10 * x

data = fory.dumps(my_global_function)
print(fory.loads(data)(10))  # 100
```

#### 序列化局部函数/Lambda 表达式

序列化带闭包的函数和 lambda 表达式。Fory 自动捕获闭包变量：

```python
import pyfory

# 创建 Fory 实例
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 序列化带闭包的局部函数
def my_function():
    local_var = 10
    def local_func(x):
        return x * local_var
    return local_func

data = fory.dumps(my_function())
print(fory.loads(data)(10))  # 100

# 序列化 lambda 表达式
data = fory.dumps(lambda x: 10 * x)
print(fory.loads(data)(10))  # 100
```

#### 序列化全局类/方法

序列化类对象、实例方法、类方法和静态方法。支持所有方法类型：

```python
from dataclasses import dataclass
import pyfory
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 序列化全局类
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

print(fory.loads(fory.dumps(Person))("Bob", 25))  # Person(name='Bob', age=25)
# 序列化全局类实例方法
print(fory.loads(fory.dumps(Person("Bob", 20).f))(10))  # 200
# 序列化全局类的类方法
print(fory.loads(fory.dumps(Person.g))(10))  # 100
# 序列化全局类的静态方法
print(fory.loads(fory.dumps(Person.h))(10))  # 100
```

#### 序列化局部类/方法

序列化函数内定义的类及其方法。适用于动态类创建：

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

# 序列化局部类
data = fory.dumps(create_local_class())
print(fory.loads(data)().f(10))  # 100

# 序列化局部类实例方法
data = fory.dumps(create_local_class()().f)
print(fory.loads(data)(10))  # 100

# 序列化局部类的类方法
data = fory.dumps(create_local_class().g)
print(fory.loads(data)(10))  # 100

# 序列化局部类的静态方法
data = fory.dumps(create_local_class().h)
print(fory.loads(data)(10))  # 100
```

### 带外缓冲区序列化

Fory 支持兼容 pickle5 的带外缓冲区序列化，用于高效零拷贝处理大型数据结构。这对于 NumPy 数组、Pandas DataFrame 和其他具有大内存占用的对象特别有用。

带外序列化将元数据与实际数据缓冲区分离，从而实现：

- 使用 `memoryview` 通过网络或 IPC 发送数据时**零拷贝传输**
- 大型数据集的**性能提升**
- **Pickle5 兼容性**，使用 `pickle.PickleBuffer`
- **灵活的流支持** - 写入任何可写对象（文件、BytesIO、套接字等）

#### 基础带外序列化

```python
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# 大型 numpy 数组
array = np.arange(10000, dtype=np.float64)

# 使用带外缓冲区序列化
buffer_objects = []
serialized_data = fory.serialize(array, buffer_callback=buffer_objects.append)

# 将缓冲区对象转换为 memoryview 以实现零拷贝传输
# 对于连续缓冲区（bytes、numpy 数组），这是零拷贝的
# 对于非连续数据，可能会创建副本以确保连续性
buffers = [obj.getbuffer() for obj in buffer_objects]

# 使用带外缓冲区反序列化（接受 memoryview、bytes 或 Buffer）
deserialized_array = fory.deserialize(serialized_data, buffers=buffers)

assert np.array_equal(array, deserialized_array)
```

#### 带外序列化 Pandas DataFrame

```python
import pyfory
import pandas as pd
import numpy as np

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# 创建包含数值列的 DataFrame
df = pd.DataFrame({
    'a': np.arange(1000, dtype=np.float64),
    'b': np.arange(1000, dtype=np.int64),
    'c': ['text'] * 1000
})

# 使用带外缓冲区序列化
buffer_objects = []
serialized_data = fory.serialize(df, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]

# 反序列化
deserialized_df = fory.deserialize(serialized_data, buffers=buffers)

assert df.equals(deserialized_df)
```

#### 选择性带外序列化

您可以通过提供回调函数来控制哪些缓冲区进行带外处理，该函数返回 `True` 将数据保持在带内，返回 `False`（并追加到列表）将其发送到带外：

```python
import pyfory
import numpy as np

fory = pyfory.Fory(xlang=False, ref=True, strict=False)

arr1 = np.arange(1000, dtype=np.float64)
arr2 = np.arange(2000, dtype=np.float64)
data = [arr1, arr2]

buffer_objects = []
counter = 0

def selective_callback(buffer_object):
    global counter
    counter += 1
    # 仅将偶数编号的缓冲区发送到带外
    if counter % 2 == 0:
        buffer_objects.append(buffer_object)
        return False  # 带外
    return True  # 带内

serialized = fory.serialize(data, buffer_callback=selective_callback)
buffers = [obj.getbuffer() for obj in buffer_objects]
deserialized = fory.deserialize(serialized, buffers=buffers)
```

#### Pickle5 兼容性

Fory 的带外序列化与 pickle protocol 5 完全兼容。当对象实现 `__reduce_ex__(protocol)` 时，Fory 自动使用 protocol 5 来启用 `pickle.PickleBuffer` 支持：

```python
import pyfory
import pickle

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

# 自动支持 PickleBuffer 对象
data = b"Large binary data"
pickle_buffer = pickle.PickleBuffer(data)

# 使用缓冲区回调进行带外处理序列化
buffer_objects = []
serialized = fory.serialize(pickle_buffer, buffer_callback=buffer_objects.append)
buffers = [obj.getbuffer() for obj in buffer_objects]

# 使用缓冲区反序列化
deserialized = fory.deserialize(serialized, buffers=buffers)
assert bytes(deserialized.raw()) == data
```

#### 将缓冲区写入不同的流

`BufferObject.write_to()` 方法接受任何可写流对象，使其适用于各种用例：

```python
import pyfory
import numpy as np
import io

fory = pyfory.Fory(xlang=False, ref=False, strict=False)

array = np.arange(1000, dtype=np.float64)

# 收集带外缓冲区
buffer_objects = []
serialized = fory.serialize(array, buffer_callback=buffer_objects.append)

# 写入不同的流类型
for buffer_obj in buffer_objects:
    # 写入 BytesIO（内存流）
    bytes_stream = io.BytesIO()
    buffer_obj.write_to(bytes_stream)

    # 写入文件
    with open('/tmp/buffer_data.bin', 'wb') as f:
        buffer_obj.write_to(f)

    # 获取零拷贝 memoryview（对于连续缓冲区）
    mv = buffer_obj.getbuffer()
    assert isinstance(mv, memoryview)
```

**注意**：对于连续内存缓冲区（如 bytes、numpy 数组），`getbuffer()` 返回零拷贝 `memoryview`。对于非连续数据，可能会创建副本以确保连续性。

## 🏃‍♂️ 跨语言对象图序列化

`pyfory` 支持跨语言对象图序列化，允许您在 Python 中序列化数据，然后在 Java、Go、Rust 或其他支持的语言中反序列化。

二进制协议和 API 与 `pyfory` 的 python-native 模式类似，但 Python 原生模式可以序列化任何 Python 对象——包括全局函数、局部函数、lambda 表达式、局部类以及使用 `__getstate__/__reduce__/__reduce_ex__` 自定义序列化的类型，这些在 xlang 模式中是不允许的。

要使用 xlang 模式，请创建 `xlang=True` 的 `Fory`。此模式用于 xlang 序列化应用：

```python
import pyfory
fory = pyfory.Fory(xlang=True, ref=False, strict=True)
```

### 跨语言序列化

在 Python 中序列化数据，然后在 Java、Go、Rust 或其他支持的语言中反序列化。双方必须注册相同的类型并使用匹配的名称：

**Python (序列化端)**

```python
import pyfory

# 用于互操作性的跨语言模式
f = pyfory.Fory(xlang=True, ref=True)

# 注册类型以实现跨语言兼容
@dataclass
class Person:
    name: str
    age: pyfory.int32

f.register(Person, typename="example.Person")

person = Person("Charlie", 35)
binary_data = f.serialize(person)
# binary_data 现在可以发送到 Java、Go 等
```

**Java (反序列化端)**

```java
import org.apache.fory.*;

public class Person {
    public String name;
    public int age;
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();

fory.register(Person.class, "example.Person");
Person person = (Person) fory.deserialize(binaryData);
```

## 📊 行格式 - 零拷贝处理

Apache Fury™ 提供了一种随机访问行格式，无需完全反序列化即可从二进制数据中读取嵌套字段。这在处理大型对象时，当只需要访问部分数据时，大大减少了开销。该格式还支持内存映射文件，实现超低内存占用。

### 行格式基础用法

将对象编码为行格式以实现随机访问，无需完全反序列化。适用于大型数据集：

**Python**

```python
import pyfory
import pyarrow as pa
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Bar:
    f1: str
    f2: List[pa.int64]

@dataclass
class Foo:
    f1: pa.int32
    f2: List[pa.int32]
    f3: Dict[str, pa.int32]
    f4: List[Bar]

# 创建行格式编码器
encoder = pyfory.encoder(Foo)

# 创建大型数据集
foo = Foo(
    f1=10,
    f2=list(range(1_000_000)),
    f3={f"k{i}": i for i in range(1_000_000)},
    f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1_000_000)]
)

# 编码为行格式
binary: bytes = encoder.to_row(foo).to_bytes()

# 零拷贝访问 - 无需完全反序列化！
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])              # 直接访问第 100,000 个元素
print(foo_row.f4[100000].f1)           # 直接访问嵌套字段
print(foo_row.f4[200000].f2[5])        # 直接访问深度嵌套字段
```

### 跨语言兼容性

行格式可以跨语言工作。以下是在 Java 中访问相同数据结构的示例：

**Java**

```java
public class Bar {
  String f1;
  List<Long> f2;
}

public class Foo {
  int f1;
  List<Integer> f2;
  Map<String, Integer> f3;
  List<Bar> f4;
}

RowEncoder<Foo> encoder = Encoders.bean(Foo.class);

// 创建大型数据集
Foo foo = new Foo();
foo.f1 = 10;
foo.f2 = IntStream.range(0, 1_000_000).boxed().collect(Collectors.toList());
foo.f3 = IntStream.range(0, 1_000_000).boxed().collect(Collectors.toMap(i -> "k" + i, i -> i));
List<Bar> bars = new ArrayList<>(1_000_000);
for (int i = 0; i < 1_000_000; i++) {
  Bar bar = new Bar();
  bar.f1 = "s" + i;
  bar.f2 = LongStream.range(0, 10).boxed().collect(Collectors.toList());
  bars.add(bar);
}
foo.f4 = bars;

// 编码为行格式（与 Python 跨语言兼容）
BinaryRow binaryRow = encoder.toRow(foo);

// 零拷贝随机访问，无需完全反序列化
BinaryArray f2Array = binaryRow.getArray(1);              // 访问 f2 列表
BinaryArray f4Array = binaryRow.getArray(3);              // 访问 f4 列表
BinaryRow bar10 = f4Array.getStruct(10);                  // 访问第 11 个 Bar
long value = bar10.getArray(1).getInt64(5);               // 访问 bar.f2 的第 6 个元素

// 部分反序列化 - 只反序列化需要的内容
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
Bar bar1 = barEncoder.fromRow(f4Array.getStruct(10));     // 仅反序列化第 11 个 Bar
Bar bar2 = barEncoder.fromRow(f4Array.getStruct(20));     // 仅反序列化第 21 个 Bar

// 需要时进行完全反序列化
Foo newFoo = encoder.fromRow(binaryRow);
```

**C++**

在 C++ 中使用编译时类型信息：

```cpp
#include "fory/encoder/row_encoder.h"
#include "fory/row/writer.h"

struct Bar {
  std::string f1;
  std::vector<int64_t> f2;
};

FORY_FIELD_INFO(Bar, f1, f2);

struct Foo {
  int32_t f1;
  std::vector<int32_t> f2;
  std::map<std::string, int32_t> f3;
  std::vector<Bar> f4;
};

FORY_FIELD_INFO(Foo, f1, f2, f3, f4);

// 创建大型数据集
Foo foo;
foo.f1 = 10;
for (int i = 0; i < 1000000; i++) {
  foo.f2.push_back(i);
  foo.f3["k" + std::to_string(i)] = i;
}
for (int i = 0; i < 1000000; i++) {
  Bar bar;
  bar.f1 = "s" + std::to_string(i);
  for (int j = 0; j < 10; j++) {
    bar.f2.push_back(j);
  }
  foo.f4.push_back(bar);
}

// 编码为行格式（与 Python/Java 跨语言兼容）
fory::encoder::RowEncoder<Foo> encoder;
encoder.Encode(foo);
auto row = encoder.GetWriter().ToRow();

// 零拷贝随机访问，无需完全反序列化
auto f2_array = row->GetArray(1);                    // 访问 f2 列表
auto f4_array = row->GetArray(3);                    // 访问 f4 列表
auto bar10 = f4_array->GetStruct(10);                // 访问第 11 个 Bar
int64_t value = bar10->GetArray(1)->GetInt64(5);    // 访问 bar.f2 的第 6 个元素
std::string str = bar10->GetString(0);               // 访问 bar.f1
```

### 主要优势

- **零拷贝访问**：无需反序列化整个对象即可读取嵌套字段
- **内存效率**：直接从磁盘内存映射大型数据集
- **跨语言**：二进制格式在 Python、Java 和其他 Fury 实现之间兼容
- **部分反序列化**：仅反序列化您需要的特定元素
- **高性能**：跳过不必要的数据解析，适用于分析和大数据工作负载

## 🏗️ 核心 API 参考

### Fory 类

主要的序列化接口：

```python
class Fory:
    def __init__(
        self,
        xlang: bool = False,
        ref: bool = False,
        strict: bool = True,
        compatible: bool = False,
        max_depth: int = 50
    )
```

### ThreadSafeFory 类

使用线程本地存储的线程安全序列化接口：

```python
class ThreadSafeFory:
    def __init__(
        self,
        xlang: bool = False,
        ref: bool = False,
        strict: bool = True,
        compatible: bool = False,
        max_depth: int = 50
    )
```

`ThreadSafeFory` 通过维护一个受锁保护的 `Fory` 实例池来提供线程安全的序列化。当线程需要序列化/反序列化时，它从池中获取一个实例，使用它，然后归还。所有类型注册必须在任何序列化之前完成，以确保所有实例之间的一致性。

**线程安全示例：**

```python
import pyfory
import threading
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

# 创建线程安全的 Fory 实例
fory = pyfory.ThreadSafeFory(xlang=False, ref=True)
fory.register(Person)

# 在多个线程中安全使用
def serialize_in_thread(thread_id):
    person = Person(name=f"User{thread_id}", age=25 + thread_id)
    data = fory.serialize(person)
    result = fory.deserialize(data)
    print(f"Thread {thread_id}: {result}")

threads = [threading.Thread(target=serialize_in_thread, args=(i,)) for i in range(10)]
for t in threads: t.start()
for t in threads: t.join()
```

**主要特性：**

- **实例池**：维护一个受锁保护的 `Fory` 实例池以实现线程安全
- **共享配置**：所有注册必须预先完成并应用于所有实例
- **相同 API**：与 `Fory` 类具有相同方法的直接替代品
- **注册安全**：防止首次使用后注册以确保一致性

**何时使用：**

- **多线程应用**：Web 服务器、并发工作线程、并行处理
- **共享 Fory 实例**：当多个线程需要序列化/反序列化数据时
- **线程池**：使用线程池或 concurrent.futures 的应用程序

**参数：**

- **`xlang`** (`bool`, 默认=`False`)：启用跨语言序列化。当为 `False` 时，启用支持所有 Python 对象的 Python 原生模式。当为 `True` 时，启用与 Java、Go、Rust 等兼容的跨语言模式。
- **`ref`** (`bool`, 默认=`False`)：启用共享/循环引用的引用跟踪。如果您的数据没有共享引用，禁用以获得更好的性能。
- **`strict`** (`bool`, 默认=`True`)：要求类型注册以确保安全。**强烈建议**用于生产环境。仅在受信任的环境中禁用。
- **`compatible`** (`bool`, 默认=`False`)：在跨语言模式下启用 schema 演化，允许在保持兼容性的同时添加/删除字段。
- **`max_depth`** (`int`, 默认=`50`)：反序列化的最大深度，用于安全防护，防止栈溢出攻击。

**主要方法：**

```python
# 序列化（serialize/deserialize 与 dumps/loads 完全相同）
data: bytes = fory.serialize(obj)
obj = fory.deserialize(data)

# 替代 API（别名）
data: bytes = fory.dumps(obj)
obj = fory.loads(data)

# 通过 id 注册类型（用于 Python 模式）
fory.register(MyClass, type_id=123)
fory.register(MyClass, type_id=123, serializer=custom_serializer)

# 通过名称注册类型（用于跨语言模式）
fory.register(MyClass, typename="my.package.MyClass")
fory.register(MyClass, typename="my.package.MyClass", serializer=custom_serializer)
```

### 语言模式对比

| 特性            | Python 模式 (`xlang=False`)      | 跨语言模式 (`xlang=True`)          |
| --------------- | -------------------------------- | ---------------------------------- |
| **用例**        | 纯 Python 应用                   | 多语言系统                         |
| **兼容性**      | 仅 Python                        | Java、Go、Rust、C++、JavaScript 等 |
| **支持的类型**  | 所有 Python 类型                 | 仅跨语言兼容的类型                 |
| **函数/Lambda** | ✓ 支持                           | ✗ 不允许                           |
| **局部类**      | ✓ 支持                           | ✗ 不允许                           |
| **动态类**      | ✓ 支持                           | ✗ 不允许                           |
| **Schema 演化** | ✓ 支持（启用 `compatible=True`） | ✓ 支持（启用 `compatible=True`）   |
| **性能**        | 极快                             | 非常快                             |
| **数据大小**    | 紧凑                             | 紧凑且包含类型元数据               |

#### Python 模式 (`xlang=False`)

Python 模式支持所有 Python 类型，包括函数、类和闭包。非常适合纯 Python 应用：

```python
import pyfory

# 完全 Python 兼容模式
fory = pyfory.Fory(xlang=False, ref=True, strict=False)

# 支持所有 Python 对象：
data = fory.dumps({
    'function': lambda x: x * 2,        # 函数和 lambda 表达式
    'class': type('Dynamic', (), {}),    # 动态类
    'method': str.upper,                # 方法
    'nested': {'circular_ref': None}    # 循环引用（当 ref=True 时）
})

# pickle/cloudpickle 的直接替代品
import pickle
obj = [1, 2, {"nested": [3, 4]}]
assert fory.loads(fory.dumps(obj)) == pickle.loads(pickle.dumps(obj))

# 比 pickle 显著更快更紧凑
import timeit
obj = {f"key{i}": f"value{i}" for i in range(10000)}
print(f"Fory: {timeit.timeit(lambda: fory.dumps(obj), number=1000):.3f}s")
print(f"Pickle: {timeit.timeit(lambda: pickle.dumps(obj), number=1000):.3f}s")
```

#### 跨语言模式 (`xlang=True`)

跨语言模式将类型限制为所有 Fory 实现通用的类型。用于多语言系统：

```python
import pyfory

# 跨语言兼容模式
f = pyfory.Fory(xlang=True, ref=True)

# 仅支持跨语言兼容的类型
f.register(MyDataClass, typename="com.example.MyDataClass")

# 数据可以被 Java、Go、Rust 等读取
data = f.serialize(MyDataClass(field1="value", field2=42))
```

## 🔧 高级特性

### 引用跟踪和循环引用

安全处理共享引用和循环依赖。设置 `ref=True` 来去重对象：

```python
import pyfory

f = pyfory.Fory(ref=True)  # 启用引用跟踪

# 安全处理循环引用
class Node:
    def __init__(self, value):
        self.value = value
        self.children = []
        self.parent = None

root = Node("root")
child = Node("child")
child.parent = root  # 循环引用
root.children.append(child)

# 序列化不会无限递归
data = f.serialize(root)
result = f.deserialize(data)
assert result.children[0].parent is result  # 引用被保留
```

### 类型注册和安全

在严格模式下，只有注册的类型才能被反序列化。这可以防止任意代码执行：

```python
import pyfory

# 严格模式（推荐用于生产环境）
f = pyfory.Fory(strict=True)

class SafeClass:
    def __init__(self, data):
        self.data = data

# 在严格模式下必须注册类型
f.register(SafeClass, typename="com.example.SafeClass")

# 现在序列化可以工作
obj = SafeClass("safe data")
data = f.serialize(obj)
result = f.deserialize(data)

# 未注册的类型将引发异常
class UnsafeClass:
    pass

# 在严格模式下这将失败
try:
    f.serialize(UnsafeClass())
except Exception as e:
    print("安全保护已启动！")
```

### 自定义序列化器

为特殊类型实现自定义序列化逻辑。覆盖 `write/read` 用于 Python 模式，`xwrite/xread` 用于跨语言：

```python
import pyfory
from pyfory.serializer import Serializer
from dataclasses import dataclass

@dataclass
class Foo:
    f1: int
    f2: str

class FooSerializer(Serializer):
    def __init__(self, fory, cls):
        super().__init__(fory, cls)

    def write(self, buffer, obj: Foo):
        # 自定义序列化逻辑
        buffer.write_varint32(obj.f1)
        buffer.write_string(obj.f2)

    def read(self, buffer):
        # 自定义反序列化逻辑
        f1 = buffer.read_varint32()
        f2 = buffer.read_string()
        return Foo(f1, f2)

    # 用于跨语言模式
    def xwrite(self, buffer, obj: Foo):
        buffer.write_int32(obj.f1)
        buffer.write_string(obj.f2)

    def xread(self, buffer):
        return Foo(buffer.read_int32(), buffer.read_string())

f = pyfory.Fory()
f.register(Foo, type_id=100, serializer=FooSerializer(f, Foo))

# 现在 Foo 使用您的自定义序列化器
data = f.dumps(Foo(42, "hello"))
result = f.loads(data)
print(result)  # Foo(f1=42, f2='hello')
```

### Numpy 和科学计算

Fory 原生支持 numpy 数组，使用优化的序列化。大型数组在可能的情况下使用零拷贝：

```python
import pyfory
import numpy as np

f = pyfory.Fory()

# 原生支持 Numpy 数组
arrays = {
    'matrix': np.random.rand(1000, 1000),
    'vector': np.arange(10000),
    'bool_mask': np.random.choice([True, False], size=5000)
}

data = f.serialize(arrays)
result = f.deserialize(data)

# 对于兼容的数组类型使用零拷贝
assert np.array_equal(arrays['matrix'], result['matrix'])
```

## 💡 最佳实践

### 生产环境配置

使用这些推荐设置在生产环境中平衡安全性、性能和功能：

```python
import pyfory

# 生产环境推荐设置
fory = pyfory.Fory(
    xlang=False,        # 如果需要跨语言支持则使用 True
    ref=False,           # 如果有共享/循环引用则启用
    strict=True,        # 关键：生产环境中始终为 True
    compatible=False,   # 仅在需要 schema 演化时启用
    max_depth=20       # 根据数据结构深度调整
)

# 预先注册所有类型
fory.register(UserModel, type_id=100)
fory.register(OrderModel, type_id=101)
fory.register(ProductModel, type_id=102)
```

### 性能优化技巧

使用这些指南优化序列化速度和内存使用：

1. **如果不需要则禁用 `ref=True`**：引用跟踪有开销
2. **使用 type_id 而不是 typename**：整数 ID 比字符串名称更快
3. **复用 Fory 实例**：创建一次，多次使用
4. **启用 Cython**：确保 `ENABLE_FORY_CYTHON_SERIALIZATION=1`，应默认启用
5. **对大型数组使用行格式**：用于分析的零拷贝访问

```python
# 好的做法：复用实例
fory = pyfory.Fory()
for obj in objects:
    data = fory.dumps(obj)

# 不好的做法：每次创建新实例
for obj in objects:
    fory = pyfory.Fory()  # 浪费！
    data = fory.dumps(obj)
```

### 类型注册模式

为您的用例选择正确的注册方法：

```python
# 模式 1：简单注册
fory.register(MyClass, type_id=100)

# 模式 2：使用 typename 的跨语言
fory.register(MyClass, typename="com.example.MyClass")

# 模式 3：使用自定义序列化器
fory.register(MyClass, type_id=100, serializer=MySerializer(fory, MyClass))

# 模式 4：批量注册
type_id = 100
for model_class in [User, Order, Product, Invoice]:
    fory.register(model_class, type_id=type_id)
    type_id += 1
```

### 错误处理

优雅地处理常见的序列化错误。捕获特定异常以实现更好的错误恢复：

```python
import pyfory
from pyfory.error import TypeUnregisteredError, TypeNotCompatibleError

fory = pyfory.Fory(strict=True)

try:
    data = fory.dumps(my_object)
except TypeUnregisteredError as e:
    print(f"类型未注册：{e}")
    # 注册类型并重试
    fory.register(type(my_object), type_id=100)
    data = fory.dumps(my_object)
except Exception as e:
    print(f"序列化失败：{e}")

try:
    obj = fory.loads(data)
except TypeNotCompatibleError as e:
    print(f"Schema 不匹配：{e}")
    # 处理版本不匹配
except Exception as e:
    print(f"反序列化失败：{e}")
```

## 🛠️ 迁移指南

### 从 Pickle 迁移

用 Fory 替换 pickle 以获得更好的性能，同时保持相同的 API：

```python
# 之前（pickle）
import pickle
data = pickle.dumps(obj)
result = pickle.loads(data)

# 之后（Fory - 具有更好性能的直接替代品）
import pyfory
f = pyfory.Fory(xlang=False, ref=True, strict=False)
data = f.dumps(obj)      # 更快更紧凑
result = f.loads(data)   # 更快的反序列化

# 优势：
# - 序列化速度快 2-10 倍
# - 反序列化速度快 2-5 倍
# - 数据大小最多减少 3 倍
# - 相同的 API，更好的性能
```

### 从 JSON 迁移

与 JSON 不同，Fory 支持任意 Python 类型，包括函数：

```python
# 之前（JSON - 类型有限）
import json
data = json.dumps({"name": "Alice", "age": 30})
result = json.loads(data)

# 之后（Fory - 所有 Python 类型）
import pyfory
f = pyfory.Fory()
data = f.dumps({"name": "Alice", "age": 30, "func": lambda x: x})
result = f.loads(data)
```

## 🚨 安全最佳实践

### 生产环境配置

除非您的环境完全可信，否则不要在生产环境中禁用 `strict=True`：

```python
import pyfory

# 推荐的生产环境设置
f = pyfory.Fory(
    xlang=False,   # 或 True 用于跨语言
    ref=True,      # 处理循环引用
    strict=True,   # 重要：防止恶意数据
    max_depth=100  # 防止深度递归攻击
)

# 显式注册允许的类型
f.register(UserModel, type_id=100)
f.register(OrderModel, type_id=101)
# 绝不要在处理不可信数据的生产环境中设置 strict=False！
```

### 开发与生产环境

使用环境变量在开发和生产配置之间切换：

```python
import pyfory
import os

# 开发配置
if os.getenv('ENV') == 'development':
    fory = pyfory.Fory(
        xlang=False,
        ref=True,
        strict=False,    # 开发时允许任何类型
        max_depth=1000   # 开发时更高的限制
    )
else:
    # 生产配置（安全加固）
    fory = pyfory.Fory(
        xlang=False,
        ref=True,
        strict=True,     # 关键：需要注册
        max_depth=100    # 合理的限制
    )
    # 仅注册已知的安全类型
    for idx, model_class in enumerate([UserModel, ProductModel, OrderModel]):
        fory.register(model_class, type_id=100 + idx)
```

### DeserializationPolicy

当必须使用 `strict=False` 时（例如，反序列化函数/lambda 表达式），使用 `DeserializationPolicy` 在反序列化期间实现细粒度的安全控制。这提供了类似于 `pickle.Unpickler.find_class()` 的保护，但具有更全面的钩子。

**为什么使用 DeserializationPolicy？**

- 阻止危险的类/模块（例如，`subprocess.Popen`）
- 在调用之前拦截和验证 `__reduce__` 可调用对象
- 在 `__setstate__` 期间清理敏感数据
- 根据自定义规则替换或拒绝反序列化的对象

**示例：阻止危险的类**

```python
import pyfory
from pyfory import DeserializationPolicy

dangerous_modules = {'subprocess', 'os', '__builtin__'}

class SafeDeserializationPolicy(DeserializationPolicy):
    """在反序列化期间阻止潜在危险的类。"""

    def validate_class(self, cls, is_local, **kwargs):
        # 阻止危险模块
        if cls.__module__ in dangerous_modules:
            raise ValueError(f"阻止危险类：{cls.__module__}.{cls.__name__}")
        return None

    def intercept_reduce_call(self, callable_obj, args, **kwargs):
        # 在 __reduce__ 期间阻止特定的可调用对象调用
        if getattr(callable_obj, '__name__', "") == 'Popen':
            raise ValueError("阻止尝试调用 subprocess.Popen")
        return None

    def intercept_setstate(self, obj, state, **kwargs):
        # 清理敏感数据
        if isinstance(state, dict) and 'password' in state:
            state['password'] = '***REDACTED***'
        return None

# 使用自定义安全策略创建 Fory
policy = SafeDeserializationPolicy()
fory = pyfory.Fory(xlang=False, ref=True, strict=False, policy=policy)

# 现在反序列化受到您自定义策略的保护
data = fory.serialize(my_object)
result = fory.deserialize(data)  # 将调用策略钩子
```

**可用的策略钩子：**

- `validate_class(cls, is_local)` - 在反序列化期间验证/阻止类类型
- `validate_module(module, is_local)` - 验证/阻止模块导入
- `validate_function(func, is_local)` - 验证/阻止函数引用
- `intercept_reduce_call(callable_obj, args)` - 拦截 `__reduce__` 调用
- `inspect_reduced_object(obj)` - 检查/替换通过 `__reduce__` 创建的对象
- `intercept_setstate(obj, state)` - 在 `__setstate__` 之前检查状态
- `authorize_instantiation(cls, args, kwargs)` - 控制类实例化

**另见：** `pyfory/policy.py` 包含每个hook的详细文档和示例。

## 🐛 故障排查

### 常见问题

**Q: 格式功能的 ImportError**

```python
# A: 安装行格式支持
pip install pyfory[format]

# 或从源码安装并支持格式功能
pip install -e ".[format]"
```

**Q: 序列化性能慢**

```python
# A: 检查是否启用了 Cython 加速
import pyfory
print(pyfory.ENABLE_FORY_CYTHON_SERIALIZATION)  # 应该为 True

# 如果为 False，Cython 扩展可能未正确编译
# 使用以下命令重新安装：pip install --force-reinstall --no-cache-dir pyfory

# 对于调试，您可以在导入前禁用 Cython 模式
import os
os.environ['ENABLE_FORY_CYTHON_SERIALIZATION'] = '0'
import pyfory  # 现在使用纯 Python 模式
```

**Q: 跨语言兼容性问题**

```python
# A: 使用显式类型注册和一致的命名
f = pyfory.Fory(xlang=True)
f.register(MyClass, typename="com.package.MyClass")  # 在所有语言中使用相同的名称
```

**Q: 循环引用错误或重复数据**

```python
# A: 启用引用跟踪
f = pyfory.Fory(ref=True)  # 循环引用必需

# 循环引用示例
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

node1 = Node(1)
node2 = Node(2)
node1.next = node2
node2.next = node1  # 循环引用

data = f.dumps(node1)
result = f.loads(data)
assert result.next.next is result  # 循环引用被保留
```

### 调试模式

```python
# 在导入 pyfory 之前设置环境变量以禁用 Cython 进行调试
import os
os.environ['ENABLE_FORY_CYTHON_SERIALIZATION'] = '0'
import pyfory  # 现在使用纯 Python 实现

# 这对以下情况很有用：
# 1. 调试协议问题
# 2. 理解序列化行为
# 3. 无需重新编译 Cython 进行开发
```

**Q: Schema 演化不起作用**

```python
# A: 为 schema 演化启用兼容模式
f = pyfory.Fory(xlang=True, compatible=True)

# 版本 1：原始类
@dataclass
class User:
    name: str
    age: int

f.register(User, typename="User")
data = f.dumps(User("Alice", 30))

# 版本 2：添加新字段（向后兼容）
@dataclass
class User:
    name: str
    age: int
    email: str = "unknown@example.com"  # 带默认值的新字段

# 仍然可以反序列化旧数据
user = f.loads(data)
print(user.email)  # "unknown@example.com"
```

**Q: 严格模式下的类型注册错误**

```python
# A: 在序列化之前注册所有自定义类型
f = pyfory.Fory(strict=True)

# 使用前必须注册
f.register(MyClass, type_id=100)
f.register(AnotherClass, type_id=101)

# 或禁用严格模式（不推荐用于生产环境）
f = pyfory.Fory(strict=False)  # 仅在受信任的环境中使用
```

## 🤝 贡献

Apache Fory™ 是 Apache 软件基金会下的开源项目。我们欢迎所有形式的贡献：

### 如何贡献

1. **报告问题**：发现 bug？[提交 issue](https://github.com/apache/fory/issues)
2. **建议功能**：有想法？开始讨论
3. **改进文档**：文档改进总是受欢迎的
4. **提交代码**：请查看我们的[贡献指南](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)

### 开发环境设置

```bash
git clone https://github.com/apache/fory.git
cd fory/python

# 安装依赖
pip install -e ".[dev,format]"

# 运行测试
pytest -v -s .

# 运行特定测试
pytest -v -s pyfory/tests/test_serializer.py

# 格式化代码
ruff format .
ruff check --fix .
```

## 📄 许可证

Apache License 2.0。详见 [LICENSE](https://github.com/apache/fory/blob/main/LICENSE)。

---

**Apache Fory™** - 适用于现代应用的极速、安全且多功能的序列化框架。

## 🔗 链接

- **文档**：https://fory.apache.org/docs/latest/python_guide/
- **GitHub**：https://github.com/apache/fory
- **PyPI**：https://pypi.org/project/pyfory/
- **Issues**：https://github.com/apache/fory/issues
- **Slack**：https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw
- **基准测试**：https://fory.apache.org/docs/latest/benchmarks/

## 🌟 社区

我们欢迎贡献！无论是 bug 报告、功能请求、文档改进还是代码贡献，我们都感激您的帮助。

- 在 [GitHub](https://github.com/apache/fory) 上给项目加星 ⭐
- 加入我们的 [Slack 社区](https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw) 💬
- 在 [X/Twitter](https://x.com/ApacheFory) 上关注我们 🐦
