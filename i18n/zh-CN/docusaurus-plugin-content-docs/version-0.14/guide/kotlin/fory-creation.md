---
title: Fory 创建
sidebar_position: 1
id: kotlin_fory_creation
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

本页介绍创建 Fory 实例的 Kotlin 特定要求。

## 基本设置

在使用 Fory 进行 Kotlin 序列化时，通过 `KotlinSerializers.registerSerializers(fory)` 注册 Kotlin 序列化器：

```kotlin
import org.apache.fory.Fory
import org.apache.fory.serializer.kotlin.KotlinSerializers

val fory = Fory.builder()
    .requireClassRegistration(true)
    .build()

// 注册 Kotlin 序列化器
KotlinSerializers.registerSerializers(fory)
```

## 线程安全

Fory 实例的创建成本不低。实例应该在多次序列化之间共享。

### 单线程使用

```kotlin
import org.apache.fory.Fory
import org.apache.fory.serializer.kotlin.KotlinSerializers

object ForyHolder {
    val fory: Fory = Fory.builder()
        .requireClassRegistration(true)
        .build().also {
            KotlinSerializers.registerSerializers(it)
        }
}
```

### 多线程使用

对于多线程应用程序，使用 `ThreadSafeFory`：

```kotlin
import org.apache.fory.Fory
import org.apache.fory.ThreadSafeFory
import org.apache.fory.ThreadLocalFory
import org.apache.fory.serializer.kotlin.KotlinSerializers

object ForyHolder {
    val fory: ThreadSafeFory = ThreadLocalFory { classLoader ->
        Fory.builder()
            .withClassLoader(classLoader)
            .requireClassRegistration(true)
            .build().also {
                KotlinSerializers.registerSerializers(it)
            }
    }
}
```

### 使用构建器方法

```kotlin
// 线程安全的 Fory
val fory: ThreadSafeFory = Fory.builder()
    .requireClassRegistration(true)
    .buildThreadSafeFory()

KotlinSerializers.registerSerializers(fory)
```

## 配置选项

Fory Java 的所有配置选项都可用。完整列表请参阅 [Java 配置选项](../java/configuration.md)。

Kotlin 的常用选项：

```kotlin
import org.apache.fory.Fory
import org.apache.fory.config.CompatibleMode
import org.apache.fory.serializer.kotlin.KotlinSerializers

val fory = Fory.builder()
    // 启用循环引用的引用跟踪
    .withRefTracking(true)
    // 启用 schema 演化支持
    .withCompatibleMode(CompatibleMode.COMPATIBLE)
    // 启用异步编译以获得更好的启动性能
    .withAsyncCompilation(true)
    // 压缩选项
    .withIntCompressed(true)
    .withLongCompressed(true)
    .build()

KotlinSerializers.registerSerializers(fory)
```
