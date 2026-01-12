---
id: usage
title: Usage
sidebar_position: 1
---

This section provides quick examples for getting started with Apache Fory™.

## Native Serialization

**Always use native mode when working with a single language.** Native mode delivers optimal performance by avoiding the type metadata overhead required for cross-language compatibility.

Xlang mode introduces additional metadata encoding costs and restricts serialization to types that are common across all supported languages. Language-specific types will be rejected during serialization in xlang-mode.

### Java Serialization

When you don't need cross-language support, use Java mode for optimal performance.

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static class Person {
    String name;
    int age;
  }

  public static void main(String[] args) {
    // Create Fory instance - should be reused across serializations
    BaseFory fory = Fory.builder()
      .withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      // replace `build` with `buildThreadSafeFory` for Thread-Safe Usage
      .build();
    // Register your classes (required when class registration is enabled)
    fory.register(Person.class);
    // Serialize
    Person person = new Person();
    person.name = "chaokunyang";
    person.age = 28;
    byte[] bytes = fory.serialize(person);
    Person result = (Person) fory.deserialize(bytes);
    System.out.println(result.name + " " + result.age);  // Output: chaokunyang 28
  }
}
```

For detailed Java usage including compatibility modes, compression, and advanced features, see [Java Serialization Guide](../guide/java_serialization_guide.md).

### Python Serialization

Python native mode provides a high-performance drop-in replacement for pickle/cloudpickle with better speed and compatibility.

```python
from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.int32

# Create Fory instance - should be reused across serializations
fory = pyfory.Fory()
# Register your classes (required when class registration is enabled)
fory.register_type(Person)
person = Person(name="chaokunyang", age=28)
data = fory.serialize(person)
result = fory.deserialize(data)
print(result.name, result.age)  # Output: chaokunyang 28
```

For detailed Python usage including type hints, compatibility modes, and advanced features, see [Python Guide](../guide/python_guide.md).

### Scala Serialization

Scala native mode provides optimized serialization for Scala-specific types including case classes, collections, and Option types.

```scala
import org.apache.fory.Fory
import org.apache.fory.config.Language
import org.apache.fory.serializer.scala.ScalaSerializers

case class Person(name: String, age: Int)

object Example {
  def main(args: Array[String]): Unit = {
    // Create Fory instance - should be reused across serializations
    val fory = Fory.builder()
      .withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      .build()
    // Register Scala serializers for Scala-specific types
    ScalaSerializers.registerSerializers(fory)
    // Register your case classes
    fory.register(classOf[Person])
    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes).asInstanceOf[Person]
    println(s"${result.name} ${result.age}")  // Output: chaokunyang 28
  }
}
```

For detailed Scala usage including collection serialization and integration patterns, see [Scala Guide](../guide/scala_guide.md).

### Kotlin Serialization

Kotlin native mode provides optimized serialization for Kotlin-specific types including data classes, nullable types, and Kotlin collections.

```kotlin
import org.apache.fory.Fory
import org.apache.fory.config.Language
import org.apache.fory.serializer.kotlin.KotlinSerializers

data class Person(val name: String, val age: Int)

fun main() {
    // Create Fory instance - should be reused across serializations
    val fory = Fory.builder()
        .withLanguage(Language.JAVA)
        .requireClassRegistration(true)
        .build()
    // Register Kotlin serializers for Kotlin-specific types
    KotlinSerializers.registerSerializers(fory)
    // Register your data classes
    fory.register(Person::class.java)
    val bytes = fory.serialize(Person("chaokunyang", 28))
    val result = fory.deserialize(bytes) as Person
    println("${result.name} ${result.age}")  // Output: chaokunyang 28
}
```

For detailed Kotlin usage including null safety and default value support, see [kotlin/README.md](https://github.com/apache/fory/blob/main/kotlin/README.md).

## Cross-Language Serialization

**Only use xlang mode when you need cross-language data exchange.** Xlang mode adds type metadata overhead for cross-language compatibility and only supports types that can be mapped across all languages. For single-language use cases, always prefer native mode for better performance.

The following examples demonstrate serializing a `Person` object across Java and Rust. For other languages (Python, Go, JavaScript, etc.), simply set the language mode to `XLANG` and follow the same pattern.

### Java

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class XlangExample {
  public record Person(String name, int age) {}

  public static void main(String[] args) {
    // Create Fory instance with XLANG mode
    Fory fory = Fory.builder()
      .withLanguage(Language.XLANG)
      .build();

    // Register with cross-language type id/name
    fory.register(Person.class, 1);
    // fory.register(Person.class, "example.Person");
    Person person = new Person("chaokunyang", 28);
    byte[] bytes = fory.serialize(person);
    // bytes can be deserialized by Rust, Python, Go, or other languages
    Person result = (Person) fory.deserialize(bytes);
    System.out.println(result.name + " " + result.age);  // Output: chaokunyang 28
  }
}
```

### Rust

```rust
use fory::{Fory, ForyObject};

#[derive(ForyObject, Debug)]
struct Person {
    name: String,
    age: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
    fory.register::<Person>(1)?;
    // fory.register_by_name::<Person>("example.Person")?;
    let person = Person {
        name: "chaokunyang".to_string(),
        age: 28,
    };
    let bytes = fory.serialize(&person);
    // bytes can be deserialized by Java, Python, Go, or other languages
    let result: Person = fory.deserialize(&bytes)?;
    println!("{} {}", result.name, result.age);  // Output: chaokunyang 28
}
```

### Golang

```go
type Person struct {
  name: string
  age: i32
}
fory := fory.NewFory(true)
fory.Register(Person{}, 1)
person := Person{"chaokunyang", 28}
bytes, err := fory.Marshal(person)
var p Person
err = fory.Unmarshal(bytes, &p)
```

### JavaScript

```javascript
import Fory, { Type } from "@apache-fory/fory";

/**
 * @apache-fory/hps use v8's fast-calls-api that can be called directly by jit, ensure that the version of Node is 20 or above.
 * Experimental feature, installation success cannot be guaranteed at this moment
 * If you are unable to install the module, replace it with `const hps = null;`
 **/
import hps from "@apache-fory/hps";

// Now we describe data structures using JSON, but in the future, we will use more ways.
const description = Type.object("example.Person", {
  name: Type.string(),
  age: Type.int32(),
});
const fory = new Fory({ hps });
const { serialize, deserialize } = fory.registerSerializer(description);
const input = serialize({ name: "chaokunyang", age: 28 });
const result = deserialize(input);
console.log(result);
```

### Key Points

- Use `Language.XLANG` mode in all languages
- Register types with **consistent IDs or names** across all languages:
  - **By ID** (`fory.register(Person.class, 1)`): Faster serialization, more compact encoding, but requires coordination to avoid ID conflicts
  - **By name** (`fory.register(Person.class, "example.Person")`): More flexible, less prone to conflicts, easier to manage across teams, but slightly larger encoding
- Type IDs/names must match across all languages for successful deserialization
- Only use types that have cross-language mappings (see [Type Mapping](docs/specification/xlang_type_mapping.md))

For examples with **circular references**, **shared references**, and **polymorphism** across languages, see:

- [Cross-Language Serialization Guide](../guide/xlang_serialization_guide.md)
- [Java Serialization Guide - Cross Language](../guide/java_serialization_guide.md#cross-language-serialization)
- [Python Guide - Cross Language](../guide/python_guide.md#cross-language-serialization)

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

For more details on row format, see [Row Format Guide](../guide/row_format_guide.md).
