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

本页介绍 Apache Fory™ C# 的 `ForyBuilder` 选项以及默认配置值。

## 构建运行时

```csharp
using Apache.Fory;

Fory fory = Fory.Builder().Build();
ThreadSafeFory threadSafe = Fory.Builder().BuildThreadSafe();
```

## 默认配置

`Fory.Builder().Build()` 默认使用以下配置：

| 选项                 | 默认值  | 说明                                           |
| -------------------- | ------- | ---------------------------------------------- |
| `Xlang`              | `true`  | 跨语言协议模式                                 |
| `TrackRef`           | `false` | 禁用引用跟踪                                   |
| `Compatible`         | `false` | Schema 一致模式（不写入演进元数据）            |
| `CheckStructVersion` | `false` | 禁用结构体 schema 哈希校验                     |
| `MaxDepth`           | `20`    | 动态对象图的最大嵌套深度                       |

## 构建器选项

### `Xlang(bool enabled = true)` 选项

控制是否启用跨语言模式。

```csharp
Fory fory = Fory.Builder()
    .Xlang(true)
    .Build();
```

### `TrackRef(bool enabled = false)` 选项

为共享或循环对象图启用引用跟踪。

```csharp
Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
```

### `Compatible(bool enabled = false)` 选项

启用 Schema 演进模式。

```csharp
Fory fory = Fory.Builder()
    .Compatible(true)
    .Build();
```

### `CheckStructVersion(bool enabled = false)` 选项

为生成的结构体序列化器启用严格的 schema 哈希校验。

```csharp
Fory fory = Fory.Builder()
    .CheckStructVersion(true)
    .Build();
```

### `MaxDepth(int value)` 选项

设置动态对象图的最大嵌套深度。

```csharp
Fory fory = Fory.Builder()
    .MaxDepth(32)
    .Build();
```

`value` 必须大于 `0`。

## 常见配置

### 高性能 Schema 一致服务

```csharp
Fory fory = Fory.Builder()
    .TrackRef(false)
    .Compatible(false)
    .Build();
```

### 兼容的跨语言服务

```csharp
Fory fory = Fory.Builder()
    .Xlang(true)
    .Compatible(true)
    .TrackRef(true)
    .Build();
```

### 线程安全服务实例

```csharp
ThreadSafeFory fory = Fory.Builder()
    .Compatible(true)
    .TrackRef(true)
    .BuildThreadSafe();
```

## 相关主题

- [基础序列化](basic-serialization.md)
- [Schema 演化](schema-evolution.md)
- [线程安全](thread-safety.md)
