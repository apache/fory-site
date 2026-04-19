---
title: Type Registration
sidebar_position: 30
id: type_registration
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

Every struct and enum you serialize must be registered with the `Fory` instance before use. Registration tells Fory how to identify the type in a message and how to encode and decode it.

## Registering Structs

You can identify a struct with a numeric ID or with a name. Pick one strategy and use it consistently across all languages that share the same messages.

### Register by numeric ID

Smaller wire representation. Good when a small team can coordinate IDs.

```ts
const userType = Type.struct(
  { typeId: 1001 },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);
```

The same number must be used in every runtime that reads or writes this type.

### Register by name

Easier to coordinate across teams. Slightly larger metadata in the message.

```ts
const userType = Type.struct(
  { typeName: "example.user" },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);
```

You can also split namespace and type name explicitly:

```ts
const userType = Type.struct(
  { namespace: "example", typeName: "user" },
  {
    id: Type.int64(),
    name: Type.string(),
  },
);
```

> **Do not mix strategies for the same type across runtimes.** If one side uses a numeric ID and the other uses a name, deserialization will fail.

## Registering with Decorators

```ts
@Type.struct({ typeId: 1001 })
class User {
  @Type.int64()
  id!: bigint;

  @Type.string()
  name!: string;
}

const fory = new Fory();
const { serialize, deserialize } = fory.register(User);
```

Decorator-based registration is convenient when you want your TypeScript class declaration and schema to live together.

## Registering Enums

Fory JavaScript supports both plain JavaScript enum-like objects and TypeScript enums.

### JavaScript object enum

```ts
const Color = {
  Red: 1,
  Green: 2,
  Blue: 3,
};

const fory = new Fory();
const colorSerde = fory.register(Type.enum("example.color", Color));
```

### TypeScript enum

```ts
enum Status {
  Pending = "pending",
  Active = "active",
}

const fory = new Fory();
fory.register(Type.enum("example.status", Status));
```

## Registration Scope

Registration is per `Fory` instance. If you create two instances, you need to register schemas in both.

## What `register` Returns

`fory.register(schema)` returns a bound serializer pair:

```ts
const { serialize, deserialize } = fory.register(orderType);

// serialize returns Uint8Array bytes
const bytes = serialize({ id: 1n, total: 99.99 });

// deserialize returns the decoded value
const order = deserialize(bytes);
```

Store and reuse this pair — it is the fast path.

## Field Options

### Nullable fields

If a field can be `null`, mark it explicitly. Passing `null` to a non-nullable field throws.

```ts
Type.string().setNullable(true);
```

### Reference tracking on a field

Needed when the same object instance can appear in multiple fields (see [References](references.md)):

```ts
Type.struct("example.node").setTrackingRef(true);
```

This only has an effect when `new Fory({ ref: true })` is also set.

### Polymorphic fields

Use `Type.any()` when a field can hold different types at runtime:

```ts
const eventType = Type.struct("example.event", {
  kind: Type.string(),
  payload: Type.any(),
});
```

For fine-grained control over how a specific struct field handles its runtime type, you can call `.setDynamic(Dynamic.FALSE)` (always treat as the declared type) or `.setDynamic(Dynamic.TRUE)` (always write the runtime type). The default (`Dynamic.AUTO`) is correct for the vast majority of cases.

## Choosing IDs vs Names

Use **numeric IDs** when:

- you want the smallest possible message size
- your organization can keep IDs stable and globally unique
- services are tightly coordinated

Use **names** when:

- teams define types independently
- schemas are already identified by package/module name
- slightly larger metadata overhead is acceptable

## Cross-Language

For a message to round-trip between JavaScript and another runtime, both sides must use the same identity for a given type: same numeric ID, or same `namespace + typeName`. See [Cross-Language](cross-language.md).

## Related Topics

- [Basic Serialization](basic-serialization.md)
- [Schema Evolution](schema-evolution.md)
- [Cross-Language](cross-language.md)
