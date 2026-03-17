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

本页介绍常见的 C# 运行时问题及其修复方式。

## 异常：`TypeNotRegisteredException`

**现象**：`Type not registered: ...`

**原因**：某个用户类型在未注册的情况下被序列化或反序列化。

**修复方式**：

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<MyType>(100);
```

确保写入端和读取端使用相同的类型 ID / 名称映射。

## 异常：`InvalidDataException: xlang bitmap mismatch`

**原因**：写入端和读取端的 `Xlang` 模式不一致。

**修复方式**：让两端使用相同的 `Xlang(...)` 值。

```csharp
Fory writer = Fory.Builder().Xlang(true).Build();
Fory reader = Fory.Builder().Xlang(true).Build();
```

## 严格模式下的 Schema 版本不匹配

**现象**：反序列化生成的结构体类型时抛出 `InvalidDataException`。

**原因**：`Compatible(false)` 配合 `CheckStructVersion(true)` 会强制要求 schema 哈希完全一致。

**修复选项**：

- 为 Schema 演进启用 `Compatible(true)`。
- 让写入端和读取端的模型定义保持一致。

## 循环引用失败

**现象**：出现类似栈溢出的递归问题，或对象图重建失败。

**原因**：在循环对象图上使用了 `TrackRef(false)`。

**修复方式**：

```csharp
Fory fory = Fory.Builder().TrackRef(true).Build();
```

## 并发问题

**原因**：多个线程共享了同一个 `Fory` 实例。

**修复方式**：使用 `BuildThreadSafe()`。

## 验证命令

在仓库根目录执行 C# 测试：

```bash
cd csharp
dotnet test Fory.sln -c Release
```

## 相关主题

- [配置](configuration.md)
- [Schema 演化](schema-evolution.md)
- [线程安全](thread-safety.md)
