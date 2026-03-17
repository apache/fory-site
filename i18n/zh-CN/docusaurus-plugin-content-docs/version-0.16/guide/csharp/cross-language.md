---
title: 跨语言序列化
sidebar_position: 8
id: cross_language
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

Apache Fory™ C# 支持与其他 Fory 运行时进行跨语言序列化。

## 启用跨语言模式

C# 默认使用 `Xlang(true)`，但在互操作代码中显式配置仍是更稳妥的做法。

```csharp
Fory fory = Fory.Builder()
    .Xlang(true)
    .Compatible(true)
    .Build();
```

## 使用稳定 ID 注册

```csharp
[ForyObject]
public sealed class Person
{
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}

Fory fory = Fory.Builder()
    .Xlang(true)
    .Compatible(true)
    .Build();

fory.Register<Person>(100);
```

所有语言侧都应使用相同的 ID 映射。

## 按命名空间 / 类型名注册

```csharp
fory.Register<Person>("com.example", "Person");
```

## 跨语言示例

### C#（序列化端）

```csharp
Person person = new() { Name = "Alice", Age = 30 };
byte[] payload = fory.Serialize(person);
```

### Java（反序列化端）

```java
Fory fory = Fory.builder()
    .withLanguage(Language.XLANG)
    .withRefTracking(true)
    .build();

fory.register(Person.class, 100);
Person value = (Person) fory.deserialize(payloadFromCSharp);
```

### Python（反序列化端）

```python
import pyfory

fory = pyfory.Fory(xlang=True, ref=True)
fory.register_type(Person, type_id=100)
value = fory.deserialize(payload_from_csharp)
```

## 类型映射参考

完整映射请参见 [xlang 指南](../xlang/index.md)。

## 最佳实践

1. 保持类型 ID 稳定，并做好文档记录。
2. 滚动升级场景下启用 `Compatible(true)`。
3. 在读写两端都注册所有用户类型。
4. 使用真实载荷做端到端往返验证。

## 相关主题

- [类型注册](type-registration.md)
- [Schema 演化](schema-evolution.md)
- [支持的类型](supported-types.md)
