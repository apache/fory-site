---
title: 字段配置
sidebar_position: 5
id: field_configuration
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

本页介绍 Swift 中基于宏的字段配置能力。

## 可用的宏特性

- 在 struct / class / enum 上使用 `@ForyObject`
- 在数值字段上使用 `@ForyField(encoding: ...)`

## `@ForyField(encoding:)` 字段编码配置

使用 `@ForyField` 可以覆盖整数编码策略。

```swift
@ForyObject
struct Metrics: Equatable {
    @ForyField(encoding: .fixed)
    var u32Fixed: UInt32 = 0

    @ForyField(encoding: .tagged)
    var u64Tagged: UInt64 = 0
}
```

### 支持的组合

| Swift 类型 | 支持的编码值                   | 默认编码         |
| ---------- | ------------------------------ | ---------------- |
| `Int32`    | `.varint`, `.fixed`            | `.varint`        |
| `UInt32`   | `.varint`, `.fixed`            | `.varint`        |
| `Int64`    | `.varint`, `.fixed`, `.tagged` | `.varint`        |
| `UInt64`   | `.varint`, `.fixed`, `.tagged` | `.varint`        |
| `Int`      | `.varint`, `.fixed`, `.tagged` | `.varint`        |
| `UInt`     | `.varint`, `.fixed`, `.tagged` | `.varint`        |

编译期校验会拒绝不支持的组合（例如 `Int32` 配合 `.tagged`）。

## `@ForyObject` 要求

### struct 和 class 字段

- 存储属性必须显式声明类型
- 计算属性会被忽略
- 静态 / 类属性会被忽略

### class 额外要求

标注 `@ForyObject` 的类必须提供 `required init()` 以支持默认构造。

```swift
@ForyObject
final class Node {
    var value: Int32 = 0
    var next: Node? = nil

    required init() {}
}
```

## 宏类型中的动态 Any 字段

`@ForyObject` 支持动态字段以及嵌套容器：

- 动态值类型：`Any`、`AnyObject`、`any Serializer`
- `AnyHashable`
- `[Any]`
- `[String: Any]`
- `[Int32: Any]`
- 动态键值映射：`[AnyHashable: Any]`

当前限制：

- 仅当 `K` 为 `String`、`Int32` 或 `AnyHashable` 时，才支持 `Dictionary<K, Any>`
