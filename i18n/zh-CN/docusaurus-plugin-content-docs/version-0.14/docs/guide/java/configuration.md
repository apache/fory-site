---
title: 配置选项
sidebar_position: 1
id: java_configuration
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

本页记录通过 `ForyBuilder` 提供的所有配置选项。

## ForyBuilder 选项

| 选项名称                            | 描述                                                                                                                                                                                                                                                                                                                                                                           | 默认值                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `timeRefIgnored`                    | 当启用引用跟踪时，是否忽略在 `TimeSerializers` 中注册的所有时间类型及其子类的引用跟踪。如果忽略，可以通过调用 `Fory#registerSerializer(Class, Serializer)` 为每个时间类型启用引用跟踪。例如，`fory.registerSerializer(Date.class, new DateSerializer(fory, true))`。注意，启用引用跟踪应该在包含时间字段的任何类型的序列化器代码生成之前进行。否则，这些字段仍将跳过引用跟踪。 | `true`                                                             |
| `compressInt`                       | 启用或禁用 int 压缩以获得更小的大小。                                                                                                                                                                                                                                                                                                                                          | `true`                                                             |
| `compressLong`                      | 启用或禁用 long 压缩以获得更小的大小。                                                                                                                                                                                                                                                                                                                                         | `true`                                                             |
| `compressIntArray`                  | 当值可以适配较小数据类型时，启用或禁用 int 数组的 SIMD 加速压缩。需要 Java 16+。                                                                                                                                                                                                                                                                                               | `true`                                                             |
| `compressLongArray`                 | 当值可以适配较小数据类型时，启用或禁用 long 数组的 SIMD 加速压缩。需要 Java 16+。                                                                                                                                                                                                                                                                                              | `true`                                                             |
| `compressString`                    | 启用或禁用字符串压缩以获得更小的大小。                                                                                                                                                                                                                                                                                                                                         | `false`                                                            |
| `classLoader`                       | 不应更新类加载器；Fory 缓存类元数据。对于类加载器更新，请使用 `LoaderBinding` 或 `ThreadSafeFory`。                                                                                                                                                                                                                                                                            | `Thread.currentThread().getContextClassLoader()`                   |
| `compatibleMode`                    | 类型前向/后向兼容性配置。也与 `checkClassVersion` 配置相关。`SCHEMA_CONSISTENT`：序列化端和反序列化端之间的类 schema 必须一致。`COMPATIBLE`：序列化端和反序列化端之间的类 schema 可以不同。它们可以独立添加/删除字段。[查看更多](schema-evolution.md)。                                                                                                                        | `CompatibleMode.SCHEMA_CONSISTENT`                                 |
| `checkClassVersion`                 | 确定是否检查类 schema 的一致性。如果启用，Fory 会使用 `classVersionHash` 检查、写入和检查一致性。当启用 `CompatibleMode#COMPATIBLE` 时，它将自动禁用。除非你能确保类不会演化，否则不建议禁用。                                                                                                                                                                                 | `false`                                                            |
| `checkJdkClassSerializable`         | 启用或禁用对 `java.*` 下的类的 `Serializable` 接口检查。如果 `java.*` 下的类不是 `Serializable`，Fory 将抛出 `UnsupportedOperationException`。                                                                                                                                                                                                                                 | `true`                                                             |
| `registerGuavaTypes`                | 是否预注册 Guava 类型，如 `RegularImmutableMap`/`RegularImmutableList`。这些类型不是公共 API，但似乎相当稳定。                                                                                                                                                                                                                                                                 | `true`                                                             |
| `requireClassRegistration`          | 禁用可能允许未知类被反序列化，可能导致安全风险。                                                                                                                                                                                                                                                                                                                               | `true`                                                             |
| `maxDepth`                          | 设置反序列化的最大深度，当深度超过时，将抛出异常。这可用于拒绝反序列化 DDOS 攻击。                                                                                                                                                                                                                                                                                             | `50`                                                               |
| `suppressClassRegistrationWarnings` | 是否抑制类注册警告。这些警告可用于安全审计，但可能很烦人，默认情况下将启用此抑制。                                                                                                                                                                                                                                                                                             | `true`                                                             |
| `metaShareEnabled`                  | 启用或禁用元数据共享模式。                                                                                                                                                                                                                                                                                                                                                     | 如果设置了 `CompatibleMode.Compatible` 则为 `true`，否则为 false。 |
| `scopedMetaShareEnabled`            | 作用域元数据共享专注于单个序列化过程。在此过程中创建或识别的元数据是它专有的，不会与其他序列化共享。                                                                                                                                                                                                                                                                           | 如果设置了 `CompatibleMode.Compatible` 则为 `true`，否则为 false。 |
| `metaCompressor`                    | 为元数据压缩设置压缩器。注意传递的 MetaCompressor 应该是线程安全的。默认情况下，将使用基于 `Deflater` 的压缩器 `DeflaterMetaCompressor`。用户可以传递其他压缩器，如 `zstd` 以获得更好的压缩率。                                                                                                                                                                                | `DeflaterMetaCompressor`                                           |
| `deserializeNonexistentClass`       | 启用或禁用对不存在类的数据的反序列化/跳过。                                                                                                                                                                                                                                                                                                                                    | 如果设置了 `CompatibleMode.Compatible` 则为 `true`，否则为 false。 |
| `codeGenEnabled`                    | 禁用可能导致更快的初始序列化，但后续序列化会更慢。                                                                                                                                                                                                                                                                                                                             | `true`                                                             |
| `asyncCompilationEnabled`           | 如果启用，序列化首先使用解释器模式，在类的异步序列化器 JIT 完成后切换到 JIT 序列化。                                                                                                                                                                                                                                                                                           | `false`                                                            |
| `scalaOptimizationEnabled`          | 启用或禁用 Scala 特定的序列化优化。                                                                                                                                                                                                                                                                                                                                            | `false`                                                            |
| `copyRef`                           | 禁用时，拷贝性能会更好。但 Fory 深拷贝将忽略循环引用和共享引用。对象图的相同引用将在一次 `Fory#copy` 中被复制为不同的对象。                                                                                                                                                                                                                                                    | `true`                                                             |
| `serializeEnumByName`               | 启用时，Fory 按名称而不是序数序列化枚举。                                                                                                                                                                                                                                                                                                                                      | `false`                                                            |

## 示例配置

```java
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  // 启用引用跟踪以支持共享/循环引用。
  // 如果没有重复引用，禁用它会有更好的性能。
  .withRefTracking(false)
  // 压缩 int 以获得更小的大小
  .withIntCompressed(true)
  // 压缩 long 以获得更小的大小
  .withLongCompressed(true)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // 启用类型前向/后向兼容性
  // 禁用它以获得更小的大小和更好的性能。
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // 启用异步多线程编译。
  .withAsyncCompilation(true)
  .build();
```

## 相关主题

- [Schema 演化](schema-evolution.md) - 兼容模式和元数据共享
- [压缩](compression.md) - Int、long 和数组压缩详情
- [类型注册](type-registration.md) - 类注册选项
