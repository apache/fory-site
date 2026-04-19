---
id: usage
title: Apache Fory™ 使用
sidebar_position: 1
---

本章节提供 Apache Fory™ 的快速入门示例。

## 原生序列化

**当你只在单一语言内使用时，请始终选择原生模式。** 原生模式不需要为跨语言兼容写入额外类型元信息，因此性能最好。

xlang 模式会引入额外的元信息编码开销，并且只允许序列化所有受支持语言都能映射的类型。语言特有类型在 xlang 模式下会被拒绝。

### Java 序列化

如果不需要跨语言支持，请使用 Java 模式以获得最佳性能。

下面的示例展示了最基本的 Java 原生用法：创建可复用的 Java 模式运行时、注册用户类型，然后完成一次序列化和反序列化往返。实际项目中不要为每个对象重新创建 `Fory` 实例，而应长期复用同一个实例。

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static class Person {
    String name;
    int age;
  }

  public static void main(String[] args) {
    // 创建一次 Fory 实例并重复复用。
    BaseFory fory = Fory.builder()
      .withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      // 如果需要线程安全用法，请将 `build` 替换为 `buildThreadSafeFory`。
      .build();
    fory.register(Person.class);

    Person person = new Person();
    person.name = "chaokunyang";
    person.age = 28;

    byte[] bytes = fory.serialize(person);
    Person result = (Person) fory.deserialize(bytes);
    System.out.println(result.name + " " + result.age);
  }
}
```

关于兼容模式、压缩和更多高级特性，请参见 [Java 序列化指南](../guide/java/index.md)。

### Python 序列化

Python 原生模式可以作为 `pickle` 和 `cloudpickle` 的高性能替代方案。

这个示例使用 dataclass 和显式整数类型注解，让 Fory 能以更清晰的 Schema 进行高效序列化。与其他语言一样，推荐只创建一次 `Fory` 实例、只注册一次类型，然后在后续调用中重复使用。

```python
from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.int32

fory = pyfory.Fory()
fory.register_type(Person)

person = Person(name="chaokunyang", age=28)
data = fory.serialize(person)
result = fory.deserialize(data)
print(result.name, result.age)
```

关于类型注解、兼容模式和更多高级特性，请参见 [Python 指南](../guide/python/index.md)。

### Go 序列化

Go 原生模式默认启用。注册一次结构体后，重复复用同一个 `Fory` 实例即可。

Go 运行时天然适配导出的 struct 字段和显式类型注册。下面的代码演示了最常见的流程：创建 `Fory`、注册结构体类型、序列化一个值，再反序列化到目标结构体中。

```go
package main

import (
    "fmt"

    "github.com/apache/fory/go/fory"
)

type Person struct {
    Name string
    Age  int32
}

func main() {
    f := fory.New()
    if err := f.RegisterStruct(Person{}, 1); err != nil {
        panic(err)
    }

    person := &Person{Name: "chaokunyang", Age: 28}
    data, err := f.Serialize(person)
    if err != nil {
        panic(err)
    }

    var result Person
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    fmt.Printf("%s %d\n", result.Name, result.Age)
}
```

关于配置、struct tag 和 Schema 演进，请参见 [Go 指南](../guide/go/index.md)。

### C# 序列化

C# 原生序列化使用 `Apache.Fory` 运行时和 `[ForyObject]` 模型类型。

在 C# 中，常见模式是先用 `[ForyObject]` 标记模型，再创建一次运行时并在使用前注册类型。示例展示的是强类型的 `Serialize` / `Deserialize<T>` API，这也是 .NET 应用中最直接的用法。

```csharp
using Apache.Fory;

[ForyObject]
public sealed class Person
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}

Fory fory = Fory.Builder().Build();
fory.Register<Person>(1);

Person person = new() { Name = "chaokunyang", Age = 28 };
byte[] data = fory.Serialize(person);
Person result = fory.Deserialize<Person>(data);

Console.WriteLine($"{result.Name} {result.Age}");
```

关于源代码生成器、引用跟踪和 Schema 演进，请参见 [C# 指南](../guide/csharp/index.md)。

### Swift 序列化

Swift 原生序列化直接使用 `@ForyObject` 模型和 `Fory` 运行时。

Swift 通过宏定义模型类型，因此示例先使用 `@ForyObject` 标记类型，再注册类型 ID 并完成一次强类型往返。这是 Swift 应用侧最推荐的入门方式。

```swift
import Fory

@ForyObject
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
fory.register(Person.self, id: 1)

let person = Person(name: "chaokunyang", age: 28)
let data = try fory.serialize(person)
let result: Person = try fory.deserialize(data)

print("\(result.name) \(result.age)")
```

关于多态、Schema 演进和常见问题排查，请参见 [Swift 指南](../guide/swift/)。

### Rust 序列化

Rust 原生模式使用 `Fory::default()` 和 derive 宏来实现编译期类型安全的序列化。常见模式是先为类型派生 `ForyObject`，注册一次类型，再重复复用已经配置好的运行时。

```rust
use fory::{Error, Fory, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
    fory.register::<Person>(1)?;

    let person = Person {
        name: "chaokunyang".to_string(),
        age: 28,
    };

    let bytes = fory.serialize(&person)?;
    let result: Person = fory.deserialize(&bytes)?;
    assert_eq!(person, result);
    Ok(())
}
```

关于引用、多态和 row format 支持，请参见 [Rust 指南](../guide/rust/index.md)。

### C++ 序列化

C++ 原生模式使用 `FORY_STRUCT` 宏描述可序列化字段，再通过配置好的 `Fory` 运行时对值进行编码和解码。对于单语言 C++ 场景，建议显式设置 `xlang(false)`，让运行时保持在原生模式。

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

struct Person {
  std::string name;
  int32_t age;

  bool operator==(const Person &other) const {
    return name == other.name && age == other.age;
  }

  FORY_STRUCT(Person, name, age);
};

int main() {
  auto fory = Fory::builder().xlang(false).build();
  fory.register_struct<Person>(1);

  Person person{"chaokunyang", 28};

  auto bytes = fory.serialize(person);
  auto result = fory.deserialize<Person>(bytes.value());
  assert(result.ok());
  assert(person == result.value());
  return 0;
}
```

关于 `FORY_STRUCT`、线程安全和 Schema 演进，请参见 [C++ 指南](../guide/cpp/index.md)。

### Scala 序列化

Scala 原生模式对 case class、集合和 `Option` 等 Scala 特有类型提供了优化支持。

在 Scala 项目中，应先注册 Scala 专用序列化器，让 Fory 正确理解 Scala 特有的数据结构。完成这一步后，就可以像 Java 运行时一样注册 case class 并执行序列化。

```scala
import org.apache.fory.Fory
import org.apache.fory.config.Language
import org.apache.fory.serializer.scala.ScalaSerializers

case class Person(name: String, age: Int)

object Example {
  def main(args: Array[String]): Unit = {
    val fory = Fory.builder()
      .withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      .build()
    ScalaSerializers.registerSerializers(fory)
    fory.register(classOf[Person])

    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes).asInstanceOf[Person]
    println(s"${result.name} ${result.age}")
  }
}
```

关于集合序列化和集成模式，请参见 [Scala 指南](../guide/scala/index.md)。

### Kotlin 序列化

Kotlin 原生模式对 data class、可空类型和 Kotlin 集合提供了优化支持。

Kotlin 的整体流程与 Java 类似，只是额外需要注册 Kotlin 专用序列化器。下面的示例使用 data class，展示了进行高效原生序列化所需的最小配置。

```kotlin
import org.apache.fory.Fory
import org.apache.fory.config.Language
import org.apache.fory.serializer.kotlin.KotlinSerializers

data class Person(val name: String, val age: Int)

fun main() {
    val fory = Fory.builder()
        .withLanguage(Language.JAVA)
        .requireClassRegistration(true)
        .build()
    KotlinSerializers.registerSerializers(fory)
    fory.register(Person::class.java)

    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes) as Person
    println("${result.name} ${result.age}")
}
```

关于空安全和默认值支持，请参见 [kotlin/README.md](https://github.com/apache/fory/blob/main/kotlin/README.md)。

## 跨语言序列化

**只有在确实需要跨语言数据交换时才使用 xlang 模式。** xlang 模式会为跨语言兼容增加类型元信息开销，并且只支持能够在所有语言之间映射的类型。

下面的示例在多个运行时中使用同一个 `Person` Schema。无论使用哪种语言，都需要启用 xlang 模式，并用相同的 ID 或相同的全限定名称注册类型。

### Java

Java 的 xlang 用法可以看作 JVM 服务中的基准模式。启用 `Language.XLANG` 后，用稳定的 ID 或名称注册类型，并确保所有对端语言都使用相同的映射关系。

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class XlangExample {
  public record Person(String name, int age) {}

  public static void main(String[] args) {
    Fory fory = Fory.builder()
      .withLanguage(Language.XLANG)
      .build();

    fory.register(Person.class, 1);
    // fory.register(Person.class, "example.Person");

    Person person = new Person("chaokunyang", 28);
    byte[] bytes = fory.serialize(person);
    Person result = (Person) fory.deserialize(bytes);
    System.out.println(result.name() + " " + result.age());
  }
}
```

### Go

Go 通过 `WithXlang(true)` 启用跨语言模式。真正关键的不是 Go 语法本身，而是保证注册的类型身份与其他读写同一载荷的语言完全一致。

```go
package main

import (
    "fmt"

    "github.com/apache/fory/go/fory"
)

type Person struct {
    Name string
    Age  int32
}

func main() {
    f := fory.New(fory.WithXlang(true))
    if err := f.RegisterStruct(Person{}, 1); err != nil {
        panic(err)
    }

    person := &Person{Name: "chaokunyang", Age: 28}
    data, err := f.Serialize(person)
    if err != nil {
        panic(err)
    }

    var result Person
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    fmt.Printf("%s %d\n", result.Name, result.Age)
}
```

### Rust

Rust 同样遵循这套跨语言约定，只是通过派生 trait 和在 `Fory` 实例上显式注册来表达。只要类型 ID 与其他运行时一致，载荷就可以安全地跨语言流转。

```rust
use fory::{Fory, ForyObject};
use std::error::Error;

#[derive(ForyObject, Debug)]
struct Person {
    name: String,
    age: i32,
}

fn main() -> Result<(), Box<dyn Error>> {
    let mut fory = Fory::default().xlang(true);
    fory.register::<Person>(1)?;
    // fory.register_by_name::<Person>("example.Person")?;

    let person = Person {
        name: "chaokunyang".to_string(),
        age: 28,
    };
    let bytes = fory.serialize(&person);
    let result: Person = fory.deserialize(&bytes)?;
    println!("{} {}", result.name, result.age);
    Ok(())
}
```

### JavaScript

JavaScript 的跨语言支持是基于 Schema 描述的。它不是注册类，而是通过 `Type.object(...)` 描述载荷结构，再使用返回的序列化器来编码和解码数据。

这些包目前还没有发布到 npm。因此请先从 Apache Fory 仓库完成构建，再按下面的 API 方式使用。

```javascript
import Fory, { Type } from "@apache-fory/core";

/**
 * `@apache-fory/hps` 会通过 JIT 直接使用 V8 fast calls。
 * 启用时请使用 Node.js 20+。
 * 如果安装失败，请将它替换为 `const hps = null;`。
 */
import hps from "@apache-fory/hps";

const description = Type.object("example.Person", {
  name: Type.string(),
  age: Type.int32(),
});

const fory = new Fory({ hps });
const { serialize, deserialize } = fory.registerSerializer(description);

const payload = serialize({ name: "chaokunyang", age: 28 });
const result = deserialize(payload);
console.log(result);
```

### C\#

C# 的跨语言代码看起来与原生模式很接近，但运行时需要显式启用 xlang 和 compatible 模式。与此同时，仍然必须与 Java、Go、Swift、Rust 等对端使用相同的类型 ID 或 namespace/name 映射。

```csharp
using Apache.Fory;

[ForyObject]
public sealed class Person
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}

Fory fory = Fory.Builder()
    .Xlang(true)
    .Compatible(true)
    .Build();

fory.Register<Person>(1);

Person person = new() { Name = "chaokunyang", Age = 28 };
byte[] payload = fory.Serialize(person);
Person result = fory.Deserialize<Person>(payload);

Console.WriteLine($"{result.Name} {result.Age}");
```

### Swift

Swift 的跨语言序列化仍然使用与原生模式相同的 `@ForyObject` 模型风格，只是在创建运行时时要传入 `xlang: true`。要实现互操作，稳定的注册 ID 仍然是最核心的要求。

```swift
import Fory

@ForyObject
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory(xlang: true, trackRef: false, compatible: true)
fory.register(Person.self, id: 1)

let person = Person(name: "chaokunyang", age: 28)
let data = try fory.serialize(person)
let result: Person = try fory.deserialize(data)

print("\(result.name) \(result.age)")
```

### 要点

- 在每个运行时中都显式启用 xlang 模式，例如 `Language.XLANG`、`WithXlang(true)`、`Xlang(true)`、`Fory(xlang: true, ...)` 等。
- 在所有语言中使用**一致的 ID 或名称**注册类型。
- 基于 ID 的注册更紧凑、速度更快，但需要集中协调以避免冲突。
- 基于名称的注册更容易在团队间管理，但载荷会稍大一些。
- 只使用具备跨语言映射的类型，详见 [Type Mapping](../specification/xlang_type_mapping.md)。

关于跨语言场景中的循环引用、共享引用和多态示例，请参见：

- [跨语言序列化指南](../guide/xlang/index.md)
- [Go 指南 - 跨语言](../guide/go/cross-language.md)
- [C# 指南 - 跨语言](../guide/csharp/cross-language.md)
- [Swift 指南 - 跨语言](../guide/swift/cross_language)

## Row Format 编码

Row format 提供零拷贝随机访问能力，非常适合分析型负载和数据处理流水线。

### Java

```java
import org.apache.fory.format.*;
import java.util.*;
import java.util.stream.*;

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
Foo foo = new Foo();
foo.f1 = 10;
foo.f2 = IntStream.range(0, 1000000).boxed().collect(Collectors.toList());
foo.f3 = IntStream.range(0, 1000000).boxed().collect(Collectors.toMap(i -> "k"+i, i -> i));

List<Bar> bars = new ArrayList<>(1000000);
for (int i = 0; i < 1000000; i++) {
  Bar bar = new Bar();
  bar.f1 = "s" + i;
  bar.f2 = LongStream.range(0, 10).boxed().collect(Collectors.toList());
  bars.add(bar);
}
foo.f4 = bars;

// 序列化为 row format（可被 Python 以零拷贝方式读取）
BinaryRow binaryRow = encoder.toRow(foo);

// 反序列化整个对象
Foo newFoo = encoder.fromRow(binaryRow);

// 不做完整反序列化，直接零拷贝访问嵌套字段
BinaryArray binaryArray2 = binaryRow.getArray(1);  // 访问 f2 字段
BinaryArray binaryArray4 = binaryRow.getArray(3);  // 访问 f4 字段
BinaryRow barStruct = binaryArray4.getStruct(10);   // 访问第 11 个 Bar 元素
long value = barStruct.getArray(1).getInt64(5);     // 访问嵌套值

// 部分反序列化
RowEncoder<Bar> barEncoder = Encoders.bean(Bar.class);
Bar newBar = barEncoder.fromRow(barStruct);
Bar newBar2 = barEncoder.fromRow(binaryArray4.getStruct(20));
```

### Python

```python
from dataclasses import dataclass
from typing import List, Dict
import pyarrow as pa
import pyfory

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

encoder = pyfory.encoder(Foo)
foo = Foo(
    f1=10,
    f2=list(range(1000_000)),
    f3={f"k{i}": i for i in range(1000_000)},
    f4=[Bar(f1=f"s{i}", f2=list(range(10))) for i in range(1000_000)]
)

# 序列化为 row format
binary: bytes = encoder.to_row(foo).to_bytes()

# 无需完整反序列化即可零拷贝随机访问
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])           # 直接访问元素
print(foo_row.f4[100000].f1)        # 访问嵌套字段
print(foo_row.f4[200000].f2[5])     # 访问更深层的嵌套字段
```

更多 row format 细节请参见 [Java Row Format 指南](../guide/java/row-format.md) 或 [Python Row Format 指南](../guide/python/row-format.md)。
