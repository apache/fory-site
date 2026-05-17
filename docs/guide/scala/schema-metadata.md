---
title: Schema Metadata
sidebar_position: 3
id: schema_metadata
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

Scala schema metadata is used by schema IDL generated code and Scala 3 macro-derived xlang
serializers. Metadata is declared with the shared JVM Fory annotations and Scala compile-time type
information.

## Struct Fields

Schema messages can use `@ForyStruct` and `@ForyField(id = N)`:

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct}
import org.apache.fory.scala.ForySerializer

@ForyStruct
final case class Person(
  @ForyField(id = 1) name: String,
  @ForyField(id = 2) email: Option[String]
) derives ForySerializer
```

Schema `optional T` fields are represented as `Option[T]`.

## Reference Tracking

Reference tracking uses the shared JVM `@Ref` annotation. Use field or constructor-parameter
`@Ref` for a top-level `ref T` field, and type-use `T @Ref` for nested collection or map payloads:

```scala
import org.apache.fory.annotation.{ForyField, ForyStruct, Ref}

@ForyStruct
final class Node() derives ForySerializer {
  @ForyField(id = 1)
  var children: List[Node @Ref] = List.empty

  @Ref
  @ForyField(id = 2)
  var parent: Option[Node] = None
}
```

## Enum IDs

IDL enums generate Scala 3 enums. Stable Fory enum IDs come from case-level `@ForyEnumId` metadata:

```scala
import org.apache.fory.annotation.ForyEnumId

enum Status {
  @ForyEnumId(0)
  case Unknown

  @ForyEnumId(1)
  case Ok
}
```

Generated registration uses `ScalaSerializers.registerEnum(...)` so these stable IDs are used in
xlang mode.

## Unions

IDL unions generate Scala 3 ADT enums with `@ForyUnion` and `@ForyCase` metadata:

```scala
import org.apache.fory.annotation.{ForyCase, ForyUnion, UInt32Type}
import org.apache.fory.config.Int32Encoding
import org.apache.fory.scala.ForySerializer

@ForyUnion
enum SearchTarget derives ForySerializer {
  @ForyCase(id = 0)
  case UnknownCase(caseId: Int, value: Any)

  @ForyCase(id = 1)
  case UserCase(value: User)

  @ForyCase(id = 2)
  case FixedIdCase(value: Long @UInt32Type(encoding = Int32Encoding.FIXED))
}
```

Schema-defined union cases must use positive IDs. Case ID `0` is reserved for the unknown-case
carrier used when a reader sees a newer positive case ID.

## Generated Metadata Source

The Scala macro builds descriptor metadata from Scala compile-time types, including nested
generics, `Option`, arrays, scalar encoding annotations, nullability, and `@Ref` metadata. Java
reflection is not the source of truth for generated Scala metadata.

## Related Topics

- [Schema IDL And Xlang](schema-idl.md)
- [Configuration](configuration.md)
- [Default Values](default-values.md)
