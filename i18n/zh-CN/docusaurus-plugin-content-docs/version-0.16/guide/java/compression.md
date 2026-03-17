---
title: 压缩
sidebar_position: 6
id: compression
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

本页介绍用于减少序列化数据大小的压缩选项。

## 整数压缩

`ForyBuilder#withIntCompressed`/`ForyBuilder#withLongCompressed` 可用于压缩 int/long 以获得更小的大小。通常压缩 int 就足够了。

这两个压缩选项默认都是启用的。如果序列化大小不重要（例如，你之前使用 FlatBuffers 进行序列化，它不压缩任何东西），那么你应该禁用压缩。如果你的数据全是数字，压缩可能会带来 80% 的性能回退。

### Int 压缩

对于 int 压缩，Fory 使用 1~5 个字节进行编码。每个字节中的第一位表示是否有下一个字节。如果设置了第一位，则将读取下一个字节，直到下一个字节的第一位未设置。

### Long 压缩

对于 long 压缩，Fory 支持两种编码：

#### SLI（Small Long as Int）编码（默认）

- 如果 long 在 `[-1073741824, 1073741823]` 范围内，编码为 4 字节 int：`| little-endian: ((int) value) << 1 |`
- 否则写为 9 字节：`| 0b1 | little-endian 8bytes long |`

#### PVL（Progressive Variable-length Long）编码

- 每个字节中的第一位表示是否有下一个字节。如果设置了第一位，则将读取下一个字节，直到下一个字节的第一位未设置。
- 负数将通过 `(v << 1) ^ (v >> 63)` 转换为正数，以减少小负数的成本。

如果数字是 `long` 类型，但大多数情况下不能用较小的字节表示，压缩不会得到足够好的结果——与性能成本相比不值得。如果你发现它没有带来太多空间节省，也许你应该尝试禁用 long 压缩。

## 数组压缩

当数组值可以适配较小的数据类型时，Fory 支持原始数组（`int[]` 和 `long[]`）的 SIMD 加速压缩。此功能在 Java 16+ 上可用，并使用 Vector API 以获得最佳性能。

### 数组压缩工作原理

数组压缩分析数组以确定值是否可以使用更少的字节存储：

- **`int[]` → `byte[]`**：当所有值都在范围 [-128, 127] 内时（减少 75% 大小）
- **`int[]` → `short[]`**：当所有值都在范围 [-32768, 32767] 内时（减少 50% 大小）
- **`long[]` → `int[]`**：当所有值都适合整数范围时（减少 50% 大小）

### 配置和注册

要启用数组压缩，你必须显式注册序列化器：

```java
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  // 启用 int 数组压缩
  .withIntArrayCompressed(true)
  // 启用 long 数组压缩
  .withLongArrayCompressed(true)
  .build();

// 你必须显式注册压缩数组序列化器
CompressedArraySerializers.registerSerializers(fory);
```

**注意**：必须在依赖项中包含 `fory-simd` 模块，压缩数组序列化器才可用。

### Maven 依赖

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-simd</artifactId>
  <version>0.14.1</version>
</dependency>
```

## 字符串压缩

字符串压缩可以通过 `ForyBuilder#withStringCompressed(true)` 启用。这默认是禁用的。

## 配置摘要

| 选项                | 描述                                | 默认值  |
| ------------------- | ----------------------------------- | ------- |
| `compressInt`       | 启用 int 压缩                       | `true`  |
| `compressLong`      | 启用 long 压缩                      | `true`  |
| `compressIntArray`  | 启用 SIMD int 数组压缩（Java 16+）  | `true`  |
| `compressLongArray` | 启用 SIMD long 数组压缩（Java 16+） | `true`  |
| `compressString`    | 启用字符串压缩                      | `false` |

## 性能考虑

1. **对数字密集型数据禁用压缩**：如果你的数据主要是数字，压缩开销可能不值得
2. **数组压缩需要 Java 16+**：使用 Vector API 进行 SIMD 加速
3. **Long 压缩可能对大值无用**：如果大多数 long 不能适配较小的表示，请禁用它
4. **字符串压缩有开销**：仅在字符串高度可压缩时启用

## 示例配置

```java
// 对于主要是数字的数据 - 禁用压缩
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withIntCompressed(false)
  .withLongCompressed(false)
  .build();

// 对于包含数组的混合数据 - 启用数组压缩
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withIntCompressed(true)
  .withLongCompressed(true)
  .withIntArrayCompressed(true)
  .withLongArrayCompressed(true)
  .build();
CompressedArraySerializers.registerSerializers(fory);
```

## 相关主题

- [配置选项](configuration.md) - 所有 ForyBuilder 选项
- [高级特性](advanced-features.md) - 内存管理
