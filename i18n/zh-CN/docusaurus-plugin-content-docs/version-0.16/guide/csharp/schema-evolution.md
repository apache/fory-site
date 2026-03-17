---
title: Schema 演化
sidebar_position: 7
id: schema_evolution
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

Apache Fory™ C# 在 `Compatible(true)` 模式下支持 Schema 演化。

## 兼容模式

```csharp
Fory fory = Fory.Builder()
    .Compatible(true)
    .Build();
```

兼容模式会写入类型元信息，使结构体定义不同的读写端仍可互操作。

## 示例：新增字段

```csharp
using Apache.Fory;

[ForyObject]
public sealed class OneStringField
{
    public string? F1 { get; set; }
}

[ForyObject]
public sealed class TwoStringField
{
    public string F1 { get; set; } = string.Empty;
    public string F2 { get; set; } = string.Empty;
}

Fory fory1 = Fory.Builder().Compatible(true).Build();
fory1.Register<OneStringField>(200);

Fory fory2 = Fory.Builder().Compatible(true).Build();
fory2.Register<TwoStringField>(200);

byte[] payload = fory1.Serialize(new OneStringField { F1 = "hello" });
TwoStringField evolved = fory2.Deserialize<TwoStringField>(payload);

// 读取端的 F2 会回退到默认值。
System.Diagnostics.Debug.Assert(evolved.F1 == "hello");
System.Diagnostics.Debug.Assert(evolved.F2 == string.Empty);
```

## 启用版本校验的 Schema 一致模式

如果你希望使用严格的 schema 身份校验，而不是演进行为：

```csharp
Fory strict = Fory.Builder()
    .Compatible(false)
    .CheckStructVersion(true)
    .Build();
```

此模式会在 schema 哈希不匹配时直接抛错。

## 最佳实践

1. 对独立部署的服务使用 `Compatible(true)`。
2. 跨版本保持类型 ID 稳定。
3. 为新字段提供安全的默认值。
4. 当需要严格匹配时启用 `CheckStructVersion(true)`。

## 相关主题

- [配置](configuration.md)
- [类型注册](type-registration.md)
- [故障排查](troubleshooting.md)
