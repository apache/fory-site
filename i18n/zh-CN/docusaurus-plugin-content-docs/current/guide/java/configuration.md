---
title: 配置选项
sidebar_position: 1
id: configuration
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

本页记录通过 `ForyBuilder` 提供的全部配置选项。

## ForyBuilder 选项

| 选项名称                            | 描述                                                                                                                                                                                                                                                                                                                                                                                            | 默认值                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `timeRefIgnored`                    | 当启用引用跟踪时，是否忽略 `TimeSerializers` 中已注册的所有时间类型及其子类的引用跟踪。如果忽略，也可以通过调用 `Fory#registerSerializer(Class, Serializer)` 为某个时间类型重新启用引用跟踪。例如：`fory.registerSerializer(Date.class, new DateSerializer(fory.getConfig(), true))`。注意，对包含时间字段的类型而言，启用引用跟踪必须发生在相应序列化器代码生成之前，否则这些字段仍会跳过引用跟踪。 | `true`                                                             |
| `compressInt`                       | 启用或禁用 int 压缩以减小体积。                                                                                                                                                                                                                                                                                                                                                                | `true`                                                             |
| `compressLong`                      | 启用或禁用 long 压缩以减小体积。                                                                                                                                                                                                                                                                                                                                                               | `true`                                                             |
| `compressIntArray`                  | 当值可以装入更小数据类型时，启用或禁用对 int 数组的 SIMD 加速压缩。需要 Java 16+。                                                                                                                                                                                                                                                                                                            | `false`                                                            |
| `compressLongArray`                 | 当值可以装入更小数据类型时，启用或禁用对 long 数组的 SIMD 加速压缩。需要 Java 16+。                                                                                                                                                                                                                                                                                                           | `false`                                                            |
| `compressString`                    | 启用或禁用字符串压缩以减小体积。                                                                                                                                                                                                                                                                                                                                                               | `false`                                                            |
| `classLoader`                       | 每个 `Fory` 实例的类加载器在首次解析类之后就固定下来，因为 Fory 会缓存类元数据。若要使用不同的类加载器，请创建一个配置了该类加载器的新 `Fory` 或 `ThreadSafeFory`，或者在首次类解析前依赖线程上下文类加载器。                                                                                                                                                                                | `Thread.currentThread().getContextClassLoader()`                   |
| `compatibleMode`                    | 类型前向/后向兼容性配置，也与 `checkClassVersion` 相关。`SCHEMA_CONSISTENT` 表示序列化端和反序列化端的类 schema 必须一致；`COMPATIBLE` 表示两端的类 schema 可以不同，可独立新增或删除字段。[查看更多](schema-evolution.md)。                                                                                                                                                                    | `CompatibleMode.SCHEMA_CONSISTENT`                                 |
| `checkClassVersion`                 | 是否检查类 schema 的一致性。启用后，Fory 会基于 `classVersionHash` 写入并校验一致性。当启用 `CompatibleMode#COMPATIBLE` 时，该选项会自动关闭。除非你能确保类不会演进，否则不建议关闭。                                                                                                                                                                                                          | `false`                                                            |
| `checkJdkClassSerializable`         | 启用或禁用对 `java.*` 下类型的 `Serializable` 接口检查。如果某个 `java.*` 类型未实现 `Serializable`，Fory 会抛出 `UnsupportedOperationException`。                                                                                                                                                                                                                                               | `true`                                                             |
| `registerGuavaTypes`                | 是否预注册 Guava 类型，例如 `RegularImmutableMap` / `RegularImmutableList`。这些类型不是公共 API，但看起来相当稳定。                                                                                                                                                                                                                                                                          | `true`                                                             |
| `requireClassRegistration`          | 关闭后可能允许未知类被反序列化，从而带来安全风险。                                                                                                                                                                                                                                                                                                                                             | `true`                                                             |
| `maxDepth`                          | 设置反序列化的最大深度，超过时会抛出异常。可用于阻止反序列化 DDOS 攻击。                                                                                                                                                                                                                                                                                                                       | `50`                                                               |
| `suppressClassRegistrationWarnings` | 是否抑制类注册警告。这些警告可用于安全审计，但可能较为烦人，因此默认启用抑制。                                                                                                                                                                                                                                                                                                                 | `true`                                                             |
| `metaShareEnabled`                  | 启用或禁用元数据共享模式。                                                                                                                                                                                                                                                                                                                                                                     | 如果设置了 `CompatibleMode.COMPATIBLE` 则为 `true`，否则为 false。 |
| `scopedMetaShareEnabled`            | 作用域元数据共享只关注单次序列化过程。在该过程中创建或识别的元数据只归属于这次序列化，不会与其他序列化共享。                                                                                                                                                                                                                                                                                  | 如果设置了 `CompatibleMode.COMPATIBLE` 则为 `true`，否则为 false。 |
| `metaCompressor`                    | 设置元数据压缩器。注意传入的 `MetaCompressor` 必须是线程安全的。默认使用基于 `Deflater` 的 `DeflaterMetaCompressor`。用户也可以传入 `zstd` 等其他压缩器以获得更好的压缩率。                                                                                                                                                                                                                     | `DeflaterMetaCompressor`                                           |
| `deserializeUnknownClass`           | 启用或禁用对不存在或未知类数据的反序列化/跳过。                                                                                                                                                                                                                                                                                                                                                 | 如果设置了 `CompatibleMode.COMPATIBLE` 则为 `true`，否则为 false。 |
| `codeGenEnabled`                    | 关闭后可能让首次序列化更快，但后续序列化会变慢。                                                                                                                                                                                                                                                                                                                                               | `true`                                                             |
| `asyncCompilationEnabled`           | 如果启用，序列化会先使用解释执行模式，在某个类的异步序列化器 JIT 完成后切换到 JIT 序列化。                                                                                                                                                                                                                                                                                                     | `false`                                                            |
| `scalaOptimizationEnabled`          | 启用或禁用 Scala 专用序列化优化。                                                                                                                                                                                                                                                                                                                                                              | `false`                                                            |
| `copyRef`                           | 关闭后，拷贝性能会更好；但 Fory 深拷贝将忽略循环引用和共享引用。对象图中的同一个引用会在一次 `Fory#copy` 中被复制成不同对象。                                                                                                                                                                                                                                                                  | `false`                                                            |
| `serializeEnumByName`               | 启用后，Fory 会序列化枚举名称，而不是数值枚举 tag。未启用时，Fory 默认写入声明顺序对应的 ordinal，或者在枚举配置了 `@ForyEnumId` 时写入显式稳定 ID。                                                                                                                                                                                                                                             | `false`                                                            |

## 示例配置

```java
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  // 启用引用跟踪以支持共享/循环引用。
  // 如果没有重复引用，关闭它通常会有更好的性能。
  .withRefTracking(false)
  // 压缩 int 以减小体积
  .withIntCompressed(true)
  // 压缩 long 以减小体积
  .withLongCompressed(true)
  .withCompatibleMode(CompatibleMode.SCHEMA_CONSISTENT)
  // 启用类型前向/后向兼容性
  // 关闭它通常能得到更小体积和更好性能。
  // .withCompatibleMode(CompatibleMode.COMPATIBLE)
  // 启用异步多线程编译
  .withAsyncCompilation(true)
  .build();
```

## 相关主题

- [字段配置](field-configuration.md) - `@ForyField`、`@Ignore` 与整数编码注解
- [枚举配置](enum-configuration.md) - `serializeEnumByName` 与 `@ForyEnumId`
- [Schema 演进](schema-evolution.md) - 兼容模式与元数据共享
- [压缩](compression.md) - Int、long 和数组压缩详情
- [类型注册](type-registration.md) - 类注册选项
