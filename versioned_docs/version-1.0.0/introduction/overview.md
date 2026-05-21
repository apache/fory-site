---
id: overview
title: Overview
sidebar_position: 1
---

<div class="themed-logo">
    <img width="65%" alt="Apache Fory logo" src="/img/fory-logo-dark.png" class="themed-logo-dark"/>
    <img width="65%" alt="Apache Fory logo" src="/img/fory-logo-light.png" class="themed-logo-light"/>
</div>

**Apache Fory™** is a blazingly-fast multi-language serialization framework for
idiomatic domain objects, schema IDL, and cross-language data exchange.

Fory is built for compact, high-throughput serialization across languages and
runtimes. It works directly with application objects, supports shared schemas
when you need a stable contract, and preserves object graph features such as
shared references, circular references, and polymorphic runtime types.

## Quick Example

Cross-language serialization — serialize in Rust, deserialize in Python:

**Rust**

```rust
use fory::{Fory, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
}

fn main() {
    let mut fory = Fory::default().xlang(true);
    fory.register::<User>(1);

    let user = User { name: "Alice".to_string(), age: 30 };
    let bytes = fory.serialize(&user).unwrap();
    let decoded: User = fory.deserialize(&bytes).unwrap();
    println!("{:?}", decoded);  // User { name: "Alice", age: 30 }
}
```

**Python**

```python
import pyfory
from dataclasses import dataclass

@dataclass
class User:
    name: str
    age: pyfory.int32

fory = pyfory.Fory(xlang=True)
fory.register(User, type_id=1)

user = User(name="Alice", age=30)
data = fory.serialize(user)
decoded = fory.deserialize(data)
print(decoded)  # User(name='Alice', age=30)
```

## Key Features

### Efficient Cross-Language Encoding

The **[xlang serialization format](../specification/xlang_serialization_spec.md)**
exchanges compact binary payloads across supported languages:

- **Compact metadata**: Type metadata and field information are packed to keep payloads small.
- **Schema evolution**: Compatible mode supports forward and backward evolution for application schemas.
- **Object graph semantics**: Shared references, circular references, and polymorphic runtime types are preserved across runtimes.
- **Type mapping**: Language-specific values are mapped through the shared [type mapping](../specification/xlang_type_mapping.md).

### Domain Objects First

Fory serializes host-language models directly instead of forcing applications
through wrapper types:

- Java classes, Scala/Kotlin types, and GraalVM native image workloads.
- Python dataclasses and Python-native object graphs.
- Go structs, Rust structs, C++ structs, C# models, Swift types, Dart models, and JavaScript/TypeScript values.
- Generated or annotated model types when a shared contract is preferred.

### Reference-Aware Schema IDL

**[Fory IDL and the compiler](../compiler/index.md)** let teams define schemas
once and generate native domain objects for each target language:

- Model numbers, strings, lists, maps, arrays, enums, structs, and unions.
- Express shared and circular references directly in the schema.
- Generate idiomatic host-language code without introducing transport-specific wrapper types into user code.
- Use schema IDL when services need a stable contract across independently maintained runtimes.

### Row-Format Random Access

A cache-friendly **[row format](../specification/row_format_spec.md)** is
optimized for analytics and partial-read workloads:

- **Zero-copy random access**: Read fields, arrays, and nested values without rebuilding whole objects.
- **Partial operations**: Read only the values needed for a query or pipeline stage.
- **Apache Arrow integration**: Convert to columnar data for analytics pipelines.
- **Multi-language support**: Use row format from Java, Python, Rust, and C++.

### Optimized Runtimes

Fory keeps hot paths fast without making every runtime use the same implementation strategy:

- **Java JIT serializers**: Runtime code generation eliminates reflection overhead and inlines hot paths.
- **Generated and static serializers**: Other runtimes use generated or static serializers where appropriate.
- **Zero-copy paths**: Row format and out-of-band buffers avoid unnecessary copies for large values.
- **Metadata sharing**: Repeated type information is shared or packed to reduce serialization overhead.

### Production-Readiness

Enterprise-grade security and compatibility:

- **Class Registration**: Whitelist-based deserialization control (enabled by default)
- **Depth Limiting**: Protection against recursive object graph attacks
- **Configurable Policies**: Custom class checkers and deserialization policies
- **Platform Support**: Java 8-24, GraalVM native image, multiple OS platforms

## Protocols

Apache Fory™ implements multiple binary protocols optimized for different scenarios:

| Protocol                                                                | Use Case                       | Key Features                                           |
| ----------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| **[Xlang Serialization](../specification/xlang_serialization_spec.md)** | Cross-language object exchange | Automatic serialization, references, polymorphism      |
| **[Java Serialization](../specification/java_serialization_spec.md)**   | High-performance Java-only     | Java-native object graphs, JDK hooks, optimized runtime |
| **[Row Format](../specification/row_format_spec.md)**                   | Analytics and data processing  | Zero-copy random access, Arrow compatibility           |
| **Python Native**                                                       | Python-specific serialization  | Pickle/cloudpickle replacement with better performance |

All protocols share the same optimized codebase, allowing improvements in one protocol to benefit others.

## Documentation

### User Guides

| Guide                            | Description                                | Source                                                                                    | Website                                |
| -------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| **Java Serialization**           | Comprehensive guide for Java serialization | [Java Guide](https://github.com/apache/fory/blob/main/docs/guide/java/)                   | [View](../guide/java)               |
| **Cross-Language Serialization** | Multi-language object exchange             | [Xlang Guide](https://github.com/apache/fory/blob/main/docs/guide/xlang/)                 | [View](../guide/xlang)              |
| **Row Format**                   | Zero-copy random access format             | [Java Row Format](https://github.com/apache/fory/blob/main/docs/guide/java/row-format.md) | [View](../guide/java/row-format.md) |
| **Python**                       | Python-specific features and usage         | [Python Guide](https://github.com/apache/fory/blob/main/docs/guide/python/)               | [View](../guide/python)             |
| **Rust**                         | Rust implementation and patterns           | [Rust Guide](https://github.com/apache/fory/blob/main/docs/guide/rust/)                   | [View](../guide/rust)               |
| **Go**                           | Go implementation and usage                | [Go Guide](https://github.com/apache/fory/blob/main/docs/guide/go/)                       | [View](../guide/go)                 |
| **Scala**                        | Scala integration and best practices       | [Scala Guide](https://github.com/apache/fory/blob/main/docs/guide/scala/)                 | [View](../guide/scala)              |
| **GraalVM**                      | Native image support and AOT compilation   | [GraalVM Support](https://github.com/apache/fory/blob/main/docs/guide/java/graalvm-support.md) | [View](../guide/java/graalvm_support) |
| **Development**                  | Building and contributing to Fory          | [Development](https://github.com/apache/fory/blob/main/docs/DEVELOPMENT.md)               | [View](../community/DEVELOPMENT)    |

### Protocol Specifications

| Specification           | Description                    | Source                                                                                                                 | Website                                                 |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Xlang Serialization** | Cross-language binary protocol | [xlang_serialization_spec.md](https://github.com/apache/fory/blob/main/docs/specification/xlang_serialization_spec.md) | [View](../specification/xlang_serialization_spec.md) |
| **Java Serialization**  | Java-optimized protocol        | [java_serialization_spec.md](https://github.com/apache/fory/blob/main/docs/specification/java_serialization_spec.md)   | [View](../specification/java_serialization_spec.md)  |
| **Row Format**          | Row-based binary format        | [row_format_spec.md](https://github.com/apache/fory/blob/main/docs/specification/row_format_spec.md)                   | [View](../specification/row_format_spec.md)          |
| **Type Mapping**        | Cross-language type conversion | [xlang_type_mapping.md](https://github.com/apache/fory/blob/main/docs/specification/xlang_type_mapping.md)             | [View](../specification/xlang_type_mapping.md)       |

## Compatibility

### Schema Compatibility

Apache Fory™ supports class schema forward/backward compatibility across **Java, Python, Rust, and Golang**, enabling seamless schema evolution in production systems without requiring coordinated upgrades across all services. Fory provides two schema compatibility modes:

1. **Schema Consistent Mode (Default)**: Assumes identical class schemas between serialization and deserialization peers. This mode offers minimal serialization overhead, smallest data size, and fastest performance: ideal for stable schemas or controlled environments.

2. **Compatible Mode**: Supports independent schema evolution with forward and backward compatibility. This mode enables field addition/deletion, limited type evolution, and graceful handling of schema mismatches. Enable using `withCompatibleMode(CompatibleMode.COMPATIBLE)` in Java, `compatible=True` in Python, `compatible_mode(true)` in Rust, or `NewFory(true)` in Go.

## Community and Support

### Getting Help

- **Slack**: Join our [Slack workspace](https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw) for community discussions
- **Twitter/X**: Follow [@ApacheFory](https://x.com/ApacheFory) for updates and announcements
- **GitHub Issues**: Report bugs and request features at [apache/fory](https://github.com/apache/fory/issues)
- **Mailing Lists**: Subscribe to Apache Fory mailing lists for development discussions

### Contributing

We welcome contributions! Please read our [Contributing Guide](https://github.com/apache/fory/blob/main/CONTRIBUTING.md) to get started.

**Ways to Contribute**:

- Report bugs and issues
- Propose new features
- Improve documentation
- Submit pull requests
- Add test cases
- Share benchmarks

See [Development Guide](../community/DEVELOPMENT.md) for build instructions and development workflow.
