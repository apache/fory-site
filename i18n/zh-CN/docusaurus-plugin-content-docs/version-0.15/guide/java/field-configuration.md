---
title: 字段配置
sidebar_position: 5
id: field_configuration
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

本页说明如何在 Java 中配置序列化字段级元信息。

## 概述

Apache ForyTM 通过注解提供字段级配置：

- **`@ForyField`**：配置字段元信息（id、nullable、ref、dynamic）
- **`@Ignore`**：将字段排除在序列化之外
- **整数类型注解**：控制整数编码方式（varint、fixed、tagged、unsigned）

这些能力可用于：

- **Tag ID**：为兼容模式分配紧凑数值 ID，降低 struct 字段元信息开销
- **可空控制**：声明字段是否允许为 null
- **引用跟踪**：为共享对象开启引用跟踪
- **字段跳过**：显式排除不需要序列化的字段
- **编码控制**：指定整数序列化编码策略
- **多态控制**：控制 struct 字段是否写入运行时类型信息

## 基本语法

在字段上使用注解：

```java
import org.apache.fory.annotation.ForyField;

public class Person {
    @ForyField(id = 0)
    private String name;

    @ForyField(id = 1)
    private int age;

    @ForyField(id = 2, nullable = true)
    private String nickname;
}
```

## `@ForyField` 注解

使用 `@ForyField` 配置字段级元信息：

```java
public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @ForyField(id = 2, nullable = true)
    private String email;

    @ForyField(id = 3, ref = true)
    private List<User> friends;

    @ForyField(id = 4, dynamic = ForyField.Dynamic.TRUE)
    private Object data;
}
```

### 参数

| 参数       | 类型      | 默认值  | 说明                                      |
| ---------- | --------- | ------- | ----------------------------------------- |
| `id`       | `int`     | `-1`    | 字段 tag ID（`-1` 表示使用字段名编码）    |
| `nullable` | `boolean` | `false` | 字段是否可为 null                         |
| `ref`      | `boolean` | `false` | 是否开启引用跟踪                          |
| `dynamic`  | `Dynamic` | `AUTO`  | 控制 struct 字段多态行为                  |

## 字段 ID（`id`）

通过为字段分配数值 ID，可降低兼容模式下 struct 字段元信息开销：

```java
public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @ForyField(id = 2)
    private int age;
}
```

**收益：**

- 序列化体积更小（元信息里用数值 ID 而不是字段名）
- struct 字段元信息开销更低
- 可在不破坏二进制兼容性的前提下重命名字段

**建议：** 兼容模式下建议配置字段 ID，以降低序列化成本。

**注意：**

- 同一个类内 ID 必须唯一
- ID 必须 `>= 0`（`-1` 表示使用字段名编码，也是默认行为）
- 未指定时，元信息将写字段名（开销更大）

**不配置字段 ID**（元信息使用字段名）示例：

```java
public class User {
    private long id;
    private String name;
}
```

## 可空字段（`nullable`）

对可能为 `null` 的字段使用 `nullable = true`：

```java
public class Record {
    // 可空字符串字段
    @ForyField(id = 0, nullable = true)
    private String optionalName;

    // 可空 Integer 字段（装箱类型）
    @ForyField(id = 1, nullable = true)
    private Integer optionalCount;

    // 非可空字段（默认）
    @ForyField(id = 2)
    private String requiredName;
}
```

**注意：**

- 默认是 `nullable = false`（不可空）
- `nullable = false` 时，Fory 会省略 null 标记写入（节省 1 字节）
- 可能为 null 的装箱类型（`Integer`、`Long` 等）建议显式设为 `nullable = true`

## 引用跟踪（`ref`）

对于可能共享或循环引用的字段，启用引用跟踪：

```java
public class RefOuter {
    // 两个字段可能指向同一个内部对象
    @ForyField(id = 0, ref = true, nullable = true)
    private RefInner inner1;

    @ForyField(id = 1, ref = true, nullable = true)
    private RefInner inner2;
}

public class CircularRef {
    @ForyField(id = 0)
    private String name;

    // 自引用字段，用于循环引用
    @ForyField(id = 1, ref = true, nullable = true)
    private CircularRef selfRef;
}
```

**适用场景：**

- 字段可能形成循环或共享关系
- 同一对象被多个字段引用

**注意：**

- 默认是 `ref = false`（不跟踪引用）
- `ref = false` 可避免 IdentityMap 开销，也会跳过引用跟踪标记
- 仅在全局启用 ref tracking 时，字段级 ref 才生效

## Dynamic（多态控制）

控制跨语言序列化时 struct 字段的多态行为：

```java
public class Container {
    // AUTO：接口/抽象类型动态，具体类型非动态
    @ForyField(id = 0, dynamic = ForyField.Dynamic.AUTO)
    private Animal animal;  // 接口类型，写入类型信息

    // FALSE：不写类型信息，直接按声明类型序列化
    @ForyField(id = 1, dynamic = ForyField.Dynamic.FALSE)
    private Dog dog;  // 具体类型，不写类型信息

    // TRUE：写类型信息，支持运行时子类型
    @ForyField(id = 2, dynamic = ForyField.Dynamic.TRUE)
    private Object data;  // 强制多态
}
```

**取值：**

| 值      | 说明                                                         |
| ------- | ------------------------------------------------------------ |
| `AUTO`  | 自动判断：接口/抽象类型动态，具体类型非动态                 |
| `FALSE` | 不写类型信息，直接使用声明类型的序列化器                    |
| `TRUE`  | 写入类型信息，以支持运行时子类型                            |

## 跳过字段

### 使用 `@Ignore`

将字段排除在序列化之外：

```java
import org.apache.fory.annotation.Ignore;

public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @Ignore
    private String password;  // 不序列化

    @Ignore
    private Object internalState;  // 不序列化
}
```

### 使用 `transient`

Java 的 `transient` 关键字同样会排除字段：

```java
public class User {
    @ForyField(id = 0)
    private long id;

    private transient String password;  // 不序列化
    private transient Object cache;     // 不序列化
}
```

## 整数类型注解

Fory 提供整数注解，用于在跨语言场景中控制编码方式。

### 有符号 32 位整数（`@Int32Type`）

```java
import org.apache.fory.annotation.Int32Type;

public class MyStruct {
    // 变长编码（默认），小值更紧凑
    @Int32Type(compress = true)
    private int compactId;

    // 固定 4 字节编码，长度稳定
    @Int32Type(compress = false)
    private int fixedId;
}
```

### 有符号 64 位整数（`@Int64Type`）

```java
import org.apache.fory.annotation.Int64Type;
import org.apache.fory.config.LongEncoding;

public class MyStruct {
    // 变长编码（默认）
    @Int64Type(encoding = LongEncoding.VARINT)
    private long compactId;

    // 固定 8 字节编码
    @Int64Type(encoding = LongEncoding.FIXED)
    private long fixedTimestamp;

    // tagged 编码（小值 4 字节，否则 9 字节）
    @Int64Type(encoding = LongEncoding.TAGGED)
    private long taggedValue;
}
```

### 无符号整数

```java
import org.apache.fory.annotation.Uint8Type;
import org.apache.fory.annotation.Uint16Type;
import org.apache.fory.annotation.Uint32Type;
import org.apache.fory.annotation.Uint64Type;
import org.apache.fory.config.LongEncoding;

public class UnsignedStruct {
    // 无符号 8 位 [0, 255]
    @Uint8Type
    private short flags;

    // 无符号 16 位 [0, 65535]
    @Uint16Type
    private int port;

    // 无符号 32 位，varint 编码（默认）
    @Uint32Type(compress = true)
    private long compactCount;

    // 无符号 32 位，fixed 编码
    @Uint32Type(compress = false)
    private long fixedCount;

    // 无符号 64 位，多种编码
    @Uint64Type(encoding = LongEncoding.VARINT)
    private long varintU64;

    @Uint64Type(encoding = LongEncoding.FIXED)
    private long fixedU64;

    @Uint64Type(encoding = LongEncoding.TAGGED)
    private long taggedU64;
}
```

### 编码汇总

| 注解                             | Type ID | 编码    | 大小         |
| -------------------------------- | ------- | ------- | ------------ |
| `@Int32Type(compress = true)`    | 5       | varint  | 1-5 字节     |
| `@Int32Type(compress = false)`   | 4       | fixed   | 4 字节       |
| `@Int64Type(encoding = VARINT)`  | 7       | varint  | 1-10 字节    |
| `@Int64Type(encoding = FIXED)`   | 6       | fixed   | 8 字节       |
| `@Int64Type(encoding = TAGGED)`  | 8       | tagged  | 4 或 9 字节  |
| `@Uint8Type`                     | 9       | fixed   | 1 字节       |
| `@Uint16Type`                    | 10      | fixed   | 2 字节       |
| `@Uint32Type(compress = true)`   | 12      | varint  | 1-5 字节     |
| `@Uint32Type(compress = false)`  | 11      | fixed   | 4 字节       |
| `@Uint64Type(encoding = VARINT)` | 14      | varint  | 1-10 字节    |
| `@Uint64Type(encoding = FIXED)`  | 13      | fixed   | 8 字节       |
| `@Uint64Type(encoding = TAGGED)` | 15      | tagged  | 4 或 9 字节  |

**何时使用：**

- `varint`：数值通常较小时最优（默认）
- `fixed`：数值分布接近全范围时更稳定（如时间戳、哈希）
- `tagged`：在体积与性能间平衡较好
- 无符号类型：适合与 Rust/Go/C++ 等语言进行无符号整数互操作

## 完整示例

```java
import org.apache.fory.Fory;
import org.apache.fory.annotation.ForyField;
import org.apache.fory.annotation.Ignore;
import org.apache.fory.annotation.Int64Type;
import org.apache.fory.annotation.Uint64Type;
import org.apache.fory.config.LongEncoding;

import java.util.List;
import java.util.Map;
import java.util.Set;

public class Document {
    // 带 tag ID 的字段（兼容模式推荐）
    @ForyField(id = 0)
    private String title;

    @ForyField(id = 1)
    private int version;

    // 可空字段
    @ForyField(id = 2, nullable = true)
    private String description;

    // 集合字段
    @ForyField(id = 3)
    private List<String> tags;

    @ForyField(id = 4)
    private Map<String, String> metadata;

    @ForyField(id = 5)
    private Set<String> categories;

    // 不同编码方式的整数
    @ForyField(id = 6)
    @Uint64Type(encoding = LongEncoding.VARINT)
    private long viewCount;  // varint 编码

    @ForyField(id = 7)
    @Uint64Type(encoding = LongEncoding.FIXED)
    private long fileSize;   // fixed 编码

    @ForyField(id = 8)
    @Uint64Type(encoding = LongEncoding.TAGGED)
    private long checksum;   // tagged 编码

    // 共享/循环引用字段
    @ForyField(id = 9, ref = true, nullable = true)
    private Document parent;

    // 忽略字段（不序列化）
    private transient Object cache;

    // Getters and setters...
}

// Usage
public class Main {
    public static void main(String[] args) {
        Fory fory = Fory.builder()
            .withXlang(true)
            .withCompatible(true)
            .withRefTracking(true)
            .build();

        fory.register(Document.class, 100);

        Document doc = new Document();
        doc.setTitle("My Document");
        doc.setVersion(1);
        doc.setDescription("A sample document");

        // Serialize
        byte[] data = fory.serialize(doc);

        // Deserialize
        Document decoded = (Document) fory.deserialize(data);
    }
}
```

## 跨语言兼容

当数据需要被其他语言（Python、Rust、C++、Go）读取时，建议使用字段 ID 并配套类型注解：

```java
public class CrossLangData {
    // 使用字段 ID 保证跨语言兼容
    @ForyField(id = 0)
    @Int32Type(compress = true)
    private int intVar;

    @ForyField(id = 1)
    @Uint64Type(encoding = LongEncoding.FIXED)
    private long longFixed;

    @ForyField(id = 2)
    @Uint64Type(encoding = LongEncoding.TAGGED)
    private long longTagged;

    @ForyField(id = 3, nullable = true)
    private String optionalValue;
}
```

## Schema 演进

兼容模式支持 Schema 演进。建议配置字段 ID 以降低序列化成本：

```java
// Version 1
public class DataV1 {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;
}

// Version 2: Added new field
public class DataV2 {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @ForyField(id = 2, nullable = true)
    private String email;  // New field
}
```

V1 写入的数据可由 V2 读取（新增字段会是 `null`）。

也可以不配置字段 ID（元信息会使用字段名，开销更大）：

```java
public class Data {
    private long id;
    private String name;
}
```

## Native 模式与 Xlang 模式

字段配置在不同序列化模式下的默认行为不同。

### Native 模式（仅 Java）

Native 模式以最大兼容性为目标，默认值更宽松：

- **Nullable**：引用类型默认可空
- **Ref tracking**：对象引用默认开启（`String`、装箱类型、时间类型除外）
- **Polymorphism**：所有非 final 类默认支持多态

在 Native 模式下，通常**不需要额外字段注解**，除非你希望：

- 用字段 ID 降低体积
- 关闭不必要的 ref 跟踪以优化性能
- 对特定字段精确控制整数编码

```java
// Native mode: works without any annotations
public class User {
    private long id;
    private String name;
    private List<String> tags;  // Nullable and ref-tracked by default
}
```

### Xlang 模式（跨语言）

由于不同语言类型系统差异，Xlang 模式默认值更严格：

- **Nullable**：字段默认不可空（`nullable = false`）
- **Ref tracking**：默认关闭（`ref = false`）
- **Polymorphism**：具体类型默认不写多态类型信息

在 Xlang 模式下，以下情况需要显式配置：

- 字段可能为 null（使用 `nullable = true`）
- 字段需要共享/循环引用语义（使用 `ref = true`）
- 整数类型需要为跨语言兼容指定编码
- 你希望减少元信息大小（使用字段 ID）

```java
// Xlang mode: explicit configuration required for nullable/ref fields
public class User {
    @ForyField(id = 0)
    private long id;

    @ForyField(id = 1)
    private String name;

    @ForyField(id = 2, nullable = true)  // Must declare nullable
    private String email;

    @ForyField(id = 3, ref = true, nullable = true)  // Must declare ref for shared objects
    private User friend;
}
```

### 默认值汇总

| 选项       | Native 模式默认值           | Xlang 模式默认值                    |
| ---------- | -------------------------- | ----------------------------------- |
| `nullable` | `true`（引用类型）         | `false`                             |
| `ref`      | `true`                     | `false`                             |
| `dynamic`  | `true`（非 final 类）      | `AUTO`（具体类型通常按非动态处理）  |

## 最佳实践

1. **配置字段 ID**：兼容模式下建议配置，降低序列化成本
2. **可空字段使用 `nullable = true`**：对可为 null 的字段必须显式声明
3. **共享对象开启 `ref`**：对象共享或循环时使用 `ref = true`
4. **敏感字段用 `@Ignore` 或 `transient`**：如密码、令牌、内部状态
5. **选择合适编码**：小值用 `varint`，全范围值用 `fixed`
6. **保持 ID 稳定**：一旦分配，不要随意改动字段 ID
7. **跨语言场景显式无符号类型**：与 Rust、Go、C++ 互操作时尤其重要

## 注解速查

| 注解                             | 说明                                      |
| -------------------------------- | ----------------------------------------- |
| `@ForyField(id = N)`             | 配置字段 tag ID，减少元信息开销           |
| `@ForyField(nullable = true)`    | 将字段标记为可空                          |
| `@ForyField(ref = true)`         | 为字段启用引用跟踪                        |
| `@ForyField(dynamic = ...)`      | 控制 struct 字段多态行为                  |
| `@Ignore`                        | 将字段排除在序列化之外                    |
| `@Int32Type(compress = ...)`     | 32 位有符号整数编码                       |
| `@Int64Type(encoding = ...)`     | 64 位有符号整数编码                       |
| `@Uint8Type`                     | 8 位无符号整数                            |
| `@Uint16Type`                    | 16 位无符号整数                           |
| `@Uint32Type(compress = ...)`    | 32 位无符号整数编码                       |
| `@Uint64Type(encoding = ...)`    | 64 位无符号整数编码                       |

## 相关主题

- [基础序列化](basic_serialization) - 快速上手 Fory 序列化
- [Schema 演进](schema_evolution) - 兼容模式与 schema 演进
- [跨语言](cross_language) - 与 Python、Rust、C++、Go 互操作
