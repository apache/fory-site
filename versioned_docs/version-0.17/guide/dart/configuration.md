---
title: Configuration
sidebar_position: 1
id: dart_configuration
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

This page explains the `Fory` constructor options.

## Creating a `Fory` Instance

Pass options directly to the constructor:

```dart
import 'package:fory/fory.dart';

// defaults — good for most single-service scenarios
final fory = Fory();

// cross-language service with schema evolution
final fory = Fory(
  compatible: true,
  maxDepth: 512,
);
```

Create one instance per application and reuse it; there is no benefit to creating a new `Fory` per request.

## Options

### `compatible`

Set to `true` when your service needs to handle payloads from code that may have a different version of the same model — for example, when you deploy services independently and cannot guarantee that both sides update at the same time.

```dart
final fory = Fory(compatible: true);
```

When `compatible: true`:

- Adding or removing fields on one side does not break the other.
- Peers must still use the same `namespace` + `typeName` (or numeric `id`) to identify types.

When `compatible: false` (default):

- Both sides must have exactly the same schema. This is slightly faster and is fine when you deploy Dart-only services or always update all sides together.

### `checkStructVersion`

Relevant only when `compatible: false`. When `true`, Fory validates that the schema version in the payload matches the one the receiver knows about, catching accidental schema mismatches at runtime.

```dart
final fory = Fory(
  compatible: false,
  checkStructVersion: true, // default
);
```

This option has no effect when `compatible: true`.

### `maxDepth`

Limits how deeply nested an object graph can be. Increase this if you have legitimately deep trees; lower it to reject unexpectedly deep payloads fast.

```dart
final fory = Fory(maxDepth: 128);
```

### `maxCollectionSize`

Maximum number of elements accepted in any single list, set, or map field. Prevents runaway memory allocation from malformed messages.

```dart
final fory = Fory(maxCollectionSize: 100000);
```

### `maxBinarySize`

Maximum number of bytes accepted for any single binary blob field.

```dart
final fory = Fory(maxBinarySize: 8 * 1024 * 1024);
```

## Defaults

| Option               | Default   |
| -------------------- | --------- |
| `compatible`         | `false`   |
| `checkStructVersion` | `true`    |
| `maxDepth`           | 256       |
| `maxCollectionSize`  | 1 048 576 |
| `maxBinarySize`      | 64 MiB    |

## Cross-Language Notes

When Fory is used to communicate between services written in different languages:

- Set `compatible: true` on **all** sides if any side needs schema evolution.
- Use the same numeric IDs or `namespace + typeName` pairs on every side.
- Match the `compatible` setting on both the writing and reading side — mismatching modes will fail.

## Related Topics

- [Basic Serialization](basic-serialization.md)
- [Schema Evolution](schema-evolution.md)
- [Cross-Language](cross-language.md)
