---
slug: fory_1_7_6_release
title: Fory v1.7.6 Released
description: "Fory 1.7.6 adds optional validation for missing JSON constructor properties and retains properties without defaults under NON_DEFAULT inclusion."
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala]
---

Apache Fory 1.7.6 is now available. This release improves JSON constructor-property handling
for Java, Scala, and Kotlin. See [Getting Started](/docs/start/) for installation instructions.

## Highlights

- Opt in to rejecting missing required constructor properties with `failOnMissingRequiredProperties(true)`.
- `NON_DEFAULT` inclusion retains properties without defaults, including required constructor properties.

## Required Constructor Properties

Enable `failOnMissingRequiredProperties(true)` when input must include ordinary constructor
properties that have no declared default. For example, with a Java record:

```java
import org.apache.fory.json.ForyJson;

record Request(int id) {}

ForyJson json = ForyJson.builder()
    .failOnMissingRequiredProperties(true)
    .build();

Request request = json.fromJson("{\"id\":42}", Request.class);
json.fromJson("{}", Request.class); // Fails because id is missing.
```

The option is disabled by default. It supports Java records and property-based `JsonCreator`
models, Scala case classes, and Kotlin constructor models, including nested objects. Declared
language defaults and existing optional or container defaults remain available. Explicit null
continues to follow the property's type and nullability rules.

For Kotlin, a nullable constructor property without a default must still appear when this option
is enabled, although its value may be null. The option does not change writing: if an inclusion
policy omits a required property, a strict reader can reject that output.

See [required constructor properties](/docs/json/object-mapping#required-constructor-properties)
and the [Kotlin](/docs/json/kotlin/) and [Scala](/docs/json/scala/) guides for details.

## Retaining Properties Without Defaults

Field-level and class-level `NON_DEFAULT` inclusion now retain properties without defaults,
including null, zero, false, and empty values. For example, a Scala case class can omit its
declared default while retaining a required identifier:

```scala
import org.apache.fory.json.annotation.JsonInclude
import org.apache.fory.json.annotation.JsonProperty.Include
import org.apache.fory.json.scala.ForyJsonScala

@JsonInclude(Include.NON_DEFAULT)
case class Request(id: Int, retries: Int = 3)

val json = ForyJsonScala.builder().build()
json.toJson(Request(0)) // {"id":0}
json.toJson(Request(0, retries = 1)) // {"id":0,"retries":1}
```

This also applies to Java constructor properties without defaults and Kotlin required
constructor or `lateinit` properties. Supported default comparisons keep their existing
requirements. In Kotlin, comparing a defaulted property still requires a valid reference object;
a constructor with required parameters cannot supply one without those arguments. Global
`NON_DEFAULT` remains unsupported.

See [default omission](/docs/json/annotations#jsoninclude-and-default-omission) for supported
models and configuration examples.

The complete release notes are available on
[GitHub](https://github.com/apache/fory/releases/tag/v1.7.6).

**Full Changelog**: [v1.7.5...v1.7.6](https://github.com/apache/fory/compare/v1.7.5...v1.7.6)
