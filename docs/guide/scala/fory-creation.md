---
title: Fory Creation
sidebar_position: 1
id: fory_creation
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

This page covers Scala-specific requirements for creating Fory instances.

## Basic Setup

When using Fory for Scala serialization, you must:

1. Create the runtime with `ForyScala.builder()`, or install `ForyScala` with `Fory.builder().withModule(ForyScala)`.
2. Register application classes before serialization.

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder()
  .build()
```

## Registering Scala Internal Types

Depending on the object types you serialize, you may need to register some Scala internal types:

```scala
fory.register(Class.forName("scala.Enumeration.Val"))
```

To avoid such registration, you can disable class registration:

```scala
val fory = ForyScala.builder()
  .requireClassRegistration(false)
  .build()
```

> **Note**: Disabling class registration allows deserialization of unknown types. This is more flexible but may be insecure if the classes contain malicious code.

## Reference Tracking

Circular references are common in Scala. Reference tracking should be enabled with `withRefTracking(true)`:

```scala
val fory = ForyScala.builder()
  .withRefTracking(true)
  .build()
```

> **Note**: If you don't enable reference tracking, [StackOverflowError](https://github.com/apache/fory/issues/1032) may occur for some Scala versions when serializing Scala Enumeration.

## Thread Safety

Fory instance creation is not cheap. Instances should be shared between multiple serializations.

### Single-Thread Usage

```scala
import org.apache.fory.Fory
import org.apache.fory.scala.ForyScala

object ForyHolder {
  val fory: Fory = ForyScala.builder()
    .build()
}
```

### Multi-Thread Usage

For multi-threaded applications, use `ThreadSafeFory`:

```scala
import org.apache.fory.ThreadSafeFory
import org.apache.fory.scala.ForyScala

object ForyHolder {
  val fory: ThreadSafeFory = ForyScala.builder()
    .buildThreadSafeFory()
}
```

## Configuration

All configuration options from Fory Java are available. See [Java Configuration](../java/configuration.md) for the complete list.

Common options for Scala:

```scala
import org.apache.fory.scala.ForyScala

val fory = ForyScala.builder()
  // Enable reference tracking for circular references
  .withRefTracking(true)
  // Enable schema evolution support
  .withCompatible(true)
  // Enable async compilation for better startup performance
  .withAsyncCompilation(true)
  .build()
```

## Cross-Language Mode

For Scala xlang or schema IDL generated code, enable xlang and register the
generated schema module:

```scala
import org.apache.fory.scala.ForyScala
import example.ExampleForyModule

val fory = ForyScala.builder()
  .withXlang(true)
  .withCompatible(true)
  .withRefTracking(true)
  .withModule(ExampleForyModule)
  .build()
```

In xlang mode, Scala collections use canonical `list`, `set`, and `map`
payloads instead of Scala factory payloads. Generated optional fields use
`Option[T]`.
