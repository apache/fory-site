---
title: JavaScript Serialization Guide
sidebar_position: 0
id: index
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

Apache Fory JavaScript lets you serialize JavaScript and TypeScript objects to bytes and deserialize them back — including across services written in Java, Python, Go, Rust, Swift, and other Fory-supported languages.

## Why Fory JavaScript?

- **Cross-language**: serialize in JavaScript, deserialize in Java, Python, Go, and more without writing glue code
- **Fast**: serializer code is generated and cached the first time you register a schema, not on every call
- **Reference-aware**: shared references and circular object graphs are supported when enabled
- **Explicit schemas**: field types, nullability, and polymorphism are declared once with `Type.*` builders or TypeScript decorators
- **Safe defaults**: configurable depth, binary size, and collection size limits reject unexpectedly large or deep payloads
- **Modern types**: `bigint`, typed arrays, `Map`, `Set`, `Date`, `float16`, and `bfloat16` are supported

## Installation

Install the JavaScript packages from npm:

```bash
npm install @apache-fory/core
```

Optional Node.js string fast-path support is available through `@apache-fory/hps`:

```bash
npm install @apache-fory/core @apache-fory/hps
```

`@apache-fory/hps` depends on Node.js 20+ and is optional. If it is unavailable, Fory still works correctly; omit `hps` from the configuration.

## Quick Start

```ts
import Fory, { Type } from "@apache-fory/core";

const userType = Type.struct(
  { typeName: "example.user" },
  {
    id: Type.int64(),
    name: Type.string(),
    age: Type.int32(),
  },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(userType);

const bytes = serialize({
  id: 1n,
  name: "Alice",
  age: 30,
});

const user = deserialize(bytes);
console.log(user);
// { id: 1n, name: 'Alice', age: 30 }
```

## How it works

Fory is schema-driven. You describe the shape of your data once with `Type.*` builders (or TypeScript decorators), then call `fory.register(schema)`. This returns a `{ serialize, deserialize }` pair that is fast to call repeatedly.

```ts
// 1. Define the schema
const personType = Type.struct("example.person", {
  name: Type.string(),
  email: Type.string().setNullable(true),
});

// 2. Register once
const fory = new Fory();
const { serialize, deserialize } = fory.register(personType);

// 3. Use as many times as needed
const bytes = serialize({ name: "Alice", email: null });
const person = deserialize(bytes);
```

Create one `Fory` instance per application and reuse it — creating a new one for every request wastes the work of schema registration.

## Configuration

```ts
import Fory from "@apache-fory/core";
import hps from "@apache-fory/hps";

const fory = new Fory({
  ref: true,
  compatible: true,
  maxDepth: 100,
  maxBinarySize: 64 * 1024 * 1024,
  maxCollectionSize: 1_000_000,
  hps,
});
```

| Option                     | Default     | Description                                                                           |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `ref`                      | `false`     | Enable reference tracking for shared or circular object graphs                        |
| `compatible`               | `false`     | Allow field additions/removals without breaking existing messages                     |
| `maxDepth`                 | `50`        | Maximum nesting depth. Must be `>= 2`. Increase for deeply nested structures          |
| `maxBinarySize`            | 64 MiB      | Maximum bytes accepted for any single binary field                                    |
| `maxCollectionSize`        | `1_000_000` | Maximum elements accepted in any list, set, or map                                    |
| `useSliceString`           | `false`     | Optional string-reading optimization for Node.js. Leave at default unless benchmarked |
| `hps`                      | unset       | Optional fast string helper from `@apache-fory/hps` (Node.js 20+)                     |
| `hooks.afterCodeGenerated` | unset       | Callback to inspect the generated serializer code — useful for debugging              |

## Documentation

| Topic                                         | Description                                             |
| --------------------------------------------- | ------------------------------------------------------- |
| [Basic Serialization](basic-serialization.md) | Core APIs and everyday usage                            |
| [Type Registration](type-registration.md)     | Numeric IDs, names, decorators, and schema registration |
| [Supported Types](supported-types.md)         | Primitive, collection, time, enum, and struct mappings  |
| [References](references.md)                   | Shared references and circular object graphs            |
| [Schema Evolution](schema-evolution.md)       | Compatible mode and evolving structs                    |
| [Cross-Language](cross-language.md)           | Interop guidance and mapping rules                      |
| [Troubleshooting](troubleshooting.md)         | Common issues, limits, and debugging tips               |

## Related Resources

- [Xlang Serialization Specification](../../specification/xlang_serialization_spec.md)
- [Cross-Language Type Mapping](../../specification/xlang_type_mapping.md)
