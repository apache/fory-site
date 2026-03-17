---
title: 支持的类型
sidebar_position: 9
id: supported_types
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

本页汇总 Apache Fory™ C# 中内置类型和生成类型的支持情况。

## 基础类型

| C# 类型                                  | 说明      |
| ---------------------------------------- | --------- |
| `bool`                                   | 支持      |
| `sbyte`, `short`, `int`, `long`          | 支持      |
| `byte`, `ushort`, `uint`, `ulong`        | 支持      |
| `float`, `double`                        | 支持      |
| `string`                                 | 支持      |
| `byte[]`                                 | 支持      |
| 可空基础类型（例如 `int?`）              | 支持      |

## 数组

- 基础数值数组（如 `bool[]`、`int[]`、`ulong[]` 等）
- `byte[]`
- 通过集合序列化器支持的一般数组（`T[]`）

## 集合

### 类列表集合

- `List<T>`
- `LinkedList<T>`
- `Queue<T>`
- `Stack<T>`

### 类集合

- `HashSet<T>`
- `SortedSet<T>`
- `ImmutableHashSet<T>` 等不可变集合

### 类映射集合

- `Dictionary<TKey, TValue>` 字典
- `SortedDictionary<TKey, TValue>` 有序字典
- `SortedList<TKey, TValue>` 有序列表映射
- `ConcurrentDictionary<TKey, TValue>` 并发字典
- `NullableKeyDictionary<TKey, TValue>` 可空键字典

## 时间类型

| C# 类型          | 编码类型    |
| ---------------- | ----------- |
| `DateOnly`       | `Date`      |
| `DateTime`       | `Timestamp` |
| `DateTimeOffset` | `Timestamp` |
| `TimeSpan`       | `Duration`  |

## 用户类型

- 通过 Source Generator 序列化器支持的 `[ForyObject]` 类 / 结构体 / 枚举
- 通过 `Register<T, TSerializer>(...)` 注册的自定义序列化器类型
- `Union` / `Union2<...>` 这类强类型 union 支持

## 动态类型

通过 `Serialize<object?>` / `Deserialize<object?>` 处理动态对象载荷时，支持：

- 基础值与对象值
- 动态列表 / 集合 / 映射
- 嵌套动态结构

## 说明

- 用户定义类型应显式注册。
- 跨语言使用时请遵循 [xlang 指南](../xlang/index.md)。

## 相关主题

- [基础序列化](basic-serialization.md)
- [类型注册](type-registration.md)
- [跨语言](cross-language.md)
