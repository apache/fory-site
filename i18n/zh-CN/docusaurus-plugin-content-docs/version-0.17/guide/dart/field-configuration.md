---
title: 字段配置
sidebar_position: 6
id: dart_field_configuration
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

在 `@ForyStruct()` 类中的字段上添加 `@ForyField(...)`，即可改变该字段的序列化方式。

## 快速参考

```dart
@ForyField(
  skip: false,      // exclude the field from serialization
  id: 10,           // stable field ID for schema evolution
  nullable: true,   // override nullability detection
  ref: true,        // enable reference tracking for this field
  dynamic: false,   // control whether the runtime type is written
)
```

## `skip`

完全把该字段排除在序列化之外。适合缓存值、计算值或仅用于 UI 的值，这些值不应该进入持久化或传输消息。

```dart
@ForyField(skip: true)
String cachedDisplayName = '';
```

## `id`

为字段分配稳定身份，这样在 Schema 变化后，例如字段重命名或重排时，Fory 仍然可以通过 ID 匹配它。**如果你未来可能新增、删除或重命名字段，请现在就为所有字段分配 ID**，而且要在第一份载荷发出之前完成。

```dart
@ForyField(id: 1)
String name = '';
```

一旦载荷已经在服务之间共享，就永远不要把某个 `id` 复用到另一个不同字段上。

## `nullable`

显式声明字段是可空还是非可空，从而覆盖 Fory 根据 Dart 类型做出的推断。当 Dart 类型是非可空，但你仍希望 Fory 在线路上接受 `null` 时，可以使用它，例如为了读取旧生产者生成、可能省略该字段的消息。

```dart
@ForyField(nullable: true)
String nickname = '';
```

在跨语言场景下，也要确保可空性契约与对端运行时的预期一致。

## `ref`

为某个字段启用引用跟踪。当对象图中的多个对象可能引用同一个实例，或该字段类型本身可能形成循环时，请使用这个选项。没有 `ref: true` 时，如果同一个对象出现在两个字段里，Fory 会把它的值序列化两次。

```dart
@ForyField(ref: true)
List<Object?> sharedNodes = <Object?>[];
```

注意：即使设置了 `ref: true`，像 `int`、`double`、`bool` 这样的标量类型也不会从引用跟踪中受益。

## `dynamic`

控制 Fory 是否把字段值的具体运行时类型写入载荷。

- `null`（默认）：Fory 根据声明类型自动决定。
- `false`：始终使用字段的声明类型，载荷更紧凑，但反序列化端必须知道精确类型。
- `true`：始终写入实际运行时类型；当字段声明为 `Object?` 或基类，但运行时可能持有多种具体类型时，这是必需的。

```dart
@ForyField(dynamic: true)
Object? payload;  // can hold any registered type at runtime
```

## 数字字段注解

Dart `int` 在运行时是 64 位值。当你与 Java、Go 或 C# 交换消息时，对端可能期望更窄的整数类型。可以使用数字注解来固定精确的编码格式：

```dart
@ForyStruct()
class Sample {
  Sample();

  @Int32Type(compress: false)   // always writes 4 bytes
  int fixedWidthInt = 0;

  @Int64Type(encoding: LongEncoding.tagged)  // variable-length encoding
  int compactLong = 0;

  @Uint32Type(compress: true)   // variable-length unsigned
  int smallUnsigned = 0;
}
```

可用注解包括：`@Int32Type`、`@Int64Type`、`@Uint8Type`、`@Uint16Type`、`@Uint32Type`、`@Uint64Type`。

或者，也可以使用 [支持的类型](supported-types.md) 中介绍的显式包装类型，例如 `Int32`、`UInt32` 等。

## 跨语言字段对齐

当同一个模型在多种语言中分别定义时：

- 为所有未来可能变化的字段分配稳定 `id`。
- 对真正具备多态性的字段使用 `dynamic: true`。
- 保持字段的逻辑含义在各语言之间一致。Fory 可以按名称或 ID 匹配字段，但无法替你弥合语义上的差异。

## 相关主题

- [代码生成](code-generation.md)
- [Schema 演进](schema-evolution.md)
- [跨语言](cross-language.md)
