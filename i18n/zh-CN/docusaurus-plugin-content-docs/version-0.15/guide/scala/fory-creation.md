---
title: Fory 创建
sidebar_position: 1
id: fory_creation
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

本页介绍创建 Fory 实例的 Scala 特定要求。

## 基础设置

使用 Fory 进行 Scala 序列化时，必须：

1. 通过 `withScalaOptimizationEnabled(true)` 启用 Scala 优化
2. 通过 `ScalaSerializers.registerSerializers(fory)` 注册 Scala 序列化器

```scala
import org.apache.fory.Fory
import org.apache.fory.serializer.scala.ScalaSerializers

val fory = Fory.builder()
  .withScalaOptimizationEnabled(true)
  .build()

// 为 Scala 注册优化的 Fory 序列化器
ScalaSerializers.registerSerializers(fory)
```

## 注册 Scala 内部类型

根据序列化的对象类型，可能需要注册一些 Scala 内部类型：

```scala
fory.register(Class.forName("scala.Enumeration.Val"))
```

为避免这种注册，可以禁用类注册：

```scala
val fory = Fory.builder()
  .withScalaOptimizationEnabled(true)
  .requireClassRegistration(false)
  .build()
```

> **注意**：禁用类注册允许反序列化未知类型。这更加灵活，但如果类包含恶意代码可能不安全。

## 引用跟踪

循环引用在 Scala 中很常见。应该使用 `withRefTracking(true)` 启用引用跟踪：

```scala
val fory = Fory.builder()
  .withScalaOptimizationEnabled(true)
  .withRefTracking(true)
  .build()
```

> **注意**：如果不启用引用跟踪，在某些 Scala 版本中序列化 Scala Enumeration 时可能会出现 [StackOverflowError](https://github.com/apache/fory/issues/1032)。

## 线程安全

Fory 实例的创建成本不低。实例应该在多次序列化之间共享。

### 单线程使用

```scala
import org.apache.fory.Fory
import org.apache.fory.serializer.scala.ScalaSerializers

object ForyHolder {
  val fory: Fory = {
    val f = Fory.builder()
      .withScalaOptimizationEnabled(true)
      .build()
    ScalaSerializers.registerSerializers(f)
    f
  }
}
```

### 多线程使用

对于多线程应用程序，使用 `ThreadSafeFory`：

```scala
import org.apache.fory.ThreadSafeFory
import org.apache.fory.ThreadLocalFory
import org.apache.fory.serializer.scala.ScalaSerializers

object ForyHolder {
  val fory: ThreadSafeFory = new ThreadLocalFory(classLoader => {
    val f = Fory.builder()
      .withScalaOptimizationEnabled(true)
      .withClassLoader(classLoader)
      .build()
    ScalaSerializers.registerSerializers(f)
    f
  })
}
```

## 配置选项

Fory Java 的所有配置选项都可用。查看 [Java 配置选项](../java/configuration.md)获取完整列表。

Scala 的常用选项：

```scala
import org.apache.fory.Fory
import org.apache.fory.config.CompatibleMode
import org.apache.fory.serializer.scala.ScalaSerializers

val fory = Fory.builder()
  .withScalaOptimizationEnabled(true)
  // 为循环引用启用引用跟踪
  .withRefTracking(true)
  // 启用 schema 演化支持
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // 启用异步编译以获得更好的启动性能
  .withAsyncCompilation(true)
  .build()

ScalaSerializers.registerSerializers(fory)
```
