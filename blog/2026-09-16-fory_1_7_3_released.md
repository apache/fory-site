---
slug: fory_1_7_3_release
title: Fory v1.7.3 Released
description: "Fory 1.7.3 adds Go Standard Row Format support, improves Java JSON performance, and fixes Kotlin JSON property inclusion."
authors: [chaokunyang]
tags: [fory, java, json, go, kotlin]
---

Apache Fory 1.7.3 is now available. This release adds Standard Row Format support in Go,
improves Java JSON reading and writing, and fixes Kotlin JSON property inclusion and Java
serialization edge cases. See [Getting Started](/docs/start/) for installation instructions.

## Highlights

- Go can encode structs into Standard Row bytes and read selected fields and collection elements directly.
- Java JSON improves floating-point conversion, reading and writing, and timestamp parsing with time zones.
- Kotlin JSON honors property inclusion settings, including `NON_EMPTY`, on the JVM, GraalVM Native Image, and Android.
- Java fixes nested `Externalizable` callbacks and inconsistent exception handling when reading an exhausted stream.

## Standard Row Format in Go

The new `github.com/apache/fory/go/fory/row` package supports the Standard Row layout shared
with Java, C++, Python, and Rust. Use it for trusted analytics data when readers need selected
fields without reconstructing an entire object.

```go
package main

import (
    "fmt"

    "github.com/apache/fory/go/fory/row"
)

type Profile struct {
    Name   string
    Scores []int32
}

func main() {
    encoder, err := row.NewEncoder[Profile]()
    if err != nil {
        panic(err)
    }
    data, err := encoder.ToRow(&Profile{Name: "Alice", Scores: []int32{95, 87}})
    if err != nil {
        panic(err)
    }
    schema := encoder.Schema()
    view := row.NewRow(schema, data)
    fmt.Println(view.String(schema.FieldIndex("name"))) // Alice
    fmt.Println(view.Array(schema.FieldIndex("scores")).Int32(1)) // 87
}
```

Create and reuse an encoder per struct type and goroutine, or guard it with a mutex.
Row views require the underlying bytes to remain alive and unmodified. Go string reads copy;
nested row, array, and map access uses views into the bytes.

`ToRow` and `FromRow` exchange bare row bytes. `Encode` and `Decode` add an eight-byte schema
hash. Cross-language producers and consumers must agree on the schema, including field types
and nullability. Row Format accepts trusted input only; use object serialization when you need
object graphs or untrusted-input handling. See the [Go Row Format guide](/docs/row-format/go)
for supported types and schema exchange.

## Kotlin JSON Property Inclusion

Kotlin constructor parameters and body properties now follow the configured inclusion rule.
`NON_NULL` omits null values; `NON_EMPTY` also omits empty strings, arrays, collections, maps,
and absent JDK Optional values. A property's `@JsonProperty(include = ...)` overrides the
builder default.

```kotlin
import org.apache.fory.json.annotation.JsonProperty.Include
import org.apache.fory.json.kotlin.ForyJsonKotlin

data class Response(
    val id: Int,
    val name: String? = null,
    val items: List<String>? = null,
)

val json = ForyJsonKotlin.builder().defaultPropertyInclusion(Include.NON_EMPTY).build()
val text = json.toJson(Response(1, items = emptyList())) // {"id":1}
```

Inclusion affects writing. Reading this output restores `items` to its declared default of
null, so the original empty list does not round-trip. Missing constructor parameters use their
defaults or fail when no default exists; missing body properties keep their initializers.
Use an inclusion rule that retains the values your application needs. See the
[Kotlin JSON guide](/docs/json/kotlin#immutable-classes-and-compiler-defaults) for the full rules.

## Java JSON and Serialization Fixes

Java JSON improves floating-point conversion and common read/write paths, including timestamps
with time zones. The release also restores the surrounding serialization contexts after nested
`Externalizable` callbacks and makes exception handling consistent when reading an exhausted
stream.

The complete release notes, including all 13 pull requests, are available on
[GitHub](https://github.com/apache/fory/releases/tag/v1.7.3).

**Full Changelog**: [v1.7.2...v1.7.3](https://github.com/apache/fory/compare/v1.7.2...v1.7.3)
