---
title: 配置
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

本页介绍 `ForyConfig` 以及推荐的运行时预设。

## ForyConfig

`Fory` 通过以下配置项构造：

```swift
public struct ForyConfig {
    public var xlang: Bool
    public var trackRef: Bool
    public var compatible: Bool
}
```

默认配置：

```swift
let fory = Fory() // xlang=true, trackRef=false, compatible=false
```

## 线程模型

`Fory` 是单线程运行时，会在当前调用线程复用一组读写上下文。
建议每个线程复用一个实例，不要在多个线程中并发使用同一个实例。

## 配置项

### `xlang`

控制跨语言协议模式。

- `true`：使用 xlang 编码格式（默认）
- `false`：使用 Swift 原生模式

```swift
let fory = Fory(xlang: true)
```

### `trackRef`

为可跟踪引用的类型启用共享 / 循环引用跟踪。

- `false`：不建立引用表（对无环图或纯值载荷更小、更快）
- `true`：保留类 / 引用对象图的身份语义

```swift
let fory = Fory(xlang: true, trackRef: true)
```

### `compatible`

启用兼容 Schema 模式，以支持跨版本演进。

- `false`：Schema 一致模式（更严格，元信息开销更低）
- `true`：兼容模式（支持新增 / 删除 / 重排字段）

```swift
let fory = Fory(xlang: true, trackRef: false, compatible: true)
```

## 推荐预设

### 本地严格 Schema

```swift
let fory = Fory(xlang: false, trackRef: false, compatible: false)
```

### 跨语言服务载荷

```swift
let fory = Fory(xlang: true, trackRef: false, compatible: true)
```

### 对象图 / 引用身份场景

```swift
let fory = Fory(xlang: true, trackRef: true, compatible: true)
```
