---
title: Schema Evolution
sidebar_position: 60
id: schema_evolution
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

Schema evolution lets different versions of your service exchange messages safely — a v2 writer can produce a message a v1 reader still understands, and vice versa.

## Compatible And Schema-Consistent Evolution

- **Compatible mode** (default): writes extra field metadata so readers can skip unknown fields and tolerate missing ones. Good for independent deployments, rolling upgrades, and xlang services.
- **Schema-consistent mode**: more compact, but both sides must have exactly the same schema. Use it only when schemas do not change, or when all services update together.

## Default Compatible Mode

```ts
const fory = new Fory();
```

Use this when:

- services deploy schema changes independently
- older readers may see newer payloads
- newer readers may see older payloads from before a field was added

## Example

Writer schema:

```ts
const writerType = Type.struct(
  { typeId: 1001 },
  {
    name: Type.string(),
    age: Type.int32(),
  },
);
```

Reader schema with fewer fields:

```ts
const readerType = Type.struct(
  { typeId: 1001 },
  {
    name: Type.string(),
  },
);
```

With compatible mode, the reader ignores fields it does not know about, and fills unknown fields with default values.

## Opting Out of Evolution for One Struct

You can disable evolution metadata for a specific struct even inside a `compatible: true` instance:

```ts
const fixedType = Type.struct(
  { typeId: 1002, evolving: false },
  {
    name: Type.string(),
  },
);
```

`evolving: false` produces smaller messages for that struct, but **both the writer and reader must agree** on this setting. If one side writes with `evolving: false` and the other reads expecting compatible metadata, deserialization will fail.

## When to Use Each Mode

|                                 | Schema-consistent | Compatible          |
| ------------------------------- | ----------------- | ------------------- |
| Services always update together | best choice       | works, but wasteful |
| Independent deployments         | will break        | best choice         |
| Smallest possible messages      | best choice       | slightly larger     |
| Rolling upgrades                | risky             | safe                |

## Xlang Requirement

Compatible mode only protects you from schema differences in the _fields_ of a type. You still need the same type identity (same numeric ID or same `typeName`) on every side. See [Xlang Serialization](xlang-serialization.md).

## Related Topics

- [Type Registration](type-registration.md)
- [Xlang Serialization](xlang-serialization.md)
