---
title: 类型注册与安全
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

本页介绍类注册机制与安全配置。

## 类注册

`ForyBuilder#requireClassRegistration` 可用于关闭类注册要求。这会允许反序列化未知类型的对象，灵活性更高，但**如果这些类包含恶意代码，就可能不安全**。

**除非你能确保运行环境安全，否则不要关闭类注册。** 当这个选项被关闭时，反序列化未知或不受信任的类型时，`init/equals/hashCode` 中的恶意代码可能被执行。

类注册不仅可以降低安全风险，也能避免写入类名带来的额外开销。

### 按 ID 注册

你可以通过 `Fory#register` 注册类：

```java
Fory fory = xxx;
fory.register(SomeClass.class);
fory.register(SomeClass1.class, 1);
```

注意，类注册顺序很重要。序列化端和反序列化端应该保持相同的注册顺序。

内部类型 ID 的 `0-32` 预留给内置 xlang 类型。Java 原生内建类型从 `Types.NONE + 1` 开始，用户 ID 的编码形式是 `(user_id << 8) | internal_type_id`。

### 按名称注册

按 ID 注册有更好的性能和更小的空间开销。但在某些场景下，维护大量 type ID 也很复杂。这时，推荐使用 `register(Class<?> cls, String namespace, String typeName)` 按名称注册类：

```java
fory.register(Foo.class, "demo", "Foo");
```

如果类型名称不会冲突，可以将 `namespace` 留空以减小序列化体积。

**不要在应追求紧凑编码的场景中优先使用这个 API，因为它相比按 ID 注册会显著增加序列化体积。**

## 安全配置

### Type Checker

如果你调用 `ForyBuilder#requireClassRegistration(false)` 来关闭类注册检查，就可以通过 `ForyBuilder#withTypeChecker` 或 `TypeResolver#setTypeChecker` 配置 `org.apache.fory.resolver.TypeChecker`，从而控制哪些类允许被序列化。

例如，你可以允许所有以 `org.example.*` 开头的类：

```java
Fory fory = Fory.builder()
  .requireClassRegistration(false)
  .withTypeChecker((typeResolver, className) -> className.startsWith("org.example."))
  .build();
```

### AllowListChecker

Fory 提供了 `org.apache.fory.resolver.AllowListChecker`，这是一个基于允许/禁止列表的检查器，可简化类检查机制的定制：

```java
AllowListChecker checker = new AllowListChecker(AllowListChecker.CheckLevel.STRICT);
checker.allowClass("org.example.*");
ThreadSafeFory fory = Fory.builder()
  .requireClassRegistration(false)
  .withTypeChecker(checker)
  .buildThreadSafeFory();
```

`withTypeChecker` 会在每个新建运行时上立即安装检查器，这也能避免在关闭类注册却没有配置检查器时产生通用启动警告。如果你需要在构建之后替换检查器，仍然可以继续使用 `TypeResolver#setTypeChecker` 或 `ThreadSafeFory#setTypeChecker`。

## 限制最大反序列化深度

Fory 提供 `ForyBuilder#withMaxDepth` 用于限制最大反序列化深度。默认最大深度为 50。

当达到最大深度时，Fory 会抛出 `ForyException`。这可用于防止恶意数据导致的栈溢出等问题。

```java
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withMaxDepth(100)  // 设置自定义最大深度
  .build();
```

## 最佳实践

1. **生产环境始终启用类注册**：使用 `requireClassRegistration(true)`。
2. **优先使用按 ID 注册**：数字 ID 比字符串名称更快。
3. **保持注册顺序一致**：序列化端和反序列化端必须相同。
4. **设置合适的最大深度**：防止栈溢出攻击。
5. **需要细粒度控制时使用 AllowListChecker**：适合灵活的类过滤场景。

## 相关主题

- [配置](configuration.md) - ForyBuilder 的安全相关选项
- [自定义序列化器](custom-serializers.md) - 注册自定义序列化器
- [故障排查](troubleshooting.md) - 常见注册问题
