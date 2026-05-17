---
title: Native Mode
sidebar_position: 2
id: native_mode
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

Java native mode is the Java-only wire format selected with `withXlang(false)`. Use it when both
writer and reader are Java/JVM services and you want the broad Java object serialization surface:
JDK serialization hooks, dynamic object graphs, optional class-registration policies, object copy,
and Java-native collection and wrapper handling. Native mode is optimized for the JVM type system,
so it is the right starting point for Java/JVM-only replacements of JDK serialization, Kryo, FST,
Hessian, or Java-only Protocol Buffers payloads.

Use xlang mode, the default, when bytes must be read by other Fory runtimes.

## Create a Native-Mode Runtime

```java
import org.apache.fory.Fory;

Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .withRefTracking(true)
    .build();

byte[] bytes = fory.serialize(object);
Object decoded = fory.deserialize(bytes);
```

Native mode defaults to schema-consistent serialization. Enable compatible mode only when Java
classes evolve independently across writer and reader deployments:

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withCompatible(true)
    .build();
```

## Java Serialization Framework Replacement

Java native mode supports the JDK serialization hooks that are part of many existing Java object
models and is the Fory mode to use when replacing Java-only serialization frameworks:

- `writeObject` and `readObject`
- `writeReplace` and `readResolve`
- `readObjectNoData`
- `Externalizable`

Use native mode when replacing JDK serialization, Kryo, FST, Hessian, or Java-only Protocol
Buffers payloads. Use xlang mode only when the bytes must be read by non-Java Fory runtimes.

```java
public class MyClass implements Serializable {
  private void writeObject(ObjectOutputStream out) throws IOException {
    // Custom serialization logic.
  }

  private void readObject(ObjectInputStream in) throws IOException {
    // Custom deserialization logic.
  }

  private Object writeReplace() {
    return this;
  }

  private Object readResolve() {
    return this;
  }
}
```

When an application must read data that may be either JDK `ObjectOutputStream` bytes or Fory
native-mode bytes, `JavaSerializer.serializedByJDK` can identify the JDK payload before falling
back to Fory:

```java
if (JavaSerializer.serializedByJDK(bytes)) {
  ObjectInputStream objectInputStream = ...;
  return objectInputStream.readObject();
}
return fory.deserialize(bytes);
```

Use this bridge only at boundaries that actually accept both formats. Native-mode Fory payloads
should otherwise be written and read by Fory directly.

## Object Graphs And Reference Tracking

Native mode supports shared references and circular references when reference tracking is enabled:

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefTracking(true)
    .build();
```

Disable reference tracking only for value-shaped graphs where identity and cycles are not part of
the data model.

## Object Copy

Fory can deep-copy Java objects without materializing a byte array. For full copy semantics, custom
copy hooks, and troubleshooting, see [Object Copy](object-copy.md).

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .withRefCopy(true)
    .build();

MyClass copy = fory.copy(original);
```

## Zero-Copy Serialization

Native mode supports out-of-band `BufferObject` payloads for large binary values and primitive
arrays:

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.fory.Fory;
import org.apache.fory.memory.MemoryBuffer;
import org.apache.fory.serializer.BufferObject;

Fory fory = Fory.builder()
    .withXlang(false)
    .build();

List<Object> value = Arrays.asList("str", new byte[1000], new int[100], new double[100]);
Collection<BufferObject> bufferObjects = new ArrayList<>();
byte[] bytes = fory.serialize(value, bufferObject -> !bufferObjects.add(bufferObject));
List<MemoryBuffer> buffers = bufferObjects.stream()
    .map(BufferObject::toBuffer)
    .collect(Collectors.toList());

Object decoded = fory.deserialize(bytes, buffers);
```

The callback returns `false` for buffers that should be sent out-of-band. The main byte array still
contains the root object graph and references the buffers in callback order.

## Registration And Security

Class registration is enabled by default. Register application classes before serializing them:

```java
Fory fory = Fory.builder()
    .withXlang(false)
    .requireClassRegistration(true)
    .build();

fory.register(MyClass.class);
```

`requireClassRegistration(false)` is available for trusted environments that need dynamic class
loading, but deserializing unregistered classes from untrusted input is unsafe. Keep class
registration enabled for service boundaries unless a `TypeChecker` or allow-list policy owns the
trust decision.

## Related Topics

- [Basic Serialization](basic-serialization.md) - Xlang-first Java quickstart
- [Configuration](configuration.md) - Java builder options
- [Schema Evolution](schema-evolution.md) - Compatible and schema-consistent mode
- [Object Copy](object-copy.md) - Deep-copy semantics
- [GraalVM Support](graalvm-support.md) - Native-image platform support
