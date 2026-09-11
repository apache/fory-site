---
slug: fory_1_7_2_release
title: Fory v1.7.2 Released
description: "Fory 1.7.2 adds empty-property filtering for Java JSON and fixes Go thread-safe type registration across garbage collections."
authors: [chaokunyang]
tags: [fory, java, json, go, javascript]
---

The Apache Fory team is pleased to announce the 1.7.2 release. This patch release adds JSON
property filtering and fixes serialization issues in Go, Java, and JavaScript. See
[Getting Started](https://fory.apache.org/docs/start/) for installation instructions.

## Highlights

- Java JSON can omit empty object properties.
- Go thread-safe serialization retains type registrations after garbage collection clears cached instances.
- Java compatible metadata cache hits skip redundant local metadata lookups.

## Omit Empty JSON Properties

Fory JSON 1.7.2 adds `NON_EMPTY` inclusion, allowing applications to leave empty properties out
of JSON objects. Enable it for all properties with the builder:

```java
import java.util.Collections;
import java.util.List;
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonProperty.Include;

public final class Response {
  public String message = "";
  public List<String> items = Collections.emptyList();
  public int count = 0;
}

ForyJson json = ForyJson.builder().defaultPropertyInclusion(Include.NON_EMPTY).build();

assert json.toJson(new Response()).equals("{\"count\":0}");
```

The empty `message` and `items` properties are omitted, while `count` remains present.
`NON_EMPTY` skips null values, zero-length strings and other `CharSequence` values, empty Java
arrays, collections and maps, and absent JDK Optional values. Numeric zero and `false` are
retained. Filtering is shallow: a nonempty list containing null or an empty list is still included.

To apply the rule to individual properties, use `@JsonProperty`:

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonProperty;

public final class Result {
  @JsonProperty(include = JsonProperty.Include.NON_EMPTY)
  public java.util.List<String> items;

  @JsonProperty(include = JsonProperty.Include.ALWAYS)
  public String nextPage;
}

ForyJson json = ForyJson.builder().build();

assert json.toJson(new Result()).equals("{\"nextPage\":null}");
```

Explicit property inclusion overrides the builder default. Here, `items` is omitted and
`nextPage` is written even when null. The default remains `NON_NULL`; existing applications opt
into empty-property filtering. `defaultPropertyInclusion` and `writeNullFields` change the same
setting, so the last call wins.

Inclusion affects object-property writing only. It does not filter root values, collection
elements, or Map entries, and it checks the logical value before calling a custom codec.
Kotlin and Scala retain their reconstruction rules for constructor parameters; see the
[Kotlin guide](/docs/json/kotlin#immutable-classes-and-compiler-defaults) and
[Scala guide](/docs/json/scala). Full details are in the
[JSON annotations guide](/docs/json/annotations#jsonproperty) and
[builder configuration](/docs/json/object-mapping#builder-configuration).

## Go Thread-Safe Type Registration

The Go `threadsafe` wrapper now preserves registrations when garbage collection reclaims cached
instances. Register every type before the first serialization or deserialization operation:
that first operation freezes registration, even if it fails. Later registration attempts return
an error. For custom per-instance initialization, use `NewWithFactory`, returning a fresh,
identically configured instance on each call. See the
[Go thread-safety guide](/docs/object-serialization/go/thread-safety).

## Features and Improvements

- Skip redundant Java compatible metadata lookups on cache hits —
  [@chaokunyang](https://github.com/chaokunyang), [#4023](https://github.com/apache/fory/pull/4023).
- Add Java assertions for non-ASCII metadata encoding failures —
  [@LouisLou2](https://github.com/LouisLou2), [#4025](https://github.com/apache/fory/pull/4025).
- Add JSON empty-property filtering —
  [@chaokunyang](https://github.com/chaokunyang), [#4028](https://github.com/apache/fory/pull/4028).

## Bug Fixes

- Clear the JavaScript metadata string disposal list on writer reset —
  [@ayush00git](https://github.com/ayush00git), [#4015](https://github.com/apache/fory/pull/4015).
- Allow JavaScript user type ID `0` in struct, extension, and enum factories —
  [@ayush00git](https://github.com/ayush00git), [#4014](https://github.com/apache/fory/pull/4014).
- Preserve the TypeDef root kind for factory-created custom serializers —
  [@Pigsy-Monk](https://github.com/Pigsy-Monk), [#4022](https://github.com/apache/fory/pull/4022).
- Correct JVM notices and C# license headers —
  [@chaokunyang](https://github.com/chaokunyang), [#4026](https://github.com/apache/fory/pull/4026).
- Respect declared element types when registering JavaScript root containers —
  [@ayush00git](https://github.com/ayush00git), [#4013](https://github.com/apache/fory/pull/4013).
- Fix Go thread-safe pooling and remove Python lazy imports —
  [@chaokunyang](https://github.com/chaokunyang), [#4027](https://github.com/apache/fory/pull/4027).

## Other Improvements

- Update JavaScript browserslist from 4.28.2 to 4.28.8 —
  [@dependabot](https://github.com/apps/dependabot), [#4016](https://github.com/apache/fory/pull/4016).

**Full Changelog**: [v1.7.1...v1.7.2](https://github.com/apache/fory/compare/v1.7.1...v1.7.2)
