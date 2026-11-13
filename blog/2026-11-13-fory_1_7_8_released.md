---
slug: fory_1_7_8_release
title: Fory v1.7.8 Released
description: "Fory 1.7.8 adds token-level JSON I/O, optional duplicate-property checks, and Rust smart pointers to strings and slices."
authors: [chaokunyang]
tags: [fory, java, json, rust]
---

Apache Fory 1.7.8 is available from the [download page](/download/). This release adds two Java JSON APIs for framework authors and expands the types Rust applications can serialize.

## Java JSON

Frameworks with their own serializers can use `ForyJson.readUtf8` and `writeUtf8` to read or write one JSON value directly. For example, this round trip encodes an integer as UTF-8 JSON and reads it back:

```java
ForyJson json = ForyJson.builder().build();
byte[] bytes = json.writeUtf8(writer -> writer.writeInt(7));
int id = json.readUtf8(bytes, 0, bytes.length, reader -> reader.readInt());
```

The reader and writer are valid for the duration of the callback. See [token-level reading and writing](/docs/json/integration#token-level-reading-and-writing) for object and array handling.

Applications can also enable `failOnDuplicateProperties(true)` to reject repeated known properties when reading an object. For example, an object mapped to an `id` property rejects `{"id":1,"id":2}` with that option enabled. The default keeps the last value. Use `@JsonDuplicateProperties` to choose the behavior for an individual class. See [duplicate properties](/docs/json/object-mapping#duplicate-properties).

## Rust smart pointers

Rust models can now use smart pointers to `str` and `[T]`, including `Arc<str>` for a shared string and `Box<[u8]>` for an owned byte slice. These work in native and cross-language modes. With reference tracking enabled, shared and weak pointers can resolve to the same allocation after a round trip. See [Rust serialization](/docs/object-serialization/rust/basic-serialization/) for field annotations and examples.

## Other changes

- The Python schema compiler reports an error when two fields would generate the same Python attribute, such as `userName` and `user_name`.
- Java preserves sub-millisecond precision when copying `java.sql.Timestamp` values.
- The [source SBOM](https://downloads.apache.org/fory/apache-fory-1.7.8-src.tar.gz.cdx.json) lists components identified in the manifests and lock files included in the source archive.

[Full changelog since 1.7.7](https://github.com/apache/fory/compare/v1.7.7...6f67e5b4978f909d614b990482063e332019f015)
