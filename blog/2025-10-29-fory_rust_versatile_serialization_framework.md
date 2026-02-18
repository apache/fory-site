---
slug: fory_rust_versatile_serialization_framework
title: "Introducing Apache Fory™ Rust: A Versatile Serialization Framework for the Modern Age"
authors: [chaokunyang]
tags: [fory, rust]
---

**TL;DR**: Apache Fory Rust is a blazingly-fast, cross-language serialization framework that delivers **ultra-fast serialization performance** while **automatically handling circular references, trait objects, and schema evolution**. Built with Rust's safety guarantees and zero-copy techniques, it's designed for developers who refuse to compromise between performance and developer experience.

- 🐙 GitHub: https://github.com/apache/fory
- 📦 Crate: https://crates.io/crates/fory

<img src="/img/fory-logo-light.png" width="50%"/>

---

## The Serialization Dilemma

Every backend engineer has faced this moment: your application needs to serialize complex data structures such as nested objects, circular references, polymorphic types, and you're forced to choose between three bad options:

1. **Fast but fragile**: Hand-rolled binary formats that break with schema changes
2. **Flexible but slow**: JSON/Protocol with 10x performance overhead
3. **Complex and limiting**: Existing solutions that don't support your language's advanced features

Apache Fory Rust eliminates this false choice. It's a serialization framework that delivers exceptional performance while automatically handling the complexities of modern applications—no IDL files, no manual schema management, no compromises.

## What Makes Apache Fory Rust Different?

### 1. **Truly Cross-Language**

Apache Fory Rust speaks the same binary protocol as Java, Python, C++, Go, and other language implementations. Serialize data in Rust, deserialize in Python — **it just works**. No schema files. No code generation. No version mismatches.

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

This isn't just convenient — it changes how we develop microservices architectures where different teams use different languages.

### 2. **Automatic Shared/Circular Reference Handling**

Most serialization frameworks panic when encountering circular references. Apache Fory tracks and preserves reference identity automatically:

**Shared Reference**:

```rust
use fory::Fory;
use std::rc::Rc;

let fory = Fory::default();

// Create a shared value
let shared = Rc::new(String::from("shared_value"));

// Reference it multiple times
let data = vec![shared.clone(), shared.clone(), shared.clone()];

// The shared value is serialized only once
let bytes = fory.serialize(&data);
let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;

// Verify reference identity is preserved
assert_eq!(decoded.len(), 3);
assert_eq!(*decoded[0], "shared_value");

// All three Rc pointers point to the same object
assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
assert!(Rc::ptr_eq(&decoded[1], &decoded[2]));
```

**Circular Reference**:

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

### 3. **Trait Object Serialization**

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

### 4. **Schema Evolution Without Breaking Changes**

Microservices evolve independently. Apache Fory's **Compatible mode** allows schema changes without coordination:

```rust
use fory::{Fory, ForyObject};

// Service A: Version 1
#[derive(ForyObject)]
struct User {
    name: String,
    age: i32,
    address: String,
}

let mut fory_v1 = Fory::default().compatible(true);
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

let mut fory_v2 = Fory::default().compatible(true);
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
4. **Little-endian layout**: Optimized for modern CPU architectures

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

<img src="/img/benchmarks/rust/ecommerce_data.png" width="90%"/>
<img src="/img/benchmarks/rust/system_data.png" width="90%"/>

| Datatype       | Size   | Operation | Fory TPS   | JSON TPS   | Protobuf TPS | Fastest |
| -------------- | ------ | --------- | ---------- | ---------- | ------------ | ------- |
| company        | small  | serialize | 10,063,906 | 761,673    | 896,620      | fory    |
| company        | medium | serialize | 412,507    | 33,835     | 37,590       | fory    |
| company        | large  | serialize | 9,183      | 793        | 880          | fory    |
| ecommerce_data | small  | serialize | 2,350,729  | 206,262    | 256,970      | fory    |
| ecommerce_data | medium | serialize | 59,977     | 4,699      | 5,242        | fory    |
| ecommerce_data | large  | serialize | 3,727      | 266        | 295          | fory    |
| person         | small  | serialize | 13,632,522 | 1,345,189  | 1,475,035    | fory    |
| person         | medium | serialize | 3,839,656  | 337,610    | 369,031      | fory    |
| person         | large  | serialize | 907,853    | 79,631     | 91,408       | fory    |
| simple_list    | small  | serialize | 27,726,945 | 4,874,957  | 4,643,172    | fory    |
| simple_list    | medium | serialize | 4,770,765  | 401,558    | 397,551      | fory    |
| simple_list    | large  | serialize | 606,061    | 41,061     | 44,565       | fory    |
| simple_map     | small  | serialize | 22,862,369 | 3,888,025  | 2,695,999    | fory    |
| simple_map     | medium | serialize | 2,128,973  | 204,319    | 193,132      | fory    |
| simple_map     | large  | serialize | 177,847    | 18,419     | 18,668       | fory    |
| simple_struct  | small  | serialize | 35,729,598 | 10,167,045 | 8,633,342    | fory    |
| simple_struct  | medium | serialize | 34,988,279 | 9,737,098  | 6,433,350    | fory    |
| simple_struct  | large  | serialize | 31,801,558 | 4,545,041  | 7,420,049    | fory    |
| system_data    | small  | serialize | 5,382,131  | 468,033    | 569,930      | fory    |
| system_data    | medium | serialize | 174,240    | 11,896     | 14,753       | fory    |
| system_data    | large  | serialize | 10,671     | 876        | 1,040        | fory    |

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
   - Low-latency requirements (`<1ms` serialization)
   - Memory-mapped file access
   - Zero-copy deserialization critical

### ⚠️ **Consider Alternatives If**

1. **You need human-readable data**: Use JSON/YAML for debugging
2. **You need long-term storage format**: Use Parquet for data lakes
3. **Your data is trivial**: serde + bincode is simpler for basic types

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
use fory::Fory;

// Enable cross-language mode
let mut fory = Fory::default().compatible(true).xlang(true);

// Register with id/namespace for cross-language compatibility
fory.register_by_namespace::<User>(1);
// fory.register_by_namespace::<User>("example", "User");

let bytes = fory.serialize(&user);
// This can now be deserialized in Java, Python, Go, etc.
```

Register types with **consistent IDs or names** across all languages:

- **By ID** (`fory.register::<User>(1)`): Faster serialization, more compact encoding, but requires coordination to avoid ID conflicts
- **By name** (`fory.register_by_name::<User>("example.User")`): More flexible, less prone to conflicts, easier to manage across teams, but slightly larger encoding

## Supported Types

Apache Fory Rust supports a comprehensive type system:

**Primitives**: `bool`, `i8`, `i16`, `i32`, `i64`, `f32`, `f64`, `String`

**Collections**: `Vec<T>`, `HashMap<K,V>`, `BTreeMap<K,V>`, `HashSet<T>`, `Option<T>`

**Smart Pointers**: `Box<T>`, `Rc<T>`, `Arc<T>`, `RcWeak<T>`, `ArcWeak<T>`, `RefCell<T>`, `Mutex<T>`

**Date/Time**: `chrono::NaiveDate`, `chrono::NaiveDateTime`

**Custom Types**: Derive `ForyObject` for object graphs, `ForyRow` for row format

**Trait Objects**: `Box<dyn T>`, `Rc<dyn T>`, `Arc<dyn T>`, `Rc<dyn Any>`, `Arc<dyn Any>`

## Roadmap: What's Next

Apache Fory Rust is production-ready today, but we're just getting started and continuing active development:

### ✅ **Shipped in v0.13**

- ✅ Static codegen via procedural macros
- ✅ Row format serialization with zero-copy
- ✅ Cross-language object graph serialization
- ✅ Shared and circular reference tracking
- ✅ Weak pointer support (RcWeak, ArcWeak)
- ✅ Trait object serialization (Box/Rc/Arc)
- ✅ Schema evolution in compatible mode

### 🚧 **Coming Soon**

- [ ] **Cross-language reference serialization**: serialize `Rc/Arc` to/from other languages.
- [ ] **Partial row updates**: Mutate row format in-place

### 🎯 **Help Wanted**

We're actively seeking contributors for:

- **Performance tuning**: Profile and optimize hot paths
- **Documentation**: More examples, tutorials, and guides
- **Testing**: Fuzzing, property tests, edge case coverage

## Production Considerations

### Thread Safety

`Fory` becomes fully thread-safe after registration is complete. Once every type is registered (which requires `&mut Fory`), wrap the instance in an `Arc` and freely share it across worker threads for concurrent serialization and deserialization.

```rust
use fory::Fory;
use std::{sync::Arc, thread};

let mut fory = Fory::default();
fory.register::<Item>(1)?;
let fory = Arc::new(fory); // `Fory` is Send + Sync once registration is done

let item = Item::default();
let handles: Vec<_> = (0..4)
    .map(|_| {
        let fory = Arc::clone(&fory);
        let input = item.clone();
        thread::spawn(move || {
            let bytes = fory.serialize(&input);
            let decoded: Item = fory.deserialize(&bytes).expect("valid data");
            (bytes, decoded)
        })
    })
    .collect();

for handle in handles {
    let (bytes, decoded) = handle.join().expect("thread finished");
    // work with `bytes` / `decoded`
}
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

## Documentation

- Apache Fory Rust Guide: [📖 View](https://fory.apache.org/docs/docs/guide/rust_serialization)
- Apache Fory Rust API Doc: [📖 View](https://docs.rs/fory/latest/fory/)
- Apache Fory Xlang Serialization Spec: [📖 View](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec/)

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

Apache Fory Rust represents a paradigm shift in serialization:

- **No more trade-offs**: Get performance _and_ flexibility
- **No more boilerplate**: Derive macros handle the complexity
- **No more lock-in**: Trait-object and shared reference support by nature

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
