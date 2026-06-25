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

本页介绍 Apache Fory™ C# 的 `ForyBuilder` 选项和默认配置值。
`Config` 是由 `ForyBuilder` 创建的不可变运行时快照。

## 构建运行时

```csharp
using Apache.Fory;

Fory fory = Fory.Builder().Build();
ThreadSafeFory threadSafe = Fory.Builder().BuildThreadSafe();
```

## 默认配置

`Fory.Builder().Build()` 使用以下默认值：

| 选项                              | 默认值  | 说明                              |
| --------------------------------- | ------- | --------------------------------- |
| `TrackRef`                        | `false` | 默认关闭引用跟踪                  |
| `Compatible`                      | `false` | Schema 一致模式，不写入演进元数据 |
| `CheckStructVersion`              | `false` | 默认关闭结构体 schema hash 校验   |
| `MaxDepth`                        | `20`    | 动态对象图的最大嵌套深度          |
| `MaxTypeFields`                   | `512`   | 一个收到的 struct metadata body 最大字段数 |
| `MaxTypeMetaBytes`                | `4096`  | 一个收到的 metadata body 最大编码字节数 |
| `MaxSchemaVersionsPerType`        | `10`    | 一个逻辑类型最大远端 metadata 版本数 |
| `MaxAverageSchemaVersionsPerType` | `3`     | 所有远端类型的平均 metadata 版本数 |

## 构建器选项

C# 始终使用与 xlang 兼容的帧头，因此 `ForyBuilder` 不提供单独的 `Xlang(...)` 开关。

### `TrackRef(bool enabled = false)`

为共享对象图和循环对象图启用引用跟踪。

```csharp
Fory fory = Fory.Builder()
    .TrackRef(true)
    .Build();
```

### `Compatible(bool enabled = false)`

启用 Schema 演进模式。

```csharp
Fory fory = Fory.Builder()
    .Compatible(true)
    .Build();
```

### `CheckStructVersion(bool enabled = false)`

为生成的结构体序列化器启用严格的 schema hash 校验。

```csharp
Fory fory = Fory.Builder()
    .CheckStructVersion(true)
    .Build();
```

### `MaxDepth(int value)`

设置动态对象图允许的最大嵌套深度。

```csharp
Fory fory = Fory.Builder()
    .MaxDepth(32)
    .Build();
```

`value` 必须大于 `0`。

### `MaxTypeFields(int value)`

设置一个收到的远端 struct metadata body 中可接受的最大字段数。

```csharp
Fory fory = Fory.Builder()
    .MaxTypeFields(512)
    .Build();
```

### `MaxTypeMetaBytes(int value)`

设置一个收到的 TypeMeta body 可接受的最大编码 body 字节数，不包含 8 字节 header 和扩展 size varint。

```csharp
Fory fory = Fory.Builder()
    .MaxTypeMetaBytes(4096)
    .Build();
```

### `MaxSchemaVersionsPerType(int value)`

设置一个逻辑类型可接受的最大远端 metadata 版本数。

```csharp
Fory fory = Fory.Builder()
    .MaxSchemaVersionsPerType(10)
    .Build();
```

### `MaxAverageSchemaVersionsPerType(int value)`

设置所有已接受远端类型的平均 metadata 版本数限制。有效全局下限为 `8192` 个 schema。

```csharp
Fory fory = Fory.Builder()
    .MaxAverageSchemaVersionsPerType(3)
    .Build();
```

## 常见配置

### 追求速度的 Schema 一致服务

```csharp
Fory fory = Fory.Builder()
    .TrackRef(false)
    .Compatible(false)
    .Build();
```

### 兼容的跨语言服务

```csharp
Fory fory = Fory.Builder()
    .Compatible(true)
    .TrackRef(true)
    .Build();
```

### 线程安全的服务实例

```csharp
ThreadSafeFory fory = Fory.Builder()
    .Compatible(true)
    .TrackRef(true)
    .BuildThreadSafe();
```

## 安全

安全相关配置：

- 在反序列化不可信 payload 前，只注册预期的类型。
- 对 intentional same-schema payload，将 `CheckStructVersion(true)` 与 `Compatible(false)` 配合使用。
- 设置 `MaxDepth(...)` 以拒绝异常深的动态对象图。
- 除非数据不是恶意输入，且可信 peer 会发送更大的 metadata 或大量 schema 版本，否则保持远端 schema metadata 限制的默认值。
- 对不可信输入，优先使用生成或已注册的具体 model，避免宽泛的动态字段。

## 相关主题

- [基础序列化](basic_serialization)
- [Schema 演进](schema_evolution)
- [线程安全](thread_safety)
