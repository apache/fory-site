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

本页介绍类注册机制和安全配置。

## 类注册

`ForyBuilder#requireClassRegistration` 可用于禁用类注册。这将允许反序列化未知类型的对象，这更灵活但**如果类包含恶意代码可能不安全**。

**除非你能确保环境是安全的，否则不要禁用类注册**。当禁用此选项时，反序列化未知/不受信任的类型时，`init/equals/hashCode` 中的恶意代码可能会被执行。

类注册不仅可以降低安全风险，还可以避免类名序列化成本。

### 按 ID 注册

你可以使用 API `Fory#register` 注册类：

```java
Fory fory = xxx;
fory.register(SomeClass.class);
fory.register(SomeClass1.class, 1);
```

注意，类注册顺序很重要。序列化和反序列化端应该具有相同的注册顺序。

### 按名称注册

按 ID 注册类会有更好的性能和更小的空间开销。但在某些情况下，管理一堆类型 ID 很复杂。在这种情况下，建议使用 API `register(Class<?> cls, String namespace, String typeName)` 按名称注册类：

```java
fory.register(Foo.class, "demo", "Foo");
```

如果类型没有重复的名称，`namespace` 可以留空以减少序列化大小。

**不要使用此 API 注册类，因为与按 ID 注册类相比，它会大大增加序列化大小。**

## 安全配置

### 类检查器

如果你调用 `ForyBuilder#requireClassRegistration(false)` 来禁用类注册检查，你可以通过 `ClassResolver#setClassChecker` 设置 `org.apache.fory.resolver.ClassChecker` 来控制哪些类允许序列化。

例如，你可以允许以 `org.example.*` 开头的类：

```java
Fory fory = xxx;
fory.getClassResolver().setClassChecker(
  (classResolver, className) -> className.startsWith("org.example."));
```

### AllowListChecker

Fory 提供了 `org.apache.fory.resolver.AllowListChecker`，这是一个基于允许/禁止列表的检查器，用于简化类检查机制的自定义：

```java
AllowListChecker checker = new AllowListChecker(AllowListChecker.CheckLevel.STRICT);
ThreadSafeFory fory = new ThreadLocalFory(classLoader -> {
  Fory f = Fory.builder().requireClassRegistration(true).withClassLoader(classLoader).build();
  f.getClassResolver().setClassChecker(checker);
  checker.addListener(f.getClassResolver());
  return f;
});
checker.allowClass("org.example.*");
```

你可以使用此检查器或自己实现更复杂的检查器。

## 限制最大反序列化深度

Fory 提供 `ForyBuilder#withMaxDepth` 来限制最大反序列化深度。默认最大深度为 50。

如果达到最大深度，Fory 将抛出 `ForyException`。这可用于防止恶意数据导致堆栈溢出或其他问题。

```java
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withMaxDepth(100)  // 设置自定义最大深度
  .build();
```

## 最佳实践

1. **在生产环境中始终启用类注册**：使用 `requireClassRegistration(true)`
2. **使用基于 ID 的注册以获得性能**：数字 ID 比字符串名称更快
3. **保持一致的注册顺序**：序列化和反序列化端的顺序相同
4. **设置适当的最大深度**：防止堆栈溢出攻击
5. **使用 AllowListChecker 进行细粒度控制**：当你需要灵活的类过滤时

## 相关主题

- [配置选项](configuration.md) - ForyBuilder 安全选项
- [自定义序列化器](custom-serializers.md) - 注册自定义序列化器
- [故障排除](troubleshooting.md) - 常见注册问题
