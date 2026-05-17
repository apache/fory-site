---
title: Configuration
sidebar_position: 2
id: configuration
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

This page covers `Config` and recommended runtime presets.

## Config

`Fory` is configured with:

```swift
public struct Config {
  public let trackRef: Bool
  public let compatible: Bool
  public let checkClassVersion: Bool
  public let maxCollectionSize: Int
  public let maxBinarySize: Int
  public let maxDepth: Int
}
```

Default configuration:

```swift
let fory = Fory() // ref=false, compatible=true
```

Swift supports the xlang wire format only, so there is no `xlang` option in
`Config` or the `Fory` initializer.

## Threading

`Fory` is single-threaded and optimized to reuse one read/write context pair on the calling thread.
Reuse one instance per thread and do not use the same instance concurrently.

## Options

### `trackRef`

Enables shared/circular reference tracking for reference-trackable types.

- `false`: No reference table (smaller/faster for acyclic or value-only graphs)
- `true`: Preserve object identity for class/reference graphs

```swift
let fory = Fory(ref: true)
```

### `compatible`

Enables compatible schema mode for evolution across versions.

- `false`: Schema-consistent mode (stricter, lower metadata overhead)
- `true`: Compatible mode (supports add/remove/reorder fields)

```swift
let fory = Fory()
```

### `checkClassVersion`

Controls class-version validation in schema-consistent mode. When omitted, it
defaults to `true` when `compatible=false` and `false` when `compatible=true`.

```swift
let fory = Fory(compatible: false, checkClassVersion: true)
```

### Size and Depth Limits

`maxCollectionSize`, `maxBinarySize`, and `maxDepth` bound decoded payload size
and nesting depth.

```swift
let fory = Fory(maxCollectionSize: 1_000_000, maxBinarySize: 64 * 1024 * 1024, maxDepth: 5)
```

## Recommended Presets

### Local, strict schema

```swift
let fory = Fory(ref: false, compatible: false)
```

### Cross-language service payloads

```swift
let fory = Fory()
```

### Graph/object identity workloads

```swift
let fory = Fory(ref: true)
```

## Security

Security-related configuration:

- Register only the expected generated models before deserializing untrusted payloads.
- Use `checkClassVersion` with `compatible: false` when exact schema matching is required.
- Set `maxCollectionSize`, `maxBinarySize`, and `maxDepth` for the largest payload shape your
  service accepts.
