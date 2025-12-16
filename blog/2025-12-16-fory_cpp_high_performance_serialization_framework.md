---
slug: fory_cpp_high_performance_serialization_framework
title: "Introducing Apache Fory™ C++: High-Performance Serialization for Modern C++"
authors: [chaokunyang]
tags: [fory, c++]
---

**TL;DR**: Apache Fory C++ is a high-performance, cross-language serialization framework that delivers **up to 5x faster serialization than Protobuf** while providing **automatic cross-language interoperability, flexible schema evolution, and compile-time type safety**. Built with C++17 and template metaprogramming, it eliminates the need for IDL files and code generators while maintaining zero runtime overhead.

- 🐙 GitHub: https://github.com/apache/fory
- 📦 Installation: CMake (FetchContent) or Bazel

![Apache Fory Logo](https://fory.apache.org/img/navbar-logo.png)

---

## The Serialization Challenge in C++

C++ developers face unique serialization challenges that other languages don't encounter:

1. **No built-in reflection**: Unlike Java or Python, C++ has no runtime type information for serialization
2. **Performance expectations**: C++ is chosen for performance-critical applications where serialization overhead matters
3. **Cross-language requirements**: Modern microservices architectures require seamless communication across language boundaries
4. **Schema evolution pain**: Production systems need to evolve without coordinated deployments

Existing solutions force trade-offs:

| Solution            | Performance              | Cross-Language   | Schema Evolution               | Ease of Use               |
| ------------------- | ------------------------ | ---------------- | ------------------------------ | ------------------------- |
| Protobuf            | Fast                     | ✅ Excellent     | ✅ Good (requires field IDs)   | ⚠️ Medium (IDL + codegen) |
| FlatBuffers         | 🚀 Very Fast (zero-copy) | ✅ Good          | ⚠️ Good (stricter rules)       | ❌ Hard (complex API)     |
| Boost.Serialization | ⚠️ Slow/Medium           | ❌ C++ only      | ❌ Poor (manual versioning)    | ✅ Easy                   |
| cereal              | Fast                     | ❌ C++ only      | ❌ Poor (manual versioning)    | ✅ Very Easy              |
| **Apache Fory**     | 🚀 **Very Fast**         | ✅ **Excellent** | ✅ **Flexible (no field IDs)** | ✅ **Easy (no IDL)**      |

Apache Fory C++ offers a unique combination: **cross-language support without IDL files**, **flexible schema evolution without field IDs**, and **top-tier performance**. It's a serialization framework that delivers exceptional performance while automatically handling cross-language communication and flexible schema evolution—no IDL files, no code generators, no field IDs, no compromises.

## What Makes Apache Fory C++ Different?

### 1. **Automatic Cross-Language Serialization**

Apache Fory C++ speaks the same binary protocol as Java, Python, Go, Rust, and JavaScript. Serialize in C++, deserialize in any supported language—**automatically**. No schema files. No code generation. No version coordination.

```cpp
// C++: Serialize
#include "fory/serialization/fory.h"

using namespace fory::serialization;

struct Order {
  int64_t order_id;
  std::string customer;
  std::vector<std::string> items;
  double total;
};
FORY_STRUCT(Order, order_id, customer, items, total);

int main() {
  auto fory = Fory::builder().xlang(true).build();
  fory.register_struct<Order>(100);

  Order order{12345, "Alice", {"laptop", "mouse"}, 1299.99};
  auto bytes = fory.serialize(order).value();

  // Send bytes to Python, Java, Go... it just works!
}
```

```python
# Python: Deserialize (same binary format!)
import pyfory

class Order:
    order_id: int
    customer: str
    items: list[str]
    total: float

fory = pyfory.Fory()
fory.register(Order, type_id=100)  # Same ID as C++

order = fory.deserialize(bytes)
print(f"Order {order.order_id}: ${order.total}")  # Order 12345: $1299.99
```

This isn't just convenient—it fundamentally changes how polyglot microservices architectures communicate.

### 2. **Flexible Schema Evolution Without Limitations**

This is where Apache Fory truly shines. Unlike other serialization frameworks, Fory's Compatible mode allows **any schema change without restrictions**:

**Other frameworks require:**

- ❌ **Protobuf**: Mandatory field IDs (`int32 age = 1;`), can never reuse IDs
- ❌ **FlatBuffers**: Fixed field order, append-only schema changes
- ❌ **Thrift**: Field IDs and careful deprecation management
- ❌ **Cap'n Proto**: Fixed field positions, complex evolution rules

**Apache Fory allows:**

- ✅ Add any new fields—no field IDs needed
- ✅ Remove any fields—no deprecated markers
- ✅ Reorder fields freely—matched by name, not position
- ✅ Change nullability (`T` ↔ `std::optional<T>`)
- ✅ Evolve nested structs independently

```cpp
// Service A: Version 1
struct UserV1 {
  std::string name;
  int32_t age;
  std::string address;
};
FORY_STRUCT(UserV1, name, age, address);

// Service B: Version 2 (evolved independently)
struct UserV2 {
  std::string name;
  int32_t age;
  // address removed - no problem!
  std::optional<std::string> phone;     // New field - no field ID needed!
  std::map<std::string, std::string> metadata;  // Another new field
};
FORY_STRUCT(UserV2, name, age, phone, metadata);

// Enable compatible mode
auto fory_v1 = Fory::builder().compatible(true).xlang(true).build();
auto fory_v2 = Fory::builder().compatible(true).xlang(true).build();

fory_v1.register_struct<UserV1>(1);
fory_v2.register_struct<UserV2>(1);  // Same type ID

// V1 data deserializes into V2 structure seamlessly
auto v1_bytes = fory_v1.serialize(user_v1).value();
auto user_v2 = fory_v2.deserialize<UserV2>(v1_bytes).value();
// phone = std::nullopt, metadata = {} (default values)
```

This flexibility enables **zero-downtime deployments** where services can upgrade independently without coordination.

### 3. **Compile-Time Type Safety with Zero Overhead**

Unlike reflection-based frameworks, Apache Fory generates serialization code at compile time via the `FORY_STRUCT` macro:

```cpp
struct Person {
  std::string name;
  int32_t age;
  std::vector<std::string> hobbies;
};

// This macro generates efficient serialization code at compile time
FORY_STRUCT(Person, name, age, hobbies);
```

**What the macro generates:**

- Compile-time field metadata via template specialization
- ADL (Argument-Dependent Lookup) enabled serialization functions
- Efficient binary encoding with no virtual calls on hot paths

**Benefits:**

- ⚡ **Zero runtime overhead**: No reflection, no type erasure
- 🛡️ **Type safety**: Compile-time errors instead of runtime crashes
- 📦 **Minimal binary size**: Only code for types you use
- 🔍 **IDE support**: Full autocomplete and error checking

### 4. **Reference Tracking for Complex Object Graphs**

Apache Fory automatically tracks shared objects and handles circular references:

```cpp
struct Department {
  std::string name;
  std::vector<std::shared_ptr<Employee>> employees;
};
FORY_STRUCT(Department, name, employees);

struct Employee {
  std::string name;
  std::shared_ptr<Department> department;  // Back reference
};
FORY_STRUCT(Employee, name, department);

// Enable reference tracking
auto fory = Fory::builder()
    .xlang(true)
    .track_ref(true)  // Enable reference tracking
    .build();

// Shared objects serialized once, references preserved
auto dept = std::make_shared<Department>();
dept->name = "Engineering";

auto emp1 = std::make_shared<Employee>();
emp1->name = "Alice";
emp1->department = dept;

auto emp2 = std::make_shared<Employee>();
emp2->name = "Bob";
emp2->department = dept;  // Same department

dept->employees = {emp1, emp2};

auto bytes = fory.serialize(dept).value();
auto decoded = fory.deserialize<std::shared_ptr<Department>>(bytes).value();

// Reference identity preserved!
assert(decoded->employees[0]->department.get() == decoded.get());
assert(decoded->employees[1]->department.get() == decoded.get());
```

### 5. **Type-Safe Unions with std::variant**

Apache Fory C++ supports `std::variant` for type-safe union serialization—a feature unique to the C++ implementation:

```cpp
// Define a variant type for polymorphic messages
using Message = std::variant<
    TextMessage,
    ImageMessage,
    VideoMessage,
    std::monostate  // Represents "no message"
>;

struct TextMessage {
  std::string content;
  int64_t timestamp;
};
FORY_STRUCT(TextMessage, content, timestamp);

struct ImageMessage {
  std::string url;
  int32_t width;
  int32_t height;
};
FORY_STRUCT(ImageMessage, url, width, height);

struct VideoMessage {
  std::string url;
  int32_t duration_seconds;
};
FORY_STRUCT(VideoMessage, url, duration_seconds);

// Serialize variant
Message msg = TextMessage{"Hello, World!", 1699999999};
auto bytes = fory.serialize(msg).value();

// Deserialize and pattern match
auto decoded = fory.deserialize<Message>(bytes).value();
std::visit([](auto&& arg) {
    using T = std::decay_t<decltype(arg)>;
    if constexpr (std::is_same_v<T, TextMessage>) {
        std::cout << "Text: " << arg.content << std::endl;
    } else if constexpr (std::is_same_v<T, ImageMessage>) {
        std::cout << "Image: " << arg.url << std::endl;
    }
    // ...
}, decoded);
```

### 6. **Zero-Copy Row Format for Analytics**

For analytics workloads requiring random field access, Apache Fory provides a row-based format:

```cpp
#include "fory/encoder/row_encoder.h"

using namespace fory::row;
using namespace fory::row::encoder;

struct LogEntry {
  int64_t timestamp;
  std::string level;
  std::string message;
  std::map<std::string, std::string> context;
};
FORY_FIELD_INFO(LogEntry, timestamp, level, message, context);

// Create encoder
RowEncoder<LogEntry> encoder;

LogEntry entry{1699999999000, "ERROR", "Connection failed", {{"host", "db.example.com"}}};
encoder.Encode(entry);

// Get row with random access
auto row = encoder.GetWriter().ToRow();

// Access any field without deserializing the entire object
int64_t ts = row->GetInt64(0);      // Direct access to timestamp
std::string level = row->GetString(1);  // Direct access to level
// Skip message and context if not needed!
```

**Row format benefits:**

- **Random access**: Read any field without full deserialization
- **Zero-copy**: Direct memory access
- **Cache-friendly**: Contiguous memory layout
- **Columnar conversion**: Easy integration with analytics engines

## The Technical Foundation

### Protocol Design

Apache Fory uses a sophisticated binary protocol designed for both performance and flexibility:

```
| fory header | reference meta | type meta | value data |
```

**Key innovations:**

1. **Efficient encoding**: Variable-length integers, compact type IDs
2. **Reference tracking**: Shared objects serialized once
3. **Meta compression**: Type metadata compression in compatible mode
4. **Little-endian layout**: Optimized for modern CPU architectures

### Compile-Time Code Generation

The `FORY_STRUCT` macro leverages C++ template metaprogramming:

```cpp
// User writes:
FORY_STRUCT(Person, name, age, hobbies);

// Macro generates template specializations that enable:
// - ADL-based serializer dispatch
// - Compile-time field iteration
// - Efficient buffer pre-allocation
// - Type hash computation for validation
```

**This approach provides:**

- No runtime type registration cost
- Compiler optimizations (inlining, dead code elimination)
- Clear error messages at compile time

## Benchmarks: Real-World Performance

<img src="/img/benchmarks/cpp/throughput_comparison.png" width="90%"/>

Apache Fory C++ consistently outperforms Protobuf across different data structures:

| Datatype     | Operation   | Fory (ns) | Protobuf (ns) | Speedup         |
| ------------ | ----------- | --------- | ------------- | --------------- |
| MediaContent | Serialize   | 414       | 2,046         | **4.9x faster** |
| MediaContent | Deserialize | 1,361     | 2,890         | **2.1x faster** |
| Sample       | Serialize   | 210       | 307           | **1.5x faster** |
| Sample       | Deserialize | 1,061     | 1,500         | **1.4x faster** |
| Struct       | Serialize   | 51        | 181           | **3.5x faster** |
| Struct       | Deserialize | 136       | 170           | **1.3x faster** |

_Lower is better. Results depend on hardware and data characteristics. See [C++ benchmark guide](https://github.com/apache/fory/tree/main/benchmarks/cpp_benchmark) for methodology._

## When to Use Apache Fory C++

### ✅ **Ideal Use Cases**

1. **Cross-language microservices**
   - Different services in different languages
   - Need seamless data exchange without IDL management
   - Independent schema evolution across teams

2. **High-performance systems**
   - Game engines with network serialization
   - Real-time trading systems
   - Low-latency messaging infrastructure

3. **Analytics pipelines**
   - Row format for selective field access
   - Integration with columnar storage
   - High-throughput data processing

4. **Complex domain models**
   - Shared references and object graphs
   - Polymorphic types with `std::variant`
   - Nested structures with independent evolution

### ⚠️ **Consider Alternatives If**

1. **Human-readable format needed**: Use JSON for debugging or configuration
2. **Deeply invested in Protobuf ecosystem**: Migration cost may outweigh benefits
3. **Single-language, trivial data**: Simpler solutions may suffice

## Getting Started in 5 Minutes

### Installation with CMake (Recommended)

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_project LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
    fory
    GIT_REPOSITORY https://github.com/apache/fory.git
    GIT_TAG        v0.14.0
    SOURCE_SUBDIR  cpp
)
FetchContent_MakeAvailable(fory)

add_executable(my_app main.cc)
target_link_libraries(my_app PRIVATE fory::serialization)
```

```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --parallel
./my_app
```

### Installation with Bazel

```bazel
# MODULE.bazel
module(name = "my_project", version = "1.0.0")

bazel_dep(name = "rules_cc", version = "0.1.1")
bazel_dep(name = "fory", version = "0.14.0")
git_override(
    module_name = "fory",
    remote = "https://github.com/apache/fory.git",
    commit = "v0.14.0",
)
```

```bazel
# BUILD
cc_binary(
    name = "my_app",
    srcs = ["main.cc"],
    deps = ["@fory//cpp/fory/serialization:fory_serialization"],
)
```

### Complete Example

```cpp
#include "fory/serialization/fory.h"
#include <iostream>

using namespace fory::serialization;

struct Person {
  std::string name;
  int32_t age;
  std::vector<std::string> hobbies;

  bool operator==(const Person& other) const {
    return name == other.name && age == other.age && hobbies == other.hobbies;
  }
};
FORY_STRUCT(Person, name, age, hobbies);

int main() {
  // Create Fory instance
  auto fory = Fory::builder()
      .xlang(true)       // Enable cross-language mode
      .track_ref(false)  // Disable ref tracking for simple types
      .build();

  // Register type with unique ID
  fory.register_struct<Person>(1);

  // Create and serialize
  Person alice{"Alice", 30, {"reading", "coding", "hiking"}};
  auto result = fory.serialize(alice);

  if (!result.ok()) {
    std::cerr << "Serialization failed: " << result.error().to_string() << std::endl;
    return 1;
  }

  auto bytes = std::move(result).value();
  std::cout << "Serialized size: " << bytes.size() << " bytes" << std::endl;

  // Deserialize
  auto decoded = fory.deserialize<Person>(bytes);
  if (!decoded.ok()) {
    std::cerr << "Deserialization failed: " << decoded.error().to_string() << std::endl;
    return 1;
  }

  assert(alice == decoded.value());
  std::cout << "Round-trip successful!" << std::endl;

  return 0;
}
```

## Supported Types

Apache Fory C++ supports a comprehensive type system:

**Primitives**: `bool`, `int8_t`, `int16_t`, `int32_t`, `int64_t`, `uint8_t`, `uint16_t`, `uint32_t`, `uint64_t`, `float`, `double`

**Strings**: `std::string`, `std::string_view`

**Collections**: `std::vector<T>`, `std::set<T>`, `std::unordered_set<T>`, `std::map<K,V>`, `std::unordered_map<K,V>`

**Smart Pointers**: `std::optional<T>`, `std::shared_ptr<T>`, `std::unique_ptr<T>`

**Unions**: `std::variant<Ts...>`, `std::monostate`

**Temporal**: `std::chrono::nanoseconds`, `Timestamp`, `LocalDate`

**Enums**: Scoped (`enum class`) and unscoped enums with `FORY_ENUM` macro

**Custom Types**: Any struct registered with `FORY_STRUCT`

## Roadmap

### ✅ **Shipped in v0.14.0**

- ✅ High-performance object graph serialization
- ✅ Cross-language serialization (Java, Python, Go, Rust, JavaScript)
- ✅ Schema evolution with Compatible mode
- ✅ Reference tracking for shared objects
- ✅ `std::variant` type-safe union serialization
- ✅ Zero-copy row format for analytics
- ✅ Thread-safe and single-threaded variants
- ✅ CMake (FetchContent) and Bazel build support
- ✅ Comprehensive type support (primitives, collections, smart pointers, temporals)

### 🚧 **In Development**

- [ ] **Circular reference support**: Full cycle detection and preservation for complex object graphs
- [ ] **Cross-language shared/circular reference**: Serialize shared and circular references across language boundaries (C++ ↔ Java ↔ Python)

### 🎯 **Help Wanted**

We're actively seeking contributors for:

- **Performance optimization**: Profile and optimize hot paths
- **Documentation**: More examples, tutorials, and guides
- **Testing**: Fuzzing, property tests, edge case coverage
- **Platform support**: Additional compiler/platform testing

## Production Considerations

### Thread Safety

Apache Fory C++ provides two variants:

```cpp
// Single-threaded (fastest) - NOT thread-safe
auto fory = Fory::builder().xlang(true).build();

// Thread-safe - uses context pools
auto fory = Fory::builder().xlang(true).build_thread_safe();
```

**Best practice**: Register all types before spawning threads:

```cpp
auto fory = Fory::builder().xlang(true).build_thread_safe();

// Register all types first
fory.register_struct<TypeA>(1);
fory.register_struct<TypeB>(2);

// Now safe to use from multiple threads
std::vector<std::thread> workers;
for (int i = 0; i < num_threads; i++) {
  workers.emplace_back([&fory]() {
    auto result = fory.serialize(my_data);
    // ...
  });
}
```

### Error Handling

Apache Fory uses a `Result<T, Error>` pattern inspired by Rust:

```cpp
auto result = fory.deserialize<Person>(bytes);

if (result.ok()) {
  Person person = std::move(result).value();
  // Use person...
} else {
  Error error = result.error();
  std::cerr << "Error: " << error.to_string() << std::endl;
}

// Or use FORY_TRY macro for early return
FORY_TRY(person, fory.deserialize<Person>(bytes));
// Use person directly...
```

### Performance Tips

1. **Reuse buffers**: Use `serialize_to(buffer, obj)` with pre-allocated buffers
2. **Disable reference tracking**: Use `track_ref(false)` for simple types without sharing
3. **Single-threaded mode**: Use `build()` instead of `build_thread_safe()` when possible
4. **Pre-register types**: Register all types at startup, not during serialization

## Documentation

- Apache Fory C++ Guide: [📖 View](https://fory.apache.org/docs/guide/cpp/)
- Apache Fory Xlang Serialization Spec: [📖 View](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec/)
- Examples: [hello_world](https://github.com/apache/fory/tree/main/examples/cpp/hello_world), [hello_row](https://github.com/apache/fory/tree/main/examples/cpp/hello_row)

## Community and Contribution

Apache Fory is an **Apache Software Foundation** project with a vibrant, growing community:

- **GitHub**: [apache/fory](https://github.com/apache/fory)
- **Docs**: [fory.apache.org](https://fory.apache.org)
- **Slack**: [Join our community](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)
- **Issue Tracker**: [GitHub Issues](https://github.com/apache/fory/issues)

### How to Contribute

We welcome contributions of all kinds:

1. **Code**: Implement features from the roadmap
2. **Docs**: Write tutorials, examples, and guides
3. **Testing**: Add benchmarks, fuzz tests, integration tests
4. **Feedback**: Report bugs, request features, share use cases

See [CONTRIBUTING.md](https://github.com/apache/fory/blob/main/CONTRIBUTING.md) for guidelines.

### License

Apache Fory is licensed under the **Apache License 2.0**, a permissive open-source license that allows commercial use, modification, and distribution.

## Conclusion

Apache Fory C++ represents a new approach to serialization in C++:

- **No more IDL files**: Define types naturally in C++, serialize everywhere
- **No more field IDs**: Evolve schemas freely without coordination
- **No more performance trade-offs**: Get cross-language support AND speed
- **No more complexity**: Simple macro-based API with compile-time safety

Whether you're building microservices, game engines, or data pipelines, Apache Fory C++ delivers the performance you need with the flexibility you deserve.

**Try it today**:

```bash
# Clone and build examples
git clone https://github.com/apache/fory.git
cd fory/examples/cpp/hello_world
mkdir build && cd build
cmake .. && cmake --build .
./hello_world
```

**Join the community**:

- Star us on [GitHub](https://github.com/apache/fory)
- Join [Slack](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A) for discussions
- Share your use case and feedback!
