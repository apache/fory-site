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

本页介绍 C# 生成序列化器中的字段级配置。

## `[ForyObject]` 与 `[Field]`

使用 `[ForyObject]` 启用 Source Generator 生成的序列化器；使用 `[Field]` 为特定字段覆盖整数编码方式。

```csharp
using Apache.Fory;

[ForyObject]
public sealed class Metrics
{
    // 定长 32 位编码
    [Field(Encoding = FieldEncoding.Fixed)]
    public uint Count { get; set; }

    // Tagged 64 位编码
    [Field(Encoding = FieldEncoding.Tagged)]
    public ulong TraceId { get; set; }

    // 默认（varint）编码
    public long LatencyMicros { get; set; }
}
```

## 可用编码

| 编码                   | 含义                                            |
| ---------------------- | ----------------------------------------------- |
| `FieldEncoding.Varint` | 变长整数编码（默认）                            |
| `FieldEncoding.Fixed`  | 定长整数编码                                    |
| `FieldEncoding.Tagged` | Tagged 整数编码（仅支持 `long` / `ulong`）      |

## 支持覆盖编码的字段类型

目前 `[Field(Encoding = ...)]` 可用于：

- `int`
- `uint`
- `long`
- `ulong`

可空值类型变体（例如 `long?`）同样会由生成序列化器处理。

## 可空性与引用跟踪

- 字段是否可空由 C# 类型可空性决定，例如 `string?`、可空值类型等。
- 引用跟踪由运行时的 `ForyBuilder.TrackRef(...)` 控制。

## 相关主题

- [配置](configuration.md)
- [Schema 演化](schema-evolution.md)
- [支持的类型](supported-types.md)
