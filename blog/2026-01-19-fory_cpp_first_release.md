---
slug: fory_cpp_first_release
title: "Introducing Apache Fory C++: a High-Performance, Cross-Language Serialization Framework"
authors: [chaokunyang]
tags: [fory, cpp]
---

**TL;DR**: Apache Fory C++ is a high-performance, cross-language serialization framework that delivers **blazingly-fast serialization performance** while **automatically handling circular references, polymorphic objects, and schema evolution**. Built with C++17 templates and a compact binary protocol, it's designed for developers who refuse to compromise between performance
and developer experience.

- GitHub: https://github.com/apache/fory
- Docs: https://fory.apache.org
- C++ guide: https://fory.apache.org/docs/guide/cpp/

![Apache Fory Logo](https://fory.apache.org/img/navbar-logo.png)

---

## The Modern Serialization Problem

Every backend team eventually needs to move complex objects across process or language boundaries: nested graphs, shared references, polymorphic types, and evolving schemas. The usual choices force you into painful tradeoffs:

1. Fast but fragile: custom binary protocols that break whenever a schema changes
2. Flexible but slow: JSON or text formats that are expensive under load
3. Complex and limiting: IDL-driven workflows with rigid evolution rules

Apache Fory C++ eliminates this false choice. It is designed to be fast, cross-language, and production friendly without sacrificing safety or developer ergonomics.

## Core features you should know

- **Automatic object serialization**: Serialize numeric types, strings, collections, maps, enums, and structs automatically. No IDL required, so domain objects can be serialized and sent directly.
- **Cross-language support**: Fory C++ speaks the same binary protocol as Java, Python, Rust and Go. IDL is optional, and structs with consistent or compatible schemas can be deserialized by other languages automatically.
- **Automatic schema evolution**: Enable Compatible mode and Fory matches fields by field ID when provided, otherwise by name (not position), fills defaults for new fields, and safely skips unknown fields. This is built into the protocol and works across languages.
- **Shared and circular references**: With `track_ref(true)`, Fory preserves object identity and handles cycles. This is essential for graphs, ORM models, or tree structures with parent pointers.
- **Polymorphic and union support**: C++ supports `std::shared_ptr<Base>` polymorphism (named registration) and `std::variant` union types. This covers inheritance, plugin architectures, and heterogeneous collections.
- **Compact binary protocol and meta packing**: The protocol uses compact headers, varints, and meta string encoding. Type metadata is packed with size and hash headers, written once per stream, and referenced by index on subsequent occurrences.
- **Compile-time performance**: Serialization is generated through templates and macros. No runtime reflection. No dynamic field discovery. The fast path is direct memory writes with minimal branching.

## Cross-language example (C++ -> Java and Rust)

The example below serializes in C++ and deserializes in Java and Rust using the same type ID and field layout.

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

struct Message {
  std::string topic;
  int64_t timestamp;
  std::map<std::string, std::string> headers;
  std::vector<uint8_t> payload;
};
FORY_STRUCT(Message, topic, timestamp, headers, payload);

int main() {
  auto fory = Fory::builder().xlang(true).build();
  fory.register_struct<Message>(100);

  Message msg{"events.user", 1699999999000,
              {{"content-type", "application/json"}},
              {'h', 'e', 'l', 'l', 'o'}};

  auto bytes = fory.serialize(msg).value();
  // Send bytes across the network
}
```

```java
import org.apache.fory.Fory;
import org.apache.fory.config.Language;
import java.util.Map;

public class Message {
    public String topic;
    public long timestamp;
    public Map<String, String> headers;
    public byte[] payload;
}

Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .build();

fory.register(Message.class, 100);
Message msg = (Message) fory.deserialize(bytes);
```

```rust
use fory::{Fory, ForyObject};
use std::collections::HashMap;

#[derive(ForyObject)]
struct Message {
    topic: String,
    timestamp: i64,
    headers: HashMap<String, String>,
    payload: Vec<u8>,
}

let mut fory = Fory::default();
fory.register::<Message>(100);
let msg: Message = fory.deserialize(&bytes)?;
```

Tip: in xlang mode, fields are matched by field ID when provided; otherwise by snake_case field name. Keep names or IDs aligned across languages and use the same type IDs.

## Struct serialization protocol: meta packing, sharing, and schema evolution

This is the core of Fory C++ and the reason it can evolve schemas safely without IDLs.

### Protocol layout (high level)

```
| header | type info | reference meta | value data |
```

- **Header**: compact flags + language byte
- **Type info**: type IDs and packed TypeMeta when compatible mode is enabled
- **Reference meta**: flags and reference IDs for shared or circular objects
- **Value data**: the serialized payload

### Meta packing and sharing

Fory C++ packs type metadata into a compact binary TypeMeta format that includes:

- A size header and a hash of the metadata
- Encoded namespace and type name (meta string encoding)
- Field definitions (name + field type + options)

When a type appears multiple times in a stream, the first occurrence writes the TypeMeta inline and assigns it an index. Later occurrences only write the index. This removes repeated schema payloads while keeping compatibility intact.

### Meta string encoding and further compression

Type names and namespaces are encoded with specialized meta string encodings (for example, lower-case and symbol-aware encodings). This reduces metadata size significantly. The design also enables additional meta compression in higher-level pipelines because the metadata payload is compact, structured, and hash-addressable.

### Why this enables schema evolution

Compatible mode builds a field map from TypeMeta and matches by field ID when present, otherwise by name. When schemas diverge:

- Added fields are filled with default values
- Removed fields are skipped
- Reordered fields are resolved by ID or name
- Nullability changes are supported
- Field IDs, when provided, take precedence over names for matching

This works across languages because the same TypeMeta format is used in each implementation.

## Shared and circular references

Reference tracking is built into the protocol using reference flags and IDs. In C++ you enable it with `track_ref(true)` so shared pointers preserve identity and circular graphs can be round-tripped safely.

### Shared references (aliasing preserved)

```cpp
struct Product {
  std::string sku;
  double price;
};
FORY_STRUCT(Product, sku, price);

struct SharedPair {
  std::shared_ptr<Product> first;
  std::shared_ptr<Product> second;
};
FORY_STRUCT(SharedPair, first, second);

auto fory = Fory::builder().track_ref(true).build();
fory.register_struct<Product>(1);
fory.register_struct<SharedPair>(2);

auto shared = std::make_shared<Product>(Product{"A-100", 19.95});
SharedPair original{shared, shared};

auto bytes = fory.serialize(original).value();
auto decoded = fory.deserialize<SharedPair>(bytes).value();

// Both fields point to the same object after deserialization.
assert(decoded.first == decoded.second);
assert(decoded.first->sku == "A-100");
assert(decoded.first->price == 19.95);
```

### Circular references (parent/child graph)

Use `SharedWeak<T>` for non-owning back references so you can form cycles without memory leaks. Fory resolves these links during deserialization while keeping reference identity intact.

```cpp
struct Node {
  std::string name;
  SharedWeak<Node> parent;                      // Non-owning back reference
  std::vector<std::shared_ptr<Node>> children;  // Owning references
};
FORY_STRUCT(Node, name, parent, children);

auto fory = Fory::builder().track_ref(true).build();
fory.register_struct<Node>(2);

auto parent = std::make_shared<Node>();
parent->name = "root";

auto child = std::make_shared<Node>();
child->name = "leaf";
child->parent = SharedWeak<Node>::from(parent);
parent->children.push_back(child);

auto bytes = fory.serialize(parent).value();
auto decoded = fory.deserialize<std::shared_ptr<Node>>(bytes).value();

auto decoded_child = decoded->children[0];
auto decoded_parent = decoded_child->parent.upgrade();
assert(decoded_parent == decoded);
```

## Polymorphism and union support

### Polymorphism

Register derived types by name and serialize base-class pointers. The type info is written once and reused in the stream, so polymorphic dispatch works on deserialize.

```cpp
struct Animal {
  virtual ~Animal() = default;
  virtual std::string speak() const = 0;
  std::string name;
};
FORY_STRUCT(Animal, name);

struct Dog : Animal {
  std::string breed;
  std::string speak() const override { return "woof"; }
};
FORY_STRUCT(Dog, name, breed);

struct Cat : Animal {
  int32_t lives = 9;
  std::string speak() const override { return "meow"; }
};
FORY_STRUCT(Cat, name, lives);

struct Zoo {
  std::vector<std::shared_ptr<Animal>> animals;
};
FORY_STRUCT(Zoo, animals);

auto fory = Fory::builder().xlang(true).build();
fory.register_struct<Zoo>(300);
// Register concrete types by name for polymorphic dispatch
fory.register_struct<Dog>("example", "Dog");
fory.register_struct<Cat>("example", "Cat");

Zoo zoo;
zoo.animals.push_back(std::make_shared<Dog>(Dog{{"Rex"}, "Labrador"}));
zoo.animals.push_back(std::make_shared<Cat>(Cat{{"Mika"}, 7}));

auto bytes = fory.serialize(zoo).value();
auto decoded = fory.deserialize<Zoo>(bytes).value();

auto dog = std::dynamic_pointer_cast<Dog>(decoded.animals[0]);
auto cat = std::dynamic_pointer_cast<Cat>(decoded.animals[1]);
assert(dog && cat);
assert(dog->speak() == "woof");
assert(cat->speak() == "meow");
```

### Union types

Use `std::variant` for union-like fields. Fory records the active alternative and preserves it across languages that support union types.

```cpp
using Value = std::variant<int32_t, std::string, double>;

auto bytes = fory.serialize(Value{42}).value();
auto decoded = fory.deserialize<Value>(bytes).value();
```

## Automatic schema evolution in practice

```cpp
struct UserV1 {
  std::string name;
  int32_t age;
};
FORY_STRUCT(UserV1, name, age);

struct UserV2 {
  std::string name;
  int32_t age;
  std::string email; // New field
};
FORY_STRUCT(UserV2, name, age, email);

auto fory_v1 = Fory::builder().compatible(true).xlang(true).build();
auto fory_v2 = Fory::builder().compatible(true).xlang(true).build();

fory_v1.register_struct<UserV1>(100);
fory_v2.register_struct<UserV2>(100);
```

Compatible mode supports adding, removing, or reordering fields and changing nullability. If you assign field IDs (via `fory::field<>`, `FORY_FIELD_TAGS`, or `FORY_FIELD_CONFIG`), those IDs become the primary match key. Type changes are not allowed.

## Compile-time performance and runtime efficiency

Fory C++ is designed for throughput and low latency:

- Template specializations for primitives, containers, and smart pointers
- Direct buffer writes with minimal checks on the fast path
- Reference tracking only when enabled
- Reusable buffers through `serialize_to(...)`
- Context pooling via `ThreadSafeFory`

This is why performance scales predictably as data sizes grow.

## Benchmark results (C++ vs Protobuf)

Apache Fory includes a dedicated C++ benchmark suite under `benchmarks/cpp_benchmark`. The current report compares Fory to Protocol Buffers using the same data structures.

**Hardware (from the benchmark report):**

- OS: Darwin 24.5.0
- Machine: arm64
- CPU: 12 cores
- RAM: 48 GB

**Throughput results (ops/sec):**

<img src="/img/benchmarks/cpp/throughput.png" width="90%"/>

| Datatype     | Operation   | Fory TPS   | Protobuf TPS | Faster      |
| ------------ | ----------- | ---------- | ------------ | ----------- |
| Mediacontent | Serialize   | 2,430,924  | 484,368      | Fory (5.0x) |
| Mediacontent | Deserialize | 740,074    | 387,522      | Fory (1.9x) |
| Sample       | Serialize   | 4,813,270  | 3,021,968    | Fory (1.6x) |
| Sample       | Deserialize | 915,554    | 684,675      | Fory (1.3x) |
| Struct       | Serialize   | 18,105,957 | 5,788,186    | Fory (3.1x) |
| Struct       | Deserialize | 7,495,726  | 5,932,982    | Fory (1.3x) |

To run the benchmark locally:

```bash
cd benchmarks/cpp_benchmark
./run.sh
```

## Getting started in 5 minutes

### Install by CMake

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_project LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(MSVC)
  add_compile_options(/Zc:preprocessor)
endif()

include(FetchContent)
FetchContent_Declare(
  fory
  GIT_REPOSITORY https://github.com/apache/fory.git
  GIT_TAG        v0.15.0
  SOURCE_SUBDIR  cpp
)
FetchContent_MakeAvailable(fory)

add_executable(my_app main.cc)
target_link_libraries(my_app PRIVATE fory::serialization)
```

For Bazel installation, see https://fory.apache.org/docs/guide/cpp/#using-bazel.

### Basic object serialization

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

struct Person {
  std::string name;
  int32_t age;
  std::vector<std::string> hobbies;

  bool operator==(const Person &other) const {
    return name == other.name && age == other.age && hobbies == other.hobbies;
  }
};
FORY_STRUCT(Person, name, age, hobbies);

int main() {
  auto fory = Fory::builder().xlang(true).track_ref(false).build();
  fory.register_struct<Person>(1);

  Person person{"Alice", 30, {"reading", "coding"}};

  auto bytes = fory.serialize(person).value();
  auto decoded = fory.deserialize<Person>(bytes).value();

  return decoded == person ? 0 : 1;
}
```

### Why `FORY_STRUCT` matters

Fory needs a consistent field order across languages to keep schemas compatible. `FORY_STRUCT` captures field names at compile time so Fory can build a stable order (by snake_case field name) instead of relying on compiler-specific declaration order.

In C++20 we can unpack struct fields with tuple-like helpers, but that still serializes fields in declared order only. That order may not match other languages, and in languages like Java we cannot reliably obtain declared field order at all. Using `FORY_STRUCT` ensures a deterministic, cross-language field layout and enables schema evolution to work as designed. If we provide field IDs, Fory matches by ID instead of name, which is even more stable across languages.

### Type registration

Fory requires explicit registration for structs and enums. You can register by numeric ID or by name (namespace + type name) for named type systems.

Why explicit registration matters:

- Concrete type mapping across languages: custom types need a stable, shared identity (ID or name) so C++, Java, and Rust agree on the same schema.
- Automatic polymorphic deserialization: registering concrete types enables downcasting when deserializing `shared_ptr<Base>` or other polymorphic containers.

```cpp
enum class Color { Red, Green, Blue };
FORY_ENUM(Color, Red, Green, Blue);

auto fory = Fory::builder().xlang(true).build();
fory.register_struct<Person>(1);
fory.register_enum<Color>(2);
fory.register_struct<Person>("example", "Person");

auto bytes_result = fory.serialize(person);
if (!bytes_result.ok()) {
  std::cerr << bytes_result.error().to_string() << std::endl;
}
```

### Error handling

All serialization APIs return `Result<T, Error>`. Check `ok()` before using the value and use `error().to_string()` for diagnostic output.

```cpp
auto result = fory.deserialize<Person>(bytes);
if (!result.ok()) {
  std::cerr << result.error().to_string() << std::endl;
  return;
}
Person value = std::move(result).value();
```

Common error kinds:

- `Error::type_mismatch` - type ID mismatch during deserialization
- `Error::invalid_data` - invalid or corrupted input data
- `Error::buffer_out_of_bound` - buffer overflow or underflow
- `Error::type_error` - type registration or resolution failure

For the fastest path, reuse buffers with `serialize_to(...)`:

```cpp
fory::Buffer buffer;
auto write_result = fory.serialize_to(buffer, person);
```

### Thread-safe variant

```cpp
auto fory = Fory::builder().xlang(true).build_thread_safe();
// Register types before spawning threads.
```

## Advanced controls for real systems

### Field metadata and schema control

Use `fory::field<>` for inline metadata or `FORY_FIELD_TAGS` and `FORY_FIELD_CONFIG` for non-invasive configuration.

```cpp
struct Document {
  std::string title;
  std::shared_ptr<Document> parent;
};
FORY_STRUCT(Document, title, parent);

FORY_FIELD_TAGS(Document,
  (title, 0),
  (parent, 1, nullable, ref)
);
```

If field IDs are defined, compatible mode uses them as the primary key for matching across versions and languages.

### Custom serializers

When you cannot use `FORY_STRUCT`, specialize the `Serializer<T>` template and register the type as an extension.

```cpp
struct ExternalType { int32_t value; };

namespace fory {
namespace serialization {

template <> struct Serializer<ExternalType> {
  static constexpr TypeId type_id = TypeId::EXT;
  static void write_data(const ExternalType &value, WriteContext &ctx) {
    Serializer<int32_t>::write_data(value.value, ctx);
  }
  static ExternalType read_data(ReadContext &ctx) {
    ExternalType out;
    out.value = Serializer<int32_t>::read_data(ctx);
    return out;
  }
};

} // namespace serialization
} // namespace fory
```

```cpp
auto fory = Fory::builder().build();
fory.register_extension_type<ExternalType>(200);
```

### Native mode for unsigned types

Unsigned integer types are supported in native mode (`xlang(false)`), where C++-specific type IDs are used.

## Supported types at a glance

- Primitives, strings, and byte arrays
- `std::vector`, `std::set`, `std::map`, `std::unordered_*`
- `std::optional`, `std::variant`, `std::tuple`, `std::array`
- `std::shared_ptr`, `std::unique_ptr`, and `SharedWeak<T>`
- Temporal types such as `std::chrono::nanoseconds`

## When to use Apache Fory C++

### Great fit

- High-throughput pipelines and RPC payloads
- Polyglot microservices that need a shared binary protocol
- Complex object graphs with references or cycles
- Systems that need schema evolution without downtime

### Consider alternatives

- Human-readable storage or debugging formats (JSON or YAML)
- Long-term archival storage (Parquet or Arrow files)

## Next steps

- Read the C++ guide: https://fory.apache.org/docs/guide/cpp/
- Explore examples: https://github.com/apache/fory/tree/main/examples/cpp
- Run the C++ benchmark: `benchmarks/cpp_benchmark/run.sh`

Apache Fory C++ is ready for production systems. If you care about performance, cross-language interoperability, and schema evolution without IDLs, give it a try and let us know what you build.
