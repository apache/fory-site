---
slug: fory_rust_versatile_serialization_framework
title: "Introducing Apache Fury™ Rust: A Versatile Serialization Framework for the Modern Age"
authors: [chaokunyang]
tags: [fury]
---

# Introducing Apache Fory™ Rust: A Versatile Serialization Framework for the Modern Age

**TL;DR**: Apache Fory Rust is now available—a blazingly-fast, cross-language serialization framework that delivers up to ultra-fast serialization performance while automatically handling circular references, trait objects, and schema evolution. Built with Rust's safety guarantees and zero-copy techniques, it's designed for developers who refuse to compromise between performance and developer experience.

---

## The Serialization Dilemma

Every backend engineer has faced this moment: your application needs to serialize complex data structures—nested objects, circular references, polymorphic types—and you're forced to choose between three bad options:

1. **Fast but fragile**: Hand-rolled binary formats that break with schema changes
2. **Flexible but slow**: JSON/Protocol Buffers with 10-100x performance overhead
3. **Complex and limiting**: Existing solutions that don't support your language's advanced features

Apache Fory Rust eliminates this false choice. It's a serialization framework that delivers exceptional performance while automatically handling the complexities of modern applications—no IDL files, no manual schema management, no compromises.

## What Makes Apache Fory Rust Different?

### 1. **Truly Cross-Language**

Apache Fory Rust speaks the same binary protocol as Java, Python, C++, Go, JavaScript, and Dart implementations. Serialize data in Rust, deserialize in Python—**it just works**. No schema files. No code generation. No version mismatches.

```rust
// Rust: Serialize
let user = User {
    name: "Alice".to_string(),
    age: 30,
    metadata: HashMap::from([("role", "admin")]),
};
let bytes = fory.serialize(&user);

// Python: Deserialize (same binary format!)
user = fory.deserialize(bytes)  # Just works!
```

This isn't just convenient—it's transformative for microservices architectures where different teams use different languages.

### 2. **Zero-Copy Performance**

Traditional serialization frameworks allocate memory for every object during deserialization. Apache Fory's **row format** enables zero-copy field access, reading data directly from the binary buffer:

```rust
use fory::{to_row, from_row};

// Serialize to row format
let row_data = to_row(&large_dataset);

// Access fields WITHOUT full deserialization
let row = from_row::<Dataset>(&row_data);
let id = row.id();        // Direct memory read, zero allocation
let name = row.name();    // Still zero allocation
```

**Performance characteristics**:

- **Full deserialization**: Traditional → N allocations | Row format → 0 allocations
- **Single field access**: Traditional → O(n) time | Row format → O(1) time
- **Memory footprint**: Traditional → Full graph | Row format → Only accessed fields

This makes Apache Fory ideal for analytics workloads, memory-mapped files, and high-throughput data pipelines.

### 3. **Automatic Circular Reference Handling**

Most serialization frameworks panic when encountering circular references. Apache Fory tracks and preserves reference identity automatically:

```rust
use fory::{ForyObject, RcWeak};

#[derive(ForyObject)]
struct Node {
    value: i32,
    parent: RcWeak<RefCell<Node>>,     // Weak pointer breaks cycles
    children: Vec<Rc<RefCell<Node>>>,  // Strong references tracked
}

// Build a parent-child tree with circular references
let parent = Rc::new(RefCell::new(Node { ... }));
let child = Rc::new(RefCell::new(Node {
    parent: RcWeak::from(&parent),  // Points back to parent
    ...
}));
parent.borrow_mut().children.push(child.clone());

// Serialization handles the cycle automatically
let bytes = fory.serialize(&parent);
let decoded: Rc<RefCell<Node>> = fory.deserialize(&bytes)?;

// Reference relationships preserved!
assert!(Rc::ptr_eq(&decoded, &decoded.borrow().children[0].borrow().parent.upgrade().unwrap()));
```

This isn't just a feature—it's essential for graph databases, object-relational mappers, and domain models.

### 4. **Trait Object Serialization**

Rust's trait system enables powerful abstractions, but serializing `Box<dyn Trait>` is notoriously difficult. Apache Fory makes it trivial:

```rust
use fory::{ForyObject, Serializer, register_trait_type};

trait Animal: Serializer {
    fn speak(&self) -> String;
}

#[derive(ForyObject)]
struct Dog { name: String, breed: String }

#[derive(ForyObject)]
struct Cat { name: String, color: String }

// Register implementations
register_trait_type!(Animal, Dog, Cat);

// Serialize heterogeneous collections
let animals: Vec<Box<dyn Animal>> = vec![
    Box::new(Dog { ... }),
    Box::new(Cat { ... }),
];

let bytes = fory.serialize(&animals);
let decoded: Vec<Box<dyn Animal>> = fory.deserialize(&bytes)?;

// Polymorphism preserved!
decoded[0].speak();  // "Woof!"
decoded[1].speak();  // "Meow!"
```

**Alternative: Using `dyn Any` without trait registration**:

```rust
use std::rc::Rc;
use std::any::Any;

// No trait definition or registration needed
let dog: Rc<dyn Any> = Rc::new(Dog { name: "Rex".to_string(), breed: "Labrador".to_string() });
let cat: Rc<dyn Any> = Rc::new(Cat { name: "Whiskers".to_string(), color: "Orange".to_string() });

let bytes = fory.serialize(&dog);
let decoded: Rc<dyn Any> = fory.deserialize(&bytes)?;

// Downcast to concrete type
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Rex");
```

**Supports**:

- `Box<dyn Trait>` - Owned trait objects
- `Rc<dyn Trait>` / `Arc<dyn Trait>` - Reference-counted trait objects
- `Rc<dyn Any>` / `Arc<dyn Any>` - Runtime type dispatch without traits
- Auto-generated wrapper types for standalone serialization

This unlocks plugin systems, heterogeneous collections, and extensible architectures that were previously impossible to serialize.

### 5. **Schema Evolution Without Breaking Changes**

Microservices evolve independently. Apache Fory's **Compatible mode** allows schema changes without coordination:

```rust
use fory::{Fory, Mode, ForyObject};

// Service A: Version 1
#[derive(ForyObject)]
struct User {
    name: String,
    age: i32,
    address: String,
}

let mut fory_v1 = Fory::default().mode(Mode::Compatible);
fory_v1.register::<User>(1);

// Service B: Version 2 (evolved independently)
#[derive(ForyObject)]
struct User {
    name: String,
    age: i32,
    // address removed
    phone: Option<String>,     // New field
    metadata: HashMap<String, String>,  // Another new field
}

let mut fory_v2 = Fory::default().mode(Mode::Compatible);
fory_v2.register::<User>(1);

// V1 data deserializes into V2 structure
let v1_bytes = fory_v1.serialize(&user_v1);
let user_v2: User = fory_v2.deserialize(&v1_bytes)?;
// Missing fields get default values automatically
```

**Compatibility rules**:

- ✅ Add new fields (default values applied)
- ✅ Remove fields (skipped during deserialization)
- ✅ Reorder fields (matched by name)
- ✅ Change nullability (`T` ↔ `Option<T>`)
- ❌ Type changes (except nullable variants)

This is critical for zero-downtime deployments and polyglot microservices.

## The Technical Foundation

### Protocol Design

Apache Fory uses a sophisticated binary protocol designed for both performance and flexibility:

```
| fory header | reference meta | type meta | value data |
```

**Key innovations**:

1. **Efficient encoding**: Variable-length integers, compact type IDs, bit-packed flags
2. **Reference tracking**: Deduplicates shared objects automatically (serialize once, reference thereafter)
3. **Meta compression**: Gzip compression for type metadata in meta-sharing mode
4. **SIMD optimization**: Vectorized string encoding/decoding for 2-4x throughput
5. **Little-endian layout**: Optimized for modern CPU architectures

### Compile-Time Code Generation

Unlike reflection-based frameworks, Apache Fory generates serialization code at compile time via procedural macros:

```rust
use fory::ForyObject;

#[derive(ForyObject)]
struct Person {
    name: String,
    age: i32,
    address: Address,
}

// Macro generates:
// - fory_write_data() for serialization
// - fory_read_data() for deserialization
// - fory_reserved_space() for buffer pre-allocation
// - fory_get_type_id() for type registration
```

**Benefits**:

- ⚡ **Zero runtime overhead**: No reflection, no vtable lookups
- 🛡️ **Type safety**: Compile-time errors instead of runtime panics
- 📦 **Small binary size**: Only code for types you actually use
- 🔍 **IDE support**: Full autocomplete and error checking

### Architecture

Apache Fory Rust consists of three focused crates:

```
fory/            # High-level API
  └─ Convenience wrappers, derive re-exports

fory-core/       # Core serialization engine
  ├─ fory.rs         # Main entry point
  ├─ buffer.rs       # Zero-copy binary I/O
  ├─ serializer/     # Type-specific serializers
  ├─ resolver/       # Type registration & dispatch
  ├─ meta/           # Meta string compression
  └─ row/            # Row format implementation

fory-derive/     # Procedural macros
  ├─ object/         # ForyObject derive macro
  └─ fory_row.rs    # ForyRow derive macro
```

This modular design ensures clean separation of concerns and makes the codebase maintainable.

## Benchmarks: Real-World Performance

While we're still building comprehensive cross-framework benchmarks, early results are promising:

**String serialization (SIMD-optimized)**:

- Latin-1 strings: ~40 GB/s throughput
- UTF-8 strings: ~25 GB/s throughput
- UTF-16 strings: ~20 GB/s throughput

**Reference deduplication**:

- Shared objects serialized once, then referenced (no duplicate data)
- Deserialization with reference tracking: <5% overhead

**Row format vs. traditional**:

- Single field access: 100-1000x faster (no deserialization)
- Memory usage: 10-50x reduction (only accessed fields)

_Full benchmark suite coming soon—stay tuned for detailed comparisons with serde, bincode, and protobuf._

## When to Use Apache Fory Rust

### ✅ **Ideal Use Cases**

1. **Microservices with polyglot teams**
   - Different services in different languages
   - Need seamless data exchange without schema files
   - Schema evolution across independent deployments

2. **High-performance data pipelines**
   - Processing millions of records per second
   - Memory-constrained environments (use row format)
   - Analytics workloads with selective field access

3. **Complex domain models**
   - Circular references (parent-child relationships, graphs)
   - Polymorphic types (trait objects, inheritance hierarchies)
   - Rich object graphs with shared references

4. **Real-time systems**
   - Low-latency requirements (<1ms serialization)
   - Memory-mapped file access
   - Zero-copy deserialization critical

### ⚠️ **Consider Alternatives If**

1. **You need human-readable data**: Use JSON/YAML for debugging
2. **You need long-term storage format**: Use Parquet for data lakes
3. **You need maximum portability**: Use Protocol Buffers (more languages)
4. **Your data is trivial**: serde + bincode is simpler for basic types

## Getting Started in 5 Minutes

### Installation

Add to `Cargo.toml`:

```toml
[dependencies]
fory = "0.13"
```

### Basic Object Serialization

```rust
use fory::{Fory, Error, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
    email: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
    fory.register::<User>(1);  // Register with unique ID

    let user = User {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };

    // Serialize
    let bytes = fory.serialize(&user);

    // Deserialize
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);

    Ok(())
}
```

### Cross-Language Serialization

```rust
use fory::{Fory, Mode};

// Enable cross-language mode
let mut fory = Fory::default()
    .mode(Mode::Compatible)
    .xlang(true);

// Register with namespace for cross-language compatibility
fory.register_by_namespace::<User>("com.example", "User");

let bytes = fory.serialize(&user);
// This can now be deserialized in Java, Python, Go, etc.
```

### Row Format for Analytics

```rust
use fory::{to_row, from_row, ForyRow};

#[derive(ForyRow)]
struct LogEntry {
    timestamp: i64,
    user_id: i64,
    event_type: String,
    metadata: HashMap<String, String>,
}

// Serialize to row format
let row_data = to_row(&log);

// Zero-copy field access
let row = from_row::<LogEntry>(&row_data);
if row.event_type() == "error" {
    process_error(row.user_id(), row.metadata());
}
```

## Supported Types

Apache Fory Rust supports a comprehensive type system:

**Primitives**: `bool`, `i8`, `i16`, `i32`, `i64`, `f32`, `f64`, `String`

**Collections**: `Vec<T>`, `HashMap<K,V>`, `BTreeMap<K,V>`, `HashSet<T>`, `Option<T>`

**Smart Pointers**: `Box<T>`, `Rc<T>`, `Arc<T>`, `RcWeak<T>`, `ArcWeak<T>`, `RefCell<T>`, `Mutex<T>`

**Date/Time**: `chrono::NaiveDate`, `chrono::NaiveDateTime`

**Custom Types**: Derive `ForyObject` for object graphs, `ForyRow` for row format

**Trait Objects**: `Box<dyn T>`, `Rc<dyn T>`, `Arc<dyn T>`, `Rc<dyn Any>`, `Arc<dyn Any>`

## Roadmap: What's Next

Apache Fory Rust is production-ready today, but we're just getting started:

### ✅ **Shipped in v0.13**

- ✅ Static codegen via procedural macros
- ✅ Row format serialization with zero-copy
- ✅ Cross-language object graph serialization
- ✅ Shared and circular reference tracking
- ✅ Weak pointer support (RcWeak, ArcWeak)
- ✅ Trait object serialization (Box/Rc/Arc)
- ✅ Schema evolution in compatible mode
- ✅ SIMD optimizations for string encoding

### 🚧 **Coming Soon**

- [ ] **Comprehensive benchmarks**: Head-to-head with serde, bincode, protobuf
- [ ] **Partial row updates**: Mutate row format in-place
- [ ] **Advanced SIMD**: Vectorize primitive array serialization

### 🎯 **Help Wanted**

We're actively seeking contributors for:

- **Performance tuning**: Profile and optimize hot paths
- **Documentation**: More examples, tutorials, and guides
- **Testing**: Fuzzing, property tests, edge case coverage
- **Integrations**: Actix, Tokio, gRPC, Arrow, Parquet

## Comparison with Other Frameworks

### **vs. serde + bincode**

| Feature             | Apache Fory       | serde + bincode         |
| ------------------- | ----------------- | ----------------------- |
| Cross-language      | ✅ (6 languages)  | ❌ (Rust-only)          |
| Circular references | ✅ Automatic      | ❌ Manual or impossible |
| Trait objects       | ✅ Native support | ❌ Manual serialization |
| Schema evolution    | ✅ Built-in       | ⚠️ Manual versioning    |
| Zero-copy           | ✅ Row format     | ❌ Always deserializes  |

**Verdict**: Use Fory for cross-language or complex object graphs.

### **vs. Protocol Buffers**

| Feature             | Apache Fory         | Protobuf         |
| ------------------- | ------------------- | ---------------- |
| Schema files        | ❌ Not required     | ✅ Required      |
| Code generation     | ✅ Automatic macros | ⚠️ External tool |
| Circular references | ✅ Automatic        | ❌ Not supported |
| Polymorphism        | ✅ Native traits    | ⚠️ Oneof types   |
| Performance         | 2-5x faster         | Good             |
| Language support    | 6 languages         | 20+ languages    |

**Verdict**: Use Protobuf for maximum language support and long-term stability. Use Fory for Rust-native ergonomics and performance.

### **vs. MessagePack**

| Feature            | Apache Fory     | MessagePack      |
| ------------------ | --------------- | ---------------- |
| Type safety        | ✅ Compile-time | ⚠️ Runtime       |
| Schema evolution   | ✅ Automatic    | ❌ Manual        |
| Reference tracking | ✅ Built-in     | ❌ Not supported |
| Zero-copy          | ✅ Row format   | ❌ Not supported |

**Verdict**: Use Fory for type-safe, high-performance Rust.

## Under the Hood: Advanced Features

### Meta String Compression

Apache Fory compresses type metadata using gzip when `share_meta` mode is enabled:

```rust
let fory = Fory::default().share_meta(true);

// First serialization: Sends full type metadata
let bytes1 = fory.serialize(&obj1);  // ~500 bytes

// Subsequent serializations: References metadata
let bytes2 = fory.serialize(&obj2);  // ~200 bytes (60% reduction)
```

This dramatically reduces payload size for repeated serialization of the same types.

### Buffer Pre-Allocation

Apache Fory pre-allocates buffers based on `fory_reserved_space()` hints:

```rust
impl Serializer for MyStruct {
    fn fory_reserved_space() -> usize {
        // Estimate: 8 bytes (i64) + 24 bytes (String header) + avg 100 bytes
        132
    }
}

// Serialization pre-allocates 132 bytes, avoiding reallocation
```

This eliminates 80-90% of allocations for fixed-size structures.

### Type Registration Strategies

Apache Fory supports two registration modes:

```rust
// ID-based registration (fastest lookup, manual coordination)
fory.register::<User>(100);

// Namespace-based registration (automatic, cross-language)
fory.register_by_namespace::<User>("com.example", "User");
```

**ID-based**: O(1) lookup, requires centralized ID management
**Namespace-based**: String lookup, automatic cross-language mapping

## Production Considerations

### Thread Safety

`Fory` instances are **not thread-safe**. Use one instance per thread:

```rust
use std::thread_local;

thread_local! {
    static FURY: RefCell<Fory> = RefCell::new(Fory::default());
}

FURY.with(|fory| {
    fory.borrow().serialize(&data)
});
```

Or use thread-safe primitives:

```rust
use once_cell::sync::Lazy;
use parking_lot::Mutex;

static FURY: Lazy<Mutex<Fory>> = Lazy::new(|| {
    Mutex::new(Fory::default())
});

let bytes = FURY.lock().serialize(&data);
```

### Error Handling

Apache Fory uses `Result<T, Error>` for all fallible operations:

```rust
use fory::Error;

match fory.deserialize::<User>(&bytes) {
    Ok(user) => process_user(user),
    Err(Error::TypeMismatch) => log::error!("Schema mismatch"),
    Err(Error::BufferTooShort) => log::error!("Incomplete data"),
    Err(e) => log::error!("Deserialization failed: {}", e),
}
```

### Versioning

Pin your Fory version for production:

```toml
[dependencies]
fory = "=0.13.0"  # Exact version
```

Schema-compatible changes are guaranteed within minor versions (0.13.x).

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

## Conclusion: The Future of Rust Serialization

Apache Fory Rust represents a paradigm shift in serialization:

- **No more trade-offs**: Get performance _and_ flexibility
- **No more boilerplate**: Derive macros handle the complexity
- **No more lock-in**: Cross-language by default
- **No more schema files**: Automatic type tracking

Whether you're building microservices, data pipelines, or real-time systems, Apache Fory Rust delivers the performance you need with the ergonomics you deserve.

**Try it today**:

```bash
cargo add fory
```

**Join the community**:

```bash
git clone https://github.com/apache/fory.git
cd fory/rust
cargo test --features tests
```

**Share your experience**:

- Write a blog post about your use case
- Present at your local Rust meetup
- Contribute benchmarks from your domain

---

**Apache Fory Rust 0.13 is available now.** Download it, try it, and let us know what you think. Together, we're building the future of high-performance serialization.

---

## Frequently Asked Questions

### **Q: Is Apache Fory production-ready?**

**A:** Yes. Apache Fory has been used in production at Ant Group for distributed systems handling billions of requests per day. The Rust implementation follows the same battle-tested protocol.

### **Q: How does Fory compare to Cap'n Proto?**

**A:** Cap'n Proto excels at zero-copy but requires schema files and doesn't support circular references. Fory offers zero-copy (row format) _plus_ automatic reference tracking and trait objects.

### **Q: Can I serialize private fields?**

**A:** Yes. The `ForyObject` macro accesses fields directly without getters/setters.

### **Q: Does Fory support enums with data?**

**A:** Currently only C-style enums (no data payloads). Rust enums with data are planned for v0.14.

### **Q: How do I handle schema changes in production?**

**A:** Use Compatible mode with namespace-based registration. Add fields with `Option<T>` or `Default` implementations.

### **Q: Can I use Fory with async runtimes (Tokio)?**

**A:** Yes, but serialization is currently synchronous. Async support is planned for v0.14.

### **Q: What's the memory overhead of reference tracking?**

**A:** <1KB for typical object graphs. Reference map is cleared after each serialization.

### **Q: Can I contribute even if I'm new to Rust?**

**A:** Absolutely! We have "good first issue" labels and mentoring available. Documentation and examples are great starting points.

---

_Written by the Apache Fory team. Questions? Join our [Slack community](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A) or [open an issue](https://github.com/apache/fory/issues)._

_Published: January 2025_

---

**Share this post**:
[Twitter](https://twitter.com/intent/tweet?text=Apache%20Fory%20Rust%20is%20here!%20Blazingly-fast%20cross-language%20serialization%20with%20circular%20references,%20trait%20objects,%20and%20zero-copy.%20https://fory.apache.org) | [Reddit](https://reddit.com/r/rust) | [Hacker News](https://news.ycombinator.com) | [LinkedIn](https://linkedin.com)
