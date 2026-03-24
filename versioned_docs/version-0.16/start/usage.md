---
id: usage
title: Usage
sidebar_position: 1
---

This section provides quick examples for getting started with Apache Fory™.

## Native Serialization

**Always use native mode when working with a single language.** Native mode delivers optimal performance by avoiding the type metadata overhead required for cross-language compatibility.

Xlang mode introduces additional metadata encoding costs and restricts serialization to types that are common across all supported languages. Language-specific types will be rejected during serialization in xlang mode.

### Java Serialization

When you do not need cross-language support, use Java mode for optimal performance.

This example creates a reusable Java-mode runtime, registers a user class, and then performs a basic serialize/deserialize round trip. In production code, keep the `Fory` instance alive and reuse it across requests instead of rebuilding it for every object.

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static class Person {
    String name;
    int age;
  }

  public static void main(String[] args) {
    // Create a Fory instance once and reuse it.
    BaseFory fory = Fory.builder()
      .withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      // Replace `build` with `buildThreadSafeFory` for thread-safe usage.
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

For detailed Java usage including compatibility modes, compression, and advanced features, see [Java Serialization Guide](../guide/java/index.md).

### Python Serialization

Python native mode provides a high-performance drop-in replacement for `pickle` and `cloudpickle`.

The example below uses a dataclass with explicit integer typing so Fory can preserve the intended schema efficiently. As with other runtimes, create the `Fory` instance once, register your types once, and then reuse it for repeated serialization.

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

For detailed Python usage including type hints, compatibility modes, and advanced features, see [Python Guide](../guide/python/index.md).

### Go Serialization

Go native mode is the default. Register your structs once, then reuse the same `Fory` instance.

The Go runtime works naturally with exported struct fields and explicit type registration. This snippet shows the standard flow: create `Fory`, register a struct type, serialize a value, and deserialize into a destination struct.

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

For detailed Go usage including configuration, struct tags, and schema evolution, see [Go Guide](../guide/go/index.md).

### C# Serialization

C# native serialization uses the `Apache.Fory` runtime together with `[ForyObject]` model types.

In C#, the usual pattern is to mark your model with `[ForyObject]`, build a runtime once, and register the type before use. The example demonstrates the strongly typed `Serialize` and `Deserialize<T>` APIs that fit normal .NET application code.

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

For detailed C# usage including source generators, references, and schema evolution, see [C# Guide](../guide/csharp/index.md).

### Swift Serialization

Swift native serialization uses `@ForyObject` models and the `Fory` runtime directly.

Swift uses macro-based model definitions, so the example starts by annotating the type with `@ForyObject`, then registers the type ID and performs a typed round trip. This is the recommended starting point for app-side Swift usage.

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

For detailed Swift usage including polymorphism, schema evolution, and troubleshooting, see [Swift Guide](../guide/swift/index.md).

### Rust Serialization

Rust native mode uses `Fory::default()` and derive macros for compile-time type-safe serialization. The normal pattern is to derive `ForyObject`, register the type once, and then reuse the configured runtime for repeated serialization.

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

For detailed Rust usage including references, polymorphism, and row format support, see [Rust Guide](../guide/rust/index.md).

### C++ Serialization

C++ native mode uses the `FORY_STRUCT` macro to describe serializable fields and a configured `Fory` runtime to encode and decode values. For single-language C++ usage, set `xlang(false)` explicitly so the runtime stays in native mode.

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

For detailed C++ usage including `FORY_STRUCT`, thread safety, and schema evolution, see [C++ Guide](../guide/cpp/index.md).

### Scala Serialization

Scala native mode provides optimized serialization for Scala-specific types including case classes, collections, and `Option`.

For Scala projects, register the Scala serializers first so Fory understands Scala-specific data structures correctly. After that, you can register your case classes and use the same core API as the Java runtime.

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

For detailed Scala usage including collection serialization and integration patterns, see [Scala Guide](../guide/scala/index.md).

### Kotlin Serialization

Kotlin native mode provides optimized serialization for Kotlin-specific types including data classes, nullable types, and Kotlin collections.

Kotlin follows the same builder flow as Java, with an extra registration step for Kotlin-specific serializers. The example uses a data class and shows the minimal setup needed for efficient native serialization.

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

For detailed Kotlin usage including null safety and default value support, see [kotlin/README.md](https://github.com/apache/fory/blob/main/kotlin/README.md).

## Cross-Language Serialization

**Only use xlang mode when you need cross-language data exchange.** Xlang mode adds type metadata overhead for cross-language compatibility and only supports types that can be mapped across all languages.

The examples below use the same `Person` schema across multiple runtimes. In every language, enable xlang mode and register the type with the same ID or the same fully qualified name.

### Java

Java xlang usage is the baseline pattern for JVM services. Enable `Language.XLANG`, register the type with a stable ID or name, and make sure every peer language uses the same mapping.

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

Go xlang mode is enabled through `WithXlang(true)`. The important part is not the Go syntax itself, but keeping the registered type identity aligned with every other language that reads or writes the payload.

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

Rust follows the same cross-language contract, but expresses it through derived traits and explicit registration on the `Fory` instance. Once the type ID matches the other runtimes, the payload can move across language boundaries safely.

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

JavaScript cross-language support is schema-driven. Instead of registering a class, you describe the payload shape with `Type.object(...)`, then use the returned serializer pair to encode and decode values.

These packages are not published to npm yet. Build them from the Apache Fory repository first, then use the following API shape.

```javascript
import Fory, { Type } from "@apache-fory/core";

/**
 * `@apache-fory/hps` uses V8 fast calls directly from JIT.
 * Use Node.js 20+ when enabling it.
 * If installation fails, replace it with `const hps = null;`.
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

C# cross-language code looks similar to native usage, but the runtime is explicitly configured for xlang and compatible mode. Use the same type ID or namespace/name mapping as your Java, Go, Swift, or Rust peers.

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

Swift cross-language serialization uses the same `@ForyObject` model style as native mode, but you create the runtime with `xlang: true`. Stable registration IDs are still the key requirement for interoperability.

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

### Key Points

- Enable xlang mode in every runtime (`Language.XLANG`, `WithXlang(true)`, `Xlang(true)`, `Fory(xlang: true, ...)`, and so on).
- Register types with **consistent IDs or names** across all languages.
- ID-based registration is more compact and faster, but it requires coordination to avoid conflicts.
- Name-based registration is easier to manage across teams, but it produces slightly larger payloads.
- Only use types that have cross-language mappings; see [Type Mapping](../specification/xlang_type_mapping.md).

For examples with circular references, shared references, and polymorphism across languages, see:

- [Cross-Language Serialization Guide](../guide/xlang/index.md)
- [Go Guide - Cross Language](../guide/go/cross-language.md)
- [C# Guide - Cross Language](../guide/csharp/cross-language.md)
- [Swift Guide - Cross Language](../guide/swift/cross-language.md)

## Row Format Encoding

Row format provides zero-copy random access to serialized data, making it ideal for analytics workloads and data processing pipelines.

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

// Serialize to row format (can be zero-copy read by Python)
BinaryRow binaryRow = encoder.toRow(foo);

// Deserialize entire object
Foo newFoo = encoder.fromRow(binaryRow);

// Zero-copy access to nested fields without full deserialization
BinaryArray binaryArray2 = binaryRow.getArray(1);  // Access f2 field
BinaryArray binaryArray4 = binaryRow.getArray(3);  // Access f4 field
BinaryRow barStruct = binaryArray4.getStruct(10);   // Access 11th Bar element
long value = barStruct.getArray(1).getInt64(5);     // Access nested value

// Partial deserialization
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

# Serialize to row format
binary: bytes = encoder.to_row(foo).to_bytes()

# Zero-copy random access without full deserialization
foo_row = pyfory.RowData(encoder.schema, binary)
print(foo_row.f2[100000])           # Access element directly
print(foo_row.f4[100000].f1)        # Access nested field
print(foo_row.f4[200000].f2[5])     # Access deeply nested field
```

For more details on row format, see [Java Row Format Guide](../guide/java/row-format.md) or [Python Row Format Guide](../guide/python/row-format.md).
