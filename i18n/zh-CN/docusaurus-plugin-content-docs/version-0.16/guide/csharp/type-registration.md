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

本页介绍如何在 Apache Fory™ C# 中注册用户类型。

## 通过数值类型 ID 注册

使用显式 ID 可以获得更紧凑、也更稳定的跨服务映射。

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<User>(100);
fory.Register<Order>(101);
```

## 按类型名注册

当你更偏好符号化映射时，可以使用“命名空间 + 类型名”的注册方式。

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<User>("com.example", "User");
```

也可以使用简写重载：

```csharp
fory.Register<User>("User");
```

## 注册自定义序列化器

```csharp
Fory fory = Fory.Builder().Build();
fory.Register<MyType, MyTypeSerializer>(200);
```

也支持基于命名空间的自定义序列化器注册：

```csharp
fory.Register<MyType, MyTypeSerializer>("com.example", "MyType");
```

## 线程安全注册

`ThreadSafeFory` 暴露了相同的注册 API。注册信息会同步到所有线程私有的运行时实例中。

```csharp
using ThreadSafeFory fory = Fory.Builder().BuildThreadSafe();
fory.Register<User>(100);
fory.Register<Order>(101);
```

## 注册规则

- 在写入端和读取端都注册用户自定义类型。
- 在不同服务和语言之间保持 ID / 名称映射一致。
- 在高吞吐序列化负载开始前完成注册，避免运行时缺失。

## 相关主题

- [基础序列化](basic-serialization.md)
- [自定义序列化器](custom-serializers.md)
- [跨语言](cross-language.md)
