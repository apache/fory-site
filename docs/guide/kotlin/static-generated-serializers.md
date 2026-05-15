---
title: Static Generated Serializers
sidebar_position: 4
id: static_generated_serializers
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

Use `fory-kotlin-ksp` when Kotlin classes must participate in Fory
cross-language schema serialization. The processor generates Kotlin source
serializers at build time. Those serializers call the existing Fory Java
runtime, including `WriteContext`, `ReadContext`, and `MemoryBuffer`; there is
no Kotlin-only protocol.

Static generated Kotlin serializers are for Kotlin/JVM and Android xlang/schema
mode. They are not Java native object serializers and do not preserve JVM object
graph implementation details such as the exact concrete collection class.

## Add KSP

Add `fory-kotlin` at runtime and run `fory-kotlin-ksp` as a KSP processor in
the module that compiles your `@ForyStruct` Kotlin classes.

```kotlin
plugins {
  id("com.google.devtools.ksp") version "<ksp-version>"
}

dependencies {
  implementation("org.apache.fory:fory-kotlin:<fory-version>")
  ksp("org.apache.fory:fory-kotlin-ksp:<fory-version>")
}
```

For Android, configure KSP in the Android module or library module that owns
the Kotlin model classes.

## Define A Struct

Reuse the Java Fory annotations for schema concepts. Use Kotlin type-use
annotations only when you need to override integer encoding.

```kotlin
import org.apache.fory.annotation.ForyField
import org.apache.fory.annotation.ForyStruct
import org.apache.fory.kotlin.Fixed
import org.apache.fory.kotlin.VarInt

@ForyStruct
data class User(
  @ForyField(id = 1)
  val id: @Fixed UInt,

  @ForyField(id = 2)
  val score: @VarInt Long,

  @ForyField(id = 3)
  val tags: List<String>,
)
```

Use `@ForyField(id = 1)` on constructor properties. `@field:ForyField(id = 1)`
is also accepted for field-backed properties. Do not use `@get:ForyField` or
`@set:ForyField`; accessors are not schema fields and the processor rejects
them.

## Supported Structs

The processor generates serializers for public or internal, concrete,
non-generic classes in named packages. A supported class must have a primary
constructor whose serialized parameters are `val` or `var` properties. `data
class` is the common case, but it is not required.

Internal Kotlin struct classes are supported when KSP runs in the same Kotlin
module that owns the struct. The generated Kotlin serializer is also internal,
so it can call the internal constructor and expose the internal type in
overrides while still producing a JVM class that the Fory Java runtime can load.
Application code outside that Kotlin module still cannot refer to the internal
struct directly, so registration must happen from code that can see the class.

The processor rejects these declarations:

- `private` struct classes.
- local, anonymous, or nested `@ForyStruct` classes.
- Kotlin `object` declarations.
- interfaces, abstract classes, and sealed classes as serializer targets.
- generic `@ForyStruct` classes.
- private constructor properties.
- private or protected primary constructors.

Kotlin default constructor arguments are supported for compatible reads. A
struct can have up to 12 defaulted constructor fields.

## Nullability

Use Kotlin `?` to describe nullable schema positions. Nullability is preserved
inside collections and maps.

```kotlin
@ForyStruct
data class NullabilityExample(
  @ForyField(id = 1)
  val a: List<String>,

  @ForyField(id = 2)
  val b: List<String?>,

  @ForyField(id = 3)
  val c: List<String>?,

  @ForyField(id = 4)
  val d: List<String?>?,
)
```

Do not use Fory `@Nullable` in Kotlin source. The KSP processor rejects it so
the schema is always read from Kotlin source nullability.

## References

Kotlin xlang generated serializers reject every `@Ref` annotation, including
`@Ref(enable = false)`. Generated reads construct Kotlin values through primary
constructors, so they cannot publish partially constructed objects for cyclic
back-references. Use non-cyclic schemas for Kotlin xlang structs.

## Collections

Collection declarations carry schema shape, not JVM implementation identity.
For example, `List<String>` is encoded as `list<string>` and
`Map<String, Int>` is encoded as `map<string, int32>`.

Deserialization only guarantees that the result is assignable to the declared
field type. Fory does not preserve whether the original runtime value was an
`ArrayList`, `LinkedList`, `Collections.unmodifiableList`, synchronized
collection wrapper, or another JVM-specific collection implementation.

Supported collection declarations include Kotlin and Java list, set, and map
types. Mutable collection interface fields are deserialized to mutable
implementations assignable to the declared type. Sorted collections without an
explicit comparator, such as `TreeSet` and `ConcurrentSkipListSet`, are accepted
only for non-null scalar or string elements. Concurrent map declarations are
accepted only with non-null values because JVM concurrent map implementations
reject null entries.

`Set<*>`, `Map<*, T>`, `Map<*, *>`, and raw Java collections are rejected.
`List<*>` and `Map<K, *>` are accepted and use dynamic nullable values.

## Dense Arrays

Kotlin dense primitive and unsigned array fields are supported:

- `BooleanArray`
- `ByteArray`
- `ShortArray`
- `IntArray`
- `LongArray`
- `FloatArray`
- `DoubleArray`
- `UByteArray`
- `UShortArray`
- `UIntArray`
- `ULongArray`

Dense arrays are supported as top-level fields. Nested dense arrays, such as
`List<UIntArray>` or `Map<String, IntArray>`, are rejected.

`ByteArray` is encoded as Fory `binary` unless you explicitly annotate the
field with Java `@ArrayType`.

`@ArrayType` is also supported on top-level `List<T>` fields when `T` is a
non-null boolean or numeric dense-array element type. In that case the field is
encoded as dense `array<T>` schema, and generated reads convert decoded JVM list
elements back to the declared Kotlin element carrier.

## Integer Encoding

Kotlin type-use encoding annotations map to Fory xlang integer encodings:

| Annotation | Valid Kotlin types             |
| ---------- | ------------------------------ |
| `@Fixed`   | `Int`, `Long`, `UInt`, `ULong` |
| `@VarInt`  | `Int`, `Long`, `UInt`, `ULong` |
| `@Tagged`  | `Long`, `ULong`                |

Without an annotation, xlang `Int`, `Long`, `UInt`, and `ULong` use varint
encoding. This is required by xlang mode and is not controlled by Java native
mode numeric compression options.

## Register Classes

Register Kotlin struct classes with the normal Fory Java registration APIs. You
choose the xlang namespace and type name; generated serializers do not choose
IDs or names for you.

```kotlin
val fory = Fory.builder()
  .withXlang(true)
  .requireClassRegistration(true)
  .build()

KotlinSerializers.registerSerializers(fory)
fory.register(User::class.java, "example", "User")
```

`KotlinSerializers.registerSerializers(fory)` installs the Kotlin runtime
serializers used by Kotlin-specific carriers such as unsigned types. The
`fory.register(...)` call registers your xlang schema type name.

Do not register or reference generated serializer classes in application code.
The runtime resolves them from the registered target class.

## Generated Names

The generated serializer is emitted in the same package as the target class.
Its name is `<target>_ForySerializer`. For nested binary names, `$` is encoded
as `_`; source underscores are encoded as `_u_`.

These names are an implementation detail. They matter for diagnostics and
Android shrinking, but user code should only register target classes.

If a Kotlin xlang struct is registered but its KSP generated serializer is
missing, Fory fails with a configuration error. It does not fall back to
runtime reflection for Kotlin schema metadata.

## Android And R8

Android apps should not need user-written keep rules for generated Kotlin
serializers. KSP emits generated consumer R8/ProGuard rules under
`META-INF/proguard/` for the generated serializer constructors used by Fory and
the Kotlin metadata needed to detect required Kotlin generated serializers.

For library modules, package the generated `META-INF/proguard/` resources into
the produced artifact. For Android application modules, make sure your KSP
setup includes generated resources in the minified variant.

See [Android Support](android-support.md) for Android Gradle setup and
release-minified validation guidance.

## Native Object Mode

Kotlin KSP generated serializers are only for xlang/schema mode. They do not
replace Fory Java native object serializers and do not preserve JVM object graph
identity. If you use Fory with `withXlang(false)`, Fory uses the normal Java and
Kotlin runtime serializers instead.

Kotlin/Native and Kotlin/JS are not supported by this module.
