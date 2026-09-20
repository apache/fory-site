---
slug: fory_1_7_4_release
title: Fory v1.7.4 Released
description: "Fory 1.7.4 improves JSON performance, adds runtime Kotlin JSON type tokens, and fixes Java serialization edge cases."
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala]
---

Apache Fory 1.7.4 is now available. This release includes 9 pull requests from 2 contributors,
with JSON performance improvements, runtime Kotlin type tokens for framework integration, and
Java serialization fixes. See [Getting Started](/docs/start/) for installation instructions.

## Highlights

- Improve Java JSON reading and writing and Scala collection codecs.
- Build Kotlin JSON type tokens from a runtime `KType`, preserving nested generic arguments and nullability.
- Preserve declared registered field types during compatible Java deserialization, and validate null values in non-nullable fields.
- Fix Unsafe address access under JDK 8 on ARM.

## Runtime Kotlin JSON Type Tokens

Framework callbacks often discover a request or response type at runtime. In 1.7.4,
`jsonTypeRef<Any?>(kType)` lets an adapter retain that Kotlin declaration for both JSON reading
and writing. The supplied `KType` determines the JSON type; `Any?` is only the callback's static
view of the value.

For example, retain the response type of a Kotlin controller method:

```kotlin
import java.io.OutputStream
import kotlin.reflect.jvm.kotlinFunction
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

data class Employee(val id: Long, val name: String)
data class Response<T>(val flag: Boolean, val data: T? = null, val msg: String? = null)

class EmployeeController {
  fun employees(): Response<List<Employee>> =
    Response(true, listOf(Employee(1, "Alice")))
}

val json = ForyJsonKotlin.builder().build()
val method = EmployeeController::class.java.getMethod("employees")
val responseType = jsonTypeRef<Any?>(requireNotNull(method.kotlinFunction).returnType)

fun writeResponse(value: Any?, output: OutputStream) {
  json.writeJsonTo(value, responseType, output)
}

fun readResponse(bytes: ByteArray): Any? = json.fromJson(bytes, responseType)
```

Discover each type once and reuse its token. Kotlin reflection requires the application's
`kotlin-reflect` dependency, with a version matching Kotlin. For wrapped HTTP responses,
select the body type before creating the token. Unresolved type parameters, star projections,
and contravariant projections remain unsupported.

See [JSON framework integration](/docs/json/integration#kotlin-integration) for dependency
setup, request conversion, and Spring MVC adapter requirements.

## JSON Performance

This release improves Java JSON scalar, string, array, and temporal read/write paths, along with
Scala collection codecs. Applications use the same JSON APIs to benefit from these changes.
The [JSON guide](/docs/json/) links to the existing benchmark reports and their measurement
conditions.

## Java Serialization Fixes

Compatible deserialization now preserves registered declared field types. For timestamp fields,
this includes retaining a declared `java.util.Date` or `java.sql.Date` rather than assigning an
`Instant`. Dynamic xlang timestamp values still use `Instant`. See the
[timestamp mapping](/docs/object-serialization/java/basic-serialization#timestamps) for precision
and Java native-mode behavior.

Serialization also rejects null values in fields whose encoding has neither a null nor a
reference flag, with an error identifying the field. Mark nullable fields with `@Nullable`;
for Java-only serialization, `Fory.builder().withXlang(false)` makes unannotated reference fields
nullable by default. See [schema metadata](/docs/object-serialization/java/schema-metadata).

The release also fixes JDK 8 ARM Unsafe address access and restores the dataclasses and gRPC
license attributions in the distribution.

The complete release notes are available on
[GitHub](https://github.com/apache/fory/releases/tag/v1.7.4).

**Full Changelog**: [v1.7.3...v1.7.4](https://github.com/apache/fory/compare/v1.7.3...v1.7.4)
