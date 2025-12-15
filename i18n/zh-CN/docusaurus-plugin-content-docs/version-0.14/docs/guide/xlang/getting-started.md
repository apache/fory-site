---
title: 入门指南
sidebar_position: 1
id: xlang_getting_started
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

本指南涵盖了所有支持语言的跨语言序列化安装和基本设置。

## 安装

### Java

**Maven：**

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.14.0</version>
</dependency>
```

**Gradle：**

```gradle
implementation 'org.apache.fory:fory-core:0.14.0'
```

### Python

```bash
pip install pyfory
```

### Go

```bash
go get github.com/apache/fory/go/fory
```

### Rust

```toml
[dependencies]
fory = "0.14"
```

### JavaScript

```bash
npm install @apache-fory/fory
```

### C++

使用 Bazel 或 CMake 从源代码构建。有关详细信息，请参阅 [C++ 指南](../cpp/index.md)。

## 启用跨语言模式

每种语言都需要启用 xlang 模式以确保跨语言的二进制兼容性。

### Java

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)  // 启用跨语言模式
    .withRefTracking(true)          // 可选：用于循环引用
    .build();
```

### Python

```python
import pyfory

# xlang 模式默认启用
fory = pyfory.Fory()

# 显式配置
fory = pyfory.Fory(ref_tracking=True)
```

### Go

```go
import forygo "github.com/apache/fory/go/fory"

fory := forygo.NewFory()
// 或启用引用跟踪
fory := forygo.NewFory(true)
```

### Rust

```rust
use fory::Fory;

let fory = Fory::default();
```

### JavaScript

```javascript
import Fory from "@apache-fory/fory";

const fory = new Fory();
```

### C++

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

auto fory = Fory::builder()
    .xlang(true)
    .build();
```

## 类型注册

自定义类型必须在所有语言中使用一致的名称或 ID 进行注册。

### 按名称注册（推荐）

使用字符串名称更灵活，不易产生冲突：

**Java：**

```java
fory.register(Person.class, "example.Person");
```

**Python：**

```python
fory.register_type(Person, typename="example.Person")
```

**Go：**

```go
fory.RegisterNamedType(Person{}, "example.Person")
```

**Rust：**

```rust
#[derive(Fory)]
#[tag("example.Person")]
struct Person {
    name: String,
    age: i32,
}
```

**JavaScript：**

```javascript
const description = Type.object("example.Person", {
  name: Type.string(),
  age: Type.int32(),
});
fory.registerSerializer(description);
```

**C++：**

```cpp
fory.register_struct<Person>("example.Person");
// 对于枚举，使用 register_enum：
// fory.register_enum<Color>("example.Color");
```

### 按 ID 注册

使用数字 ID 更快，生成的二进制输出更小：

**Java：**

```java
fory.register(Person.class, 100);
```

**Python：**

```python
fory.register_type(Person, type_id=100)
```

**Go：**

```go
fory.Register(Person{}, 100)
```

**C++：**

```cpp
fory.register_struct<Person>(100);
// 对于枚举，使用 register_enum：
// fory.register_enum<Color>(101);
```

## Hello World 示例

一个完整的示例，展示了在 Java 中序列化并在 Python 中反序列化：

### Java（序列化器）

```java
import org.apache.fory.*;
import org.apache.fory.config.*;
import java.nio.file.*;

public class Person {
    public String name;
    public int age;
}

public class HelloWorld {
    public static void main(String[] args) throws Exception {
        Fory fory = Fory.builder()
            .withLanguage(Language.XLANG)
            .build();
        fory.register(Person.class, "example.Person");

        Person person = new Person();
        person.name = "Alice";
        person.age = 30;

        byte[] bytes = fory.serialize(person);
        Files.write(Path.of("person.bin"), bytes);
        System.out.println("Serialized to person.bin");
    }
}
```

### Python（反序列化器）

```python
import pyfory
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: pyfory.Int32Type

fory = pyfory.Fory()
fory.register_type(Person, typename="example.Person")

with open("person.bin", "rb") as f:
    data = f.read()

person = fory.deserialize(data)
print(f"Name: {person.name}, Age: {person.age}")
# 输出: Name: Alice, Age: 30
```

## 最佳实践

1. **使用一致的类型名称**：确保所有语言使用相同的类型名称或 ID
2. **启用引用跟踪**：如果数据包含循环引用或共享引用
3. **重用 Fory 实例**：创建 Fory 的成本较高；应重用实例
4. **使用类型注解**：在 Python 中，使用 `pyfory.Int32Type` 等进行精确类型映射
5. **测试跨语言**：验证序列化在所有目标语言中都能正常工作

## 后续步骤

- [类型映射](https://fory.apache.org/docs/specification/xlang_type_mapping) - 跨语言类型映射参考
- [序列化](serialization.md) - 详细的序列化示例
- [故障排查](troubleshooting.md) - 常见问题及解决方案
