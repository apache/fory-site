---
slug: fory_1_7_5_release
title: Fory v1.7.5 Released
description: "Fory 1.7.5 adds flexible JSON output options, improves Scala and Kotlin JSON support, and expands Python collection support."
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala, python]
---

Apache Fory 1.7.5 is now available. This release includes 15 pull requests from 4 contributors,
with more control over JSON output, improved Scala and Kotlin JSON handling, and broader Python
collection support. See [Getting Started](/docs/start/) for installation instructions.

## Highlights

- JSON output supports per-call pretty printing, non-ASCII escaping, configurable byte-array formats including Base16, and explicit default-value omission.
- Scala and Kotlin JSON handling improves codec coverage and missing-field defaults, with additional GraalVM fixes for Java JSON accessors.
- Python adds collection-subclass support and fixes named-tuple and temporal-array-buffer handling.

## JSON Output Options

Fory JSON is a Java JSON serialization framework with optional Kotlin and Scala modules.
Applications can now choose pretty output for individual calls while reusing the same instance:

```java
import java.util.Collections;
import org.apache.fory.json.ForyJson;

ForyJson json = ForyJson.builder().build();
String pretty = json.toPrettyJson(Collections.singletonMap("name", "Fory"));
byte[] prettyBytes = json.toPrettyJsonBytes(Collections.singletonMap("name", "Fory"));
String compact = json.toJson(Collections.singletonMap("name", "Fory"));
```

`escapeNonAscii(true)` writes non-ASCII string values and names as JSON Unicode escapes.
The builder's `byteArrayFormat` selects Base64 strings, Base16 strings, or signed numeric arrays
for ordinary byte arrays, including nested values. Property-level `JsonByteArray` annotations
can override that default:

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonByteArray;

ForyJson hexJson = ForyJson.builder()
    .byteArrayFormat(JsonByteArray.Format.BASE16)
    .build();
String text = hexJson.toJson(new byte[] {1, -2, 3}); // "\"01fe03\""
byte[] bytes = hexJson.fromJson(text, byte[].class);
```

Default-value omission is available through explicit `NON_DEFAULT` policies on a property or
its class with `JsonProperty` or `JsonInclude`. Applications must authorize only defaults that
are stable, safe to evaluate, and restored consistently when a field is missing. Global
`NON_DEFAULT` is rejected. Scala `NON_EMPTY` also recognizes `None` and supported empty strict
collections and maps.

See [JSON object mapping](/docs/json/object-mapping/) for output options and
[default omission](/docs/json/annotations#jsoninclude-and-default-omission) for supported models
and configuration examples.

## Scala and Kotlin JSON Support

Scala gains broader support for generic case classes, `Unit`, enumeration type tokens, and
explicit string codecs for sealed hierarchies of singleton cases. Scala and Kotlin also refine
missing-field defaults: Scala uses declared constructor defaults or type defaults; Kotlin uses
declared defaults first, then zero or `false` for non-null numeric and Boolean parameters, or
null for nullable parameters. Other non-null Kotlin parameters remain required.

See the [Scala](/docs/json/scala/) and [Kotlin](/docs/json/kotlin/) guides for precise type and
null behavior. This release also fixes Java JSON accessor handling in GraalVM Native Image.

## Python Collections and Buffers

Xlang mode accepts `Mapping`, `Sequence`, and `Set` implementations, including mutable variants,
and restores their values as built-in `dict`, `list`, and `set` objects. Python native mode
preserves registered `list`, `dict`, and `set` subclasses together with their instance state.

Native mode also fixes named-tuple reconstruction and supports out-of-band buffers for NumPy
datetime and timedelta arrays and Pandas datetime columns and indexes. See
[Python collection interfaces](/docs/object-serialization/python/basic-serialization#collection-interfaces),
[native mode](/docs/object-serialization/python/native/), and
[out-of-band serialization](/docs/object-serialization/python/out-of-band/) for examples.

The complete release notes are available on
[GitHub](https://github.com/apache/fory/releases/tag/v1.7.5).

**Full Changelog**: [v1.7.4...v1.7.5](https://github.com/apache/fory/compare/v1.7.4...v1.7.5)
