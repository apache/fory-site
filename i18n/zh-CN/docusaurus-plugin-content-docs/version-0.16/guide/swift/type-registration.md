---
title: 类型注册
sidebar_position: 3
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

本页介绍用户自定义类型的注册 API。

## 为什么必须注册

用户类型（`struct`、`class`、enum / union、ext 类型）在序列化 / 反序列化前必须先注册。

如果缺少注册，反序列化会失败并报出：

- `Type not registered: ...` 之类的错误

## 按数值 ID 注册

在序列化端和反序列化端之间使用同一组稳定 ID。

```swift
@ForyObject
struct User {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
fory.register(User.self, id: 1)
```

## 按名称注册

### 全限定名称

```swift
try fory.register(User.self, name: "com.example.User")
```

`name` 会按 `.` 拆分为：

- 命名空间：`com.example`
- 类型名：`User`

### 显式命名空间 + 名称

```swift
try fory.register(User.self, namespace: "com.example", name: "User")
```

## 一致性规则

在各个通信端之间保持注册映射一致：

- ID 模式：同一类型在所有节点上使用相同数值 ID
- 名称模式：同一类型在所有节点上使用相同命名空间与类型名
- 不要在不同服务中对同一逻辑类型混用 ID 映射和名称映射

## 动态类型与注册

当动态值（`Any`、`AnyObject`、`any Serializer`）中包含用户自定义类型时，这些具体运行时类型仍然需要注册。
