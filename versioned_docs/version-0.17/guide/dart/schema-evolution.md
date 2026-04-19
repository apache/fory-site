---
title: Schema Evolution
sidebar_position: 8
id: dart_schema_evolution
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

Schema evolution lets different versions of your app exchange messages safely — a v2 writer can produce a message that a v1 reader can still decode, and vice versa.

## Two Modes

### Compatible Mode (recommended for evolving services)

Enable this when services may run different versions at the same time — for example, during a rolling deployment or when clients are not updated immediately.

```dart
final fory = Fory(compatible: true);
```

In compatible mode, Fory includes enough field metadata in each message so that the reader can skip unknown fields and use defaults for missing ones. Use stable field IDs (see below) to anchor the schema across changes.

### Schema-Consistent Mode (default)

Both sides must have the same model. Fory validates that the schemas match and will reject messages from a different schema version. Use this when all services are always updated together and you want schema mismatches to be caught as fast errors.

```dart
final fory = Fory(); // compatible: false by default
```

## Setting Up for Evolution

To use compatible mode safely, mark your structs with `@ForyStruct(evolving: true)` (the default) and assign a stable `@ForyField(id: ...)` to every field **before you ship your first payload**:

```dart
@ForyStruct(evolving: true)
class UserProfile {
  UserProfile();

  @ForyField(id: 1)
  String name = '';

  @ForyField(id: 2, nullable: true)
  String? nickname;
}
```

If you add field IDs after payloads are already in production, existing stored messages won't have them and evolution won't work correctly.

## What You Can Safely Change

**Safe changes** (compatible on both sides):

- Add a new optional field with a new, unused field ID.
- Rename a field — as long as the `@ForyField(id: ...)` stays the same.
- Remove a field — the peer will just ignore the missing value and use the Dart default.

**Unsafe changes** (may break existing messages):

- Reuse an existing field ID for a different field.
- Change a field's type to an incompatible type (e.g., `Int32` → `String`).
- Change the registration identity (`id`, `namespace`, or `typeName`) of a type after messages are in production.
- Change a field's logical meaning without changing its ID.

## Cross-Language Notes

Evolution only works when **all** runtimes that exchange messages agree on:

1. The same `compatible` setting.
2. The same type registration identity (numeric ID or `namespace + typeName`).
3. The logical meaning of field IDs.

Test rolling-upgrade scenarios with real round trips before deploying.

## Related Topics

- [Configuration](configuration.md)
- [Field Configuration](field-configuration.md)
- [Cross-Language](cross-language.md)
