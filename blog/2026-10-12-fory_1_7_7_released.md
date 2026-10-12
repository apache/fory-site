---
slug: fory_1_7_7_release
title: Fory v1.7.7 Released
description: "Fory 1.7.7 adds configurable JSON null handling and fixes object mapping, schema compiler output, and release archive reproducibility."
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala]
---

Apache Fory 1.7.7 is now available. This release adds read-side JSON null handling and improves
serialization performance, object mapping, and generated code. See [Getting Started](/docs/start/)
for installation instructions.

## Highlights

- Configure how JSON readers handle null properties, collection elements, and map values.
- Reduce JSON codec generation cost, improve string writing, and reduce C++ serialization overhead.
- Fix JSON object field semantics, compatible field-type validation, and schema compiler output.
- Make Java and Kotlin release archives reproducible and improve license and notice packaging.

## JSON Null Handling

Use `onNullRead` to control explicit null property values and `onContentNullRead` to control null
array or collection elements and map values. Both default to `SET`, which retains the existing
decoding behavior. `SKIP` omits that input occurrence; `FAIL` rejects it.

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonProperty;
import org.apache.fory.json.annotation.JsonProperty.NullHandling;

public final class Response {
  @JsonProperty(onNullRead = NullHandling.SKIP, onContentNullRead = NullHandling.SKIP)
  public java.util.List<String> seats = java.util.List.of("default");
}

ForyJson json = ForyJson.builder().build();
Response first = json.fromJson("{\"seats\":null}", Response.class);
Response second = json.fromJson("{\"seats\":[null,\"a\"]}", Response.class);
// first.seats is ["default"]; second.seats is ["a"].
```

The same settings are available on the builder. Property annotations override the corresponding
global setting. Content overrides apply to immediate elements or values; nested containers use
their applicable settings. These options affect explicit JSON nulls and do not change writing
or a root value's null behavior.

Kotlin and Scala support these settings through their JSON builders. Skipping a null property
can retain constructor defaults; required-property checks still apply. See
[read-side null handling](/docs/json/annotations#read-side-null-handling),
[Kotlin](/docs/json/kotlin/), and [Scala](/docs/json/scala/) for details.

## Correctness and Performance

JSON object mapping now restores eligible ordinary final fields and consistently selects a
subclass field when it hides a superclass field. Writing a subclass through a concrete base type
includes the subclass's mapped properties; restoring the subtype still requires declared subtype
mapping or a custom codec. See [object mapping](/docs/json/object-mapping/).

Schema compiler fixes cover Java, Kotlin, Scala, Python, and TypeScript output. Generated union
carriers use an alternate name when a schema case is named `Unknown` or Swift's `unknown`,
preserving the schema case name. See [generated code](/docs/compiler/generated-code/).

Performance work reduces JSON codec generation cost, avoids unnecessary `NON_EMPTY` checks for
final property types, improves escaped-string writing, and avoids a temporary vector when
serializing C++ `std::forward_list`.

The complete release notes are available on
[GitHub](https://github.com/apache/fory/releases/tag/v1.7.7).

**Full Changelog**: [v1.7.6...v1.7.7](https://github.com/apache/fory/compare/v1.7.6...v1.7.7)
