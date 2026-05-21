---
id: features
title: Features
sidebar_position: 2
---

## Core Capabilities

### High-Performance Serialization

Apache Fory™ delivers exceptional performance through advanced optimization techniques:

- **JIT Compilation**: Runtime code generation for Java eliminates virtual method calls and inlines hot paths
- **Static Code Generation**: Compile-time code generation for Rust, C++, and Go delivers peak performance without runtime overhead
- **Zero-Copy Operations**: Direct memory access without intermediate buffer copies; row format enables random access and partial serialization
- **Intelligent Encoding**: Variable-length compression for integers and strings; SIMD acceleration for arrays (Java 16+)
- **Meta Sharing**: Class metadata packing reduces redundant type information across serializations

### Cross-Language Serialization

The **[xlang serialization format](../specification/xlang_serialization_spec.md)** enables seamless data exchange across programming languages:

- **Automatic Type Mapping**: Intelligent conversion between language-specific types ([type mapping](../specification/xlang_type_mapping.md))
- **Reference Preservation**: Shared and circular references work correctly across languages
- **Polymorphism**: Objects serialize/deserialize with their actual runtime types
- **Schema Evolution**: Optional forward/backward compatibility for evolving schemas
- **Automatic Serialization**: No IDL or schema definitions required; serialize any object directly without code generation

### Row Format

A cache-friendly **[row format](../specification/row_format_spec.md)** optimized for analytics workloads:

- **Zero-Copy Random Access**: Read individual fields without deserializing entire objects
- **Partial Operations**: Selective field serialization and deserialization for efficiency
- **Apache Arrow Integration**: Seamless conversion to columnar format for analytics pipelines
- **Multi-Language**: Available in Java, Python, Rust and C++

### Security & Production-Readiness

Enterprise-grade security and compatibility:

- **Class Registration**: Whitelist-based deserialization control (enabled by default)
- **Depth Limiting**: Protection against recursive object graph attacks
- **Configurable Policies**: Custom class checkers and deserialization policies
- **Platform Support**: Java 8-24, GraalVM native image, multiple OS platforms

## Java Features

### High Performance

- **JIT Code Generation**: Highly-extensible JIT framework generates serializer code at runtime using async multi-threaded compilation, delivering 20-170x speedup through:
  - Inlining variables to reduce memory access
  - Inlining method calls to eliminate virtual dispatch overhead
  - Minimizing conditional branching
  - Eliminating hash lookups
- **Zero-Copy**: Direct memory access without intermediate buffer copies; row format supports random access and partial serialization
- **Variable-Length Encoding**: Optimized compression for integers, longs
- **Meta Sharing**: Cached class metadata reduces redundant type information
- **SIMD Acceleration**: Java Vector API support for array operations (Java 16+)

### Drop-in Replacement

- **100% JDK Serialization Compatible**: Supports `writeObject`/`readObject`/`writeReplace`/`readResolve`/`readObjectNoData`/`Externalizable`
- **Java 8-24 Support**: Works across all modern Java versions including Java 17+ records
- **GraalVM Native Image**: AOT compilation support without reflection configuration

### Advanced Features

- **Reference Tracking**: Automatic handling of shared and circular references
- **Schema Evolution**: Forward/backward compatibility for class schema changes
- **Polymorphism**: Full support for inheritance hierarchies and interfaces
- **Deep Copy**: Efficient deep cloning of complex object graphs with reference preservation
- **Security**: Class registration and configurable deserialization policies

## Python Features

### **Flexible Serialization Modes**

- **Python native Mode**: Full Python compatibility, drop-in replacement for pickle/cloudpickle
- **Cross-Language Mode**: Optimized for multi-language data exchange
- **Row Format**: Zero-copy row format for analytics workloads

### Versatile Serialization Features

- **Shared/circular reference support** for complex object graphs in both Python-native and cross-language modes
- **Polymorphism support** for customized types with automatic type dispatching
- **Schema evolution** support for backward/forward compatibility when using dataclasses in cross-language mode
- **Out-of-band buffer support** for zero-copy serialization of large data structures like NumPy arrays and Pandas DataFrames, compatible with pickle protocol 5

### **Blazing Fast Performance**

- **Extremely fast performance** compared to other serialization frameworks
- **Runtime code generation** and **Cython-accelerated** core implementation for optimal performance

### Compact Data Size

- **Compact object graph protocol** with minimal space overhead—up to 3× size reduction compared to pickle/cloudpickle
- **Meta packing and sharing** to minimize type forward/backward compatibility space overhead

### **Security & Safety**

- **Strict mode** prevents deserialization of untrusted types by type registration and checks.
- **Reference tracking** for handling circular references safely

## Rust Features

### Why Apache Fory™ Rust?

- **Blazingly Fast**: Zero-copy deserialization and optimized binary protocols
- **Cross-Language**: Seamlessly serialize/deserialize data across Java, Python, C++, Go, JavaScript, and Rust
- **Type-Safe**: Compile-time type checking with derive macros
- **Circular References**: Automatic tracking of shared and circular references with `Rc`/`Arc` and weak pointers
- **Polymorphic**: Serialize trait objects with `Box<dyn Trait>`, `Rc<dyn Trait>`, and `Arc<dyn Trait>`
- **Schema Evolution**: Compatible mode for independent schema changes
- **Two Modes**: Object graph serialization and zero-copy row-based format

### Object Graph Serialization

Automatic serialization of complex object graphs, preserving the structure and relationships between objects. The `#[derive(ForyObject)]` macro generates efficient serialization code at compile time, eliminating runtime overhead:

- Nested struct serialization with arbitrary depth
- Collection types (Vec, HashMap, HashSet, BTreeMap)
- Enum type support
- Optional fields with `Option<T>`
- Automatic handling of primitive types and strings
- Efficient binary encoding with variable-length integers

### Shared and Circular References

Automatically tracks and preserves reference identity for shared objects using `Rc<T>` and `Arc<T>`. When the same object is referenced multiple times, Fory serializes it only once and uses reference IDs for subsequent occurrences. This ensures:

- **Space efficiency**: No data duplication in serialized output
- **Reference identity preservation**: Deserialized objects maintain the same sharing relationships
- **Circular reference support**: Use `RcWeak<T>` and `ArcWeak<T>` to break cycles

### Trait Object Serialization

Polymorphic serialization through trait objects, enabling dynamic dispatch and type flexibility. This is essential for plugin systems, heterogeneous collections, and extensible architectures. Supported trait object types:

- `Box<dyn Trait>` - Owned trait objects
- `Rc<dyn Trait>` - Reference-counted trait objects
- `Arc<dyn Trait>` - Thread-safe reference-counted trait objects
- `Vec<Box<dyn Trait>>`, `HashMap<K, Box<dyn Trait>>` - Collections of trait objects

### Schema Evolution

Schema evolution in **Compatible mode**, allowing serialization and deserialization peers to have different type definitions. This enables independent evolution of services in distributed systems without breaking compatibility:

- Add new fields with default values
- Remove obsolete fields (skipped during deserialization)
- Change field nullability (`T` ↔ `Option<T>`)
- Reorder fields (matched by name, not position)
- Type-safe fallback to default values for missing fields

### Custom Serializers

For types that don't support `#[derive(ForyObject)]`, implement the `Serializer` trait manually. This is useful for:

- External types from other crates
- Types with special serialization requirements
- Legacy data format compatibility
- Performance-critical custom encoding

### Row-Based Serialization

High-performance **row format** for zero-copy deserialization. Unlike traditional object serialization that reconstructs entire objects in memory, row format enables **random access** to fields directly from binary data without full deserialization.

- **Zero-copy access**: Read fields without allocating or copying data
- **Partial deserialization**: Access only the fields you need
- **Memory-mapped files**: Work with data larger than RAM
- **Cache-friendly**: Sequential memory layout for better CPU cache utilization
- **Lazy evaluation**: Defer expensive operations until field access

## Scala Features

### Supported Types

Apache Fory™ supports all scala object serialization:

- `case` class serialization supported
- `pojo/bean` class serialization supported
- `object` singleton serialization supported
- `collection` serialization supported
- other types such as `tuple/either` and basic types are all supported too.

Scala 2 and 3 are both supported.

### Scala Class Default Values Support

Fory supports Scala class default values during deserialization when using compatible mode. This feature enables forward/backward compatibility when case classes or regular Scala classes have default parameters.

When a Scala class has default parameters, the Scala compiler generates methods in the companion object (for case classes) or in the class itself (for regular Scala classes) like `apply$default$1`, `apply$default$2`, etc. that return the default values. Fory can detect these methods and use them when deserializing objects where certain fields are missing from the serialized data.

## Kotlin Features

Kotlin support builds on the default Fory Java implementation and adds handling for Kotlin-specific types and schema evolution.

### Supported Types

- Primitive types: `Byte`, `Boolean`, `Int`, `Short`, `Long`, `Char`, `Float`, `Double`
- Unsigned types: `UByte`, `UShort`, `UInt`, `ULong`
- Strings, standard arrays, and standard collections through the default Java implementation
- Kotlin collections and arrays such as `ArrayDeque`, `Array`, `BooleanArray`, `ByteArray`, `IntArray`, `LongArray`, `UByteArray`, `UIntArray`, and `ULongArray`
- Common stdlib types including `Pair`, `Triple`, `Result`, `Regex`, `Random`, `Duration`, and `Uuid`
- Kotlin ranges and progressions such as `CharRange`, `IntRange`, `LongRange`, `UIntRange`, `ULongRange`, and related progression types
- Empty collections such as `emptyList`, `emptyMap`, and `emptySet`

### Data Class Default Value Support

In compatible mode, Fory can detect Kotlin data class default values and apply them during deserialization when fields are missing. This allows schemas to evolve more safely, for example when adding new fields with defaults.
