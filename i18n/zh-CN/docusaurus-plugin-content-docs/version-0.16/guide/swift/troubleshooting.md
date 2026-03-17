---
title: 故障排查
sidebar_position: 11
id: troubleshooting
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

本页介绍常见的 Swift 问题及其调试方法。

## 常见运行时错误

### 错误：`Type not registered: ...`

原因：用户类型尚未在当前 `Fory` 实例上注册。

修复方式：

```swift
fory.register(MyType.self, id: 100)
```

### 错误：`Type mismatch: expected ..., got ...`

原因：各节点之间的注册映射或字段类型信息不一致。

修复方式：

- 确保两端注册的是同一套类型 ID / 名称映射
- 检查字段类型是否兼容

### 错误：`Invalid data: xlang bitmap mismatch`

原因：序列化端和反序列化端使用了不同的 `xlang` 设置。

修复方式：让两端使用一致的 `xlang` 模式。

### 错误：`Invalid data: class version hash mismatch`

原因：在 `compatible=false` 时 schema 发生了变化。

修复方式：

- 对演进中的 schema 启用兼容模式
- 或在 Schema 一致模式下保持严格一致

## 常见宏展开期错误

### 宏错误：`@ForyObject requires explicit types for stored properties`

为存储属性补充显式类型注解。

### 宏错误：`@ForyObject enum associated values cannot have default values`

移除 enum case 关联值上的默认值。

### 宏错误：`Set<...> with Any elements is not supported by @ForyObject yet`

改用 `[Any]` 或显式类型的集合。

### 宏错误：`Dictionary<..., ...> with Any values is only supported for String, Int32, or AnyHashable keys`

将键类型改为 `String`、`Int32` 或 `AnyHashable`，或者避免在 map value 中使用动态 `Any`。

## 调试命令

运行 Swift 测试：

```bash
cd swift
ENABLE_FORY_DEBUG_OUTPUT=1 swift test
```

运行由 Java 驱动的 Swift xlang 测试：

```bash
cd java/fory-core
ENABLE_FORY_DEBUG_OUTPUT=1 FORY_SWIFT_JAVA_CI=1 mvn -T16 test -Dtest=org.apache.fory.xlang.SwiftXlangTest
```
