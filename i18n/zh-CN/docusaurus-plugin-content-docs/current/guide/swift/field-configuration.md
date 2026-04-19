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

本页介绍 Swift 宏层面的字段配置。

## 可用的宏属性

- 作用于 struct/class/enum 的 `@ForyObject`
- 作用于数值字段的 `@ForyField(encoding: ...)`

## `@ForyField(encoding:)`

用 `@ForyField` 覆盖整数编码策略。

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

| Swift 类型 | 支持的编码值 | 默认编码 |
| ---------- | ------------ | -------- |
| `Int32` | `.varint`、`.fixed` | `.varint` |
| `UInt32` | `.varint`、`.fixed` | `.varint` |
| `Int64` | `.varint`、`.fixed`、`.tagged` | `.varint` |
| `UInt64` | `.varint`、`.fixed`、`.tagged` | `.varint` |
| `Int` | `.varint`、`.fixed`、`.tagged` | `.varint` |
| `UInt` | `.varint`、`.fixed`、`.tagged` | `.varint` |

编译期会拒绝不受支持的组合，例如给 `Int32` 使用 `.tagged`。

## `@ForyObject` 的要求

### struct 和 class 字段

- 存储属性必须声明显式类型
- 计算属性会被忽略
- 静态属性和类属性会被忽略

### 类类型要求

被 `@ForyObject` 标记的类必须提供 `required init()` 以支持默认构造。

```swift
@ForyObject
final class Node {
    var value: Int32 = 0
    var next: Node? = nil

    required init() {}
}
```

## 宏类型中的动态 Any 字段

`@ForyObject` 支持以下动态字段和嵌套容器：

- `Any`、`AnyObject`、`any Serializer`
- `AnyHashable`
- `[Any]`
- `[String: Any]`
- `[Int32: Any]`
- `[AnyHashable: Any]`

当前限制：

- `Dictionary<K, Any>` 仅在 `K` 为 `String`、`Int32` 或 `AnyHashable` 时受支持
