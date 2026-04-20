---
title: Java 序列化指南
sidebar_position: 0
id: serialization_index
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

Apache Fory™ 提供极速的 Java 对象序列化，基于 JIT 编译和零拷贝技术。当只需要 Java 对象序列化时，这种模式相比跨语言对象图序列化提供更好的性能。

## 特性

### 高性能

- **JIT 代码生成**：高度可扩展的 JIT 框架在运行时使用异步多线程编译生成序列化器代码，通过以下方式提供 20-170 倍的加速：
  - 内联变量以减少内存访问
  - 内联方法调用以消除虚拟分派开销
  - 最小化条件分支
  - 消除哈希查找
- **零拷贝**：直接内存访问，无中间缓冲区拷贝；行格式支持随机访问和部分序列化
- **变长编码**：对整数和长整型进行优化压缩
- **元数据共享**：缓存的类元数据减少冗余类型信息
- **SIMD 加速**：支持 Java Vector API 用于数组操作（Java 16+）

### 即插即用替代

- **100% JDK 序列化兼容**：支持 `writeObject`/`readObject`/`writeReplace`/`readResolve`/`readObjectNoData`/`Externalizable`
- **Java 8-24 支持**：适用于所有现代 Java 版本，包括 Java 17+ 的 record
- **GraalVM Native Image**：支持 AOT 编译，无需反射配置

### 高级特性

- **引用跟踪**：自动处理共享引用和循环引用
- **Schema 演化**：类 schema 变更的前向/后向兼容性
- **多态性**：完全支持继承层次结构和接口
- **深拷贝**：高效深度克隆复杂对象图并保留引用
- **安全性**：类注册和可配置的反序列化策略

## 快速开始

注意，Fory 的创建成本不低，**应该在多次序列化之间复用 Fory 实例**，而不是每次都创建。你应该将 Fory 作为静态全局变量，或者某个单例对象或有限对象的实例变量。

### 单线程使用

```java
import java.util.List;
import java.util.Arrays;

import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    // 注意 Fory 实例应该在多次不同对象的序列化之间复用。
    Fory fory = Fory.builder().withLanguage(Language.JAVA)
      .requireClassRegistration(true)
      .build();
    // 注册类型可以减少类名序列化开销，但不是必须的。
    // 如果启用了类注册，所有自定义类型都必须注册。
    // 如果未指定 id，注册顺序必须一致
    fory.register(SomeClass.class);
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

### 多线程使用

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    ThreadSafeFory fory = Fory.builder()
      .withLanguage(Language.JAVA)
      .buildThreadSafeFory();
    fory.register(SomeClass.class, 1);
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

### Fory 实例复用模式

```java
import org.apache.fory.*;
import org.apache.fory.config.*;

public class Example {
  private static final ThreadSafeFory fory = Fory.builder()
      .withLanguage(Language.JAVA)
      .buildThreadSafeFory();

  static {
    fory.register(SomeClass.class, 1);
  }

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}
```

## 线程安全

Fory 提供两种线程安全运行时风格：

### `buildThreadSafeFory`

这是默认选择。它会构建一个固定大小的共享 `ThreadPoolFory`，其大小为 `4 * availableProcessors()`，也是虚拟线程工作负载下的首选运行时：

```java
ThreadSafeFory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withRefTracking(false)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  .withAsyncCompilation(true)
  .buildThreadSafeFory();
```

更多细节请参见 [虚拟线程](virtual-threads.md)。

### ThreadLocalFory

仅当你明确希望为每个长期存在的平台线程分配一个 `Fory` 实例，或者无论 JDK 版本如何都要固定采用这种方式时，才使用 `buildThreadLocalFory()`：

```java
ThreadSafeFory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .buildThreadLocalFory();
fory.register(SomeClass.class, 1);
byte[] bytes = fory.serialize(object);
System.out.println(fory.deserialize(bytes));
```

### `buildThreadSafeForyPool`

如果你希望显式指定固定共享池大小，请使用 `buildThreadSafeForyPool(poolSize)`。它会预先创建 `poolSize` 个 `Fory` 实例，把它们放在共享固定槽位中，然后让任意调用方通过与线程无关的快速路径借用实例。只有当池中所有实例都在使用时，调用才会阻塞；运行时不会按照线程身份缓存实例：

```java
ThreadSafeFory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withRefTracking(false)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  .withAsyncCompilation(true)
  .buildThreadSafeForyPool(poolSize);
```

### Builder 方法

```java
// 单线程 Fory
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withRefTracking(false)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  .withAsyncCompilation(true)
  .build();

// 线程安全 Fory（由 Fory 实例池支撑）
ThreadSafeFory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withRefTracking(false)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  .withAsyncCompilation(true)
  .buildThreadSafeFory();

// 显式线程本地运行时
ThreadSafeFory threadLocalFory = Fory.builder()
  .withLanguage(Language.JAVA)
  .buildThreadLocalFory();
```

## 后续步骤

- [配置选项](configuration.md) - 了解 ForyBuilder 选项
- [字段配置](field-configuration.md) - `@ForyField`、`@Ignore` 和整数编码注解
- [枚举配置](enum-configuration.md) - `serializeEnumByName` 与 `@ForyEnumId`
- [基础序列化](basic-serialization.md) - 详细的序列化模式
- [压缩](compression.md) - 整数、long 和数组压缩选项
- [虚拟线程](virtual-threads.md) - 虚拟线程使用方式与池大小建议
- [类型注册](type-registration.md) - 类注册和安全性
- [自定义序列化器](custom-serializers.md) - 实现自定义序列化器
- [跨语言序列化](cross-language.md) - 为其他语言序列化数据
- [GraalVM 支持](graalvm_support) - 面向原生镜像的构建期序列化器编译
