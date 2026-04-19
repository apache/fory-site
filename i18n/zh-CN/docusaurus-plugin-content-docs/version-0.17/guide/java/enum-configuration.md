---
title: 枚举配置
sidebar_position: 6
id: enum_configuration
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

本页说明如何在 Apache Fory 中配置 Java 枚举的序列化方式。

## 默认枚举行为

Java 枚举可以通过两种模式进行序列化：

1. **按数值 tag**：默认行为
2. **按枚举名称**：通过 `serializeEnumByName(true)` 启用

在 xlang 模式下，始终使用数值 tag。在原生 Java 模式下，`serializeEnumByName(true)` 会把枚举序列化方式切换为按名称，而不是按数值 tag。

## 按名称序列化枚举

当原生 Java 对端应按名称而不是按数值 tag 匹配枚举常量时，请使用 `serializeEnumByName(true)`。

```java
Fory fory = Fory.builder()
    .withLanguage(Language.JAVA)
    .serializeEnumByName(true)
    .build();
```

当声明顺序可能不稳定，但枚举名称保持固定时，这种模式很有用。它只影响原生 Java 模式；xlang 仍然使用数值 tag。

## 稳定的数值枚举 ID

如果未启用 `serializeEnumByName(true)`，Java 枚举会按数值 tag 序列化。默认的 tag 是声明顺序对应的 ordinal。如果枚举需要与声明顺序无关的稳定 ID，请只使用一种 `@ForyEnumId` 来源：要么标注唯一一个 ID 来源，要么为每个枚举常量都显式标注 tag 值。

```java
import org.apache.fory.annotation.ForyEnumId;

enum Status {
    Unknown(10),
    Running(20),
    Finished(30);

    private final int id;

    Status(int id) {
        this.id = id;
    }

    @ForyEnumId
    public int getId() {
        return id;
    }
}
```

Java 也支持在某个枚举实例字段上标注 `@ForyEnumId`，或者直接在每个枚举常量上标注，例如 `@ForyEnumId(10) Unknown`。

### `@ForyEnumId` 的三种样式

`@ForyEnumId` 只支持以下三种配置方式：

1. 标注一个枚举实例字段，并在该字段中保存数值 ID
2. 标注一个无参 public 实例方法，例如 `getId()`
3. 为每个枚举常量都直接标注显式值，例如 `@ForyEnumId(10) Unknown`

### 校验规则

1. 对于同一个枚举，只能使用上述三种方式中的一种
2. 字段和方法上的注解必须保持 `value()` 为默认值 `-1`
3. 一旦有任意一个枚举常量使用 `@ForyEnumId`，所有枚举常量都必须标注
4. 所有 ID 都必须非负、唯一，并且能放入 Java `int`

### 查找行为

1. 没有 `@ForyEnumId` 时，Fory 写入声明顺序对应的 ordinal
2. 使用 `@ForyEnumId` 时，Fory 会改为写入配置好的稳定数值 tag
3. 对于较小且稠密的 tag，内部会使用数组查找；对稀疏且较大的 tag，则退回到 map 查找

## 如何在名称模式和数值模式之间选择

- 当枚举只在 Java 内部使用，且常量名才是兼容性主键时，使用**枚举名称**
- 当需要处理跨语言载荷，或需要稳定的显式 ID 时，使用**数值 tag**
- 当声明顺序可能变化，但编码格式中的数值 ID 必须保持稳定时，使用 **`@ForyEnumId`**

## 相关主题

- [配置选项](configuration.md) - `serializeEnumByName` 及其他运行时选项
- [字段配置](field-configuration.md) - `@ForyField`、`@Ignore` 和整数编码注解
- [跨语言序列化](cross-language.md) - Xlang 枚举互操作
