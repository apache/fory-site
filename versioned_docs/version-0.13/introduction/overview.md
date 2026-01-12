---
id: overview
title: Overview
sidebar_position: 1
---

<img width="65%" alt="Apache Fory logo" src="/img/navbar-logo.png"/>

**Apache Fory™** is a blazingly-fast multi-language serialization framework powered by **JIT compilation**, **zero-copy** techniques, and **advanced code generation**, achieving up to **170x performance improvement** while maintaining simplicity and ease of use.

## Key Features

### 🚀 High-Performance Serialization

Apache Fory™ delivers exceptional performance through advanced optimization techniques:

- **JIT Compilation**: Runtime code generation for Java eliminates virtual method calls and inlines hot paths
- **Static Code Generation**: Compile-time code generation for Rust, C++, and Go delivers peak performance without runtime overhead
- **Zero-Copy Operations**: Direct memory access without intermediate buffer copies; row format enables random access and partial serialization
- **Intelligent Encoding**: Variable-length compression for integers and strings; SIMD acceleration for arrays (Java 16+)
- **Meta Sharing**: Class metadata packing reduces redundant type information across serializations

### 🌍 Cross-Language Serialization

The **[xlang serialization format](docs/specification/xlang_serialization_spec.md)** enables seamless data exchange across programming languages:

- **Automatic Type Mapping**: Intelligent conversion between language-specific types ([type mapping](docs/specification/xlang_type_mapping.md))
- **Reference Preservation**: Shared and circular references work correctly across languages
- **Polymorphism**: Objects serialize/deserialize with their actual runtime types
- **Schema Evolution**: Optional forward/backward compatibility for evolving schemas
- **Automatic Serialization**: No IDL or schema definitions required; serialize any object directly without code generation

### 📊 Row Format

A cache-friendly **[row format](docs/specification/row_format_spec.md)** optimized for analytics workloads:

- **Zero-Copy Random Access**: Read individual fields without deserializing entire objects
- **Partial Operations**: Selective field serialization and deserialization for efficiency
- **Apache Arrow Integration**: Seamless conversion to columnar format for analytics pipelines
- **Multi-Language**: Available in Java, Python, Rust and C++

### 🔒 Security & Production-Readiness

Enterprise-grade security and compatibility:

- **Class Registration**: Whitelist-based deserialization control (enabled by default)
- **Depth Limiting**: Protection against recursive object graph attacks
- **Configurable Policies**: Custom class checkers and deserialization policies
- **Platform Support**: Java 8-24, GraalVM native image, multiple OS platforms

## Protocols

Apache Fory™ implements multiple binary protocols optimized for different scenarios:

| Protocol                                                                  | Use Case                       | Key Features                                           |
| ------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| **[Xlang Serialization](docs/specification/xlang_serialization_spec.md)** | Cross-language object exchange | Automatic serialization, references, polymorphism      |
| **[Java Serialization](docs/specification/java_serialization_spec.md)**   | High-performance Java-only     | Drop-in JDK serialization replacement, 100x faster     |
| **[Row Format](docs/specification/row_format_spec.md)**                   | Analytics and data processing  | Zero-copy random access, Arrow compatibility           |
| **Python Native**                                                         | Python-specific serialization  | Pickle/cloudpickle replacement with better performance |

All protocols share the same optimized codebase, allowing improvements in one protocol to benefit others.

## Documentation

### User Guides

| Guide                            | Description                                | Source                                                                  | Website                                                                             |
| -------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Java Serialization**           | Comprehensive guide for Java serialization | [java_serialization_guide.md](../guide/java_serialization_guide.md)   | [📖 View](https://fory.apache.org/docs/guide/java_serialization)               |
| **Cross-Language Serialization** | Multi-language object exchange             | [xlang_serialization_guide.md](../guide/xlang_serialization_guide.md) | [📖 View](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec) |
| **Row Format**                   | Zero-copy random access format             | [row_format_guide.md](../guide/row_format_guide.md)                   | [📖 View](https://fory.apache.org/docs/specification/fory_row_format_spec)          |
| **Python**                       | Python-specific features and usage         | [python_guide.md](../guide/python_guide.md)                           | [📖 View](https://fory.apache.org/docs/guide/python_serialization)             |
| **Rust**                         | Rust implementation and patterns           | [rust_guide.md](../guide/rust_guide.md)                               | [📖 View](https://fory.apache.org/docs/guide/rust_serialization)               |
| **Scala**                        | Scala integration and best practices       | [scala_guide.md](../guide/scala_guide.md)                             | [📖 View](https://fory.apache.org/docs/guide/scala_serialization)              |
| **GraalVM**                      | Native image support and AOT compilation   | [graalvm_guide.md](../guide/graalvm_guide.md)                         | [📖 View](https://fory.apache.org/docs/guide/graalvm_serialization)            |
| **Development**                  | Building and contributing to Fory          | [DEVELOPMENT.md](../guide/DEVELOPMENT.md)                             | [📖 View](https://fory.apache.org/docs/guide/development)                      |

### Protocol Specifications

| Specification           | Description                    | Source                                                                        | Website                                                                             |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Xlang Serialization** | Cross-language binary protocol | [xlang_serialization_spec.md](docs/specification/xlang_serialization_spec.md) | [📖 View](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec) |
| **Java Serialization**  | Java-optimized protocol        | [java_serialization_spec.md](docs/specification/java_serialization_spec.md)   | [📖 View](https://fory.apache.org/docs/specification/fory_java_serialization_spec)  |
| **Row Format**          | Row-based binary format        | [row_format_spec.md](docs/specification/row_format_spec.md)                   | [📖 View](https://fory.apache.org/docs/specification/fory_row_format_spec)          |
| **Type Mapping**        | Cross-language type conversion | [xlang_type_mapping.md](docs/specification/xlang_type_mapping.md)             | [📖 View](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec) |

## Compatibility

### Schema Compatibility

Apache Fory™ supports class schema forward/backward compatibility across **Java, Python, Rust, and Golang**, enabling seamless schema evolution in production systems without requiring coordinated upgrades across all services. Fory provides two schema compatibility modes:

1. **Schema Consistent Mode (Default)**: Assumes identical class schemas between serialization and deserialization peers. This mode offers minimal serialization overhead, smallest data size, and fastest performance: ideal for stable schemas or controlled environments.

2. **Compatible Mode**: Supports independent schema evolution with forward and backward compatibility. This mode enables field addition/deletion, limited type evolution, and graceful handling of schema mismatches. Enable using `withCompatibleMode(CompatibleMode.COMPATIBLE)` in Java, `compatible=True` in Python, `compatible_mode(true)` in Rust, or `NewFory(true)` in Go.

### Binary Compatibility

**Current Status**: Binary compatibility is **not guaranteed** between Fory major releases as the protocol continues to evolve. However, compatibility **is guaranteed** between minor versions (e.g., 0.13.x).

**Recommendations**:

- Version your serialized data by Fory major version
- Plan migration strategies when upgrading major versions
- See [upgrade guide](../guide/java_serialization_guide.md#upgrade-fory) for details

**Future**: Binary compatibility will be guaranteed starting from Fory 1.0 release.

## Security

### Overview

Serialization security varies by protocol:

- **Row Format**: Secure with predefined schemas
- **Object Graph Serialization** (Java/Python native): More flexible but requires careful security configuration

Dynamic serialization can deserialize arbitrary types, which may introduces risks. For example, the deserialization may invoke `init` constructor or `equals/hashCode` method, if the method body contains malicious code, the system will be at risk.

Fory enables class registration **by default** for dynamic protocols, allowing only trusted registered types.
**Do not disable class registration unless you can ensure your environment is secure**.

If this option is disabled, you are responsible for serialization security. You should implement and configure a customized `ClassChecker` or `DeserializationPolicy` for fine-grained security control

To report security vulnerabilities in Apache Fory™, please follow the [ASF vulnerability reporting process](https://apache.org/security/#reporting-a-vulnerability).

## Community and Support

### Getting Help

- **Slack**: Join our [Slack workspace](https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw) for community discussions
- **Twitter/X**: Follow [@ApacheFory](https://x.com/ApacheFory) for updates and announcements
- **GitHub Issues**: Report bugs and request features at [apache/fory](https://github.com/apache/fory/issues)
- **Mailing Lists**: Subscribe to Apache Fory mailing lists for development discussions

### Contributing

We welcome contributions! Please read our [Contributing Guide](https://github.com/apache/fory/blob/main/CONTRIBUTING.md) to get started.

**Ways to Contribute**:

- 🐛 Report bugs and issues
- 💡 Propose new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- 🧪 Add test cases
- 📊 Share benchmarks

See [Development Guide](../guide/DEVELOPMENT.md) for build instructions and development workflow.
