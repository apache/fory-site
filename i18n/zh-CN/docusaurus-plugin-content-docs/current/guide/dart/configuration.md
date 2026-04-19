---
title: 配置
sidebar_position: 1
id: dart_configuration
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

本页介绍 `Fory` 构造函数的可选项。

## 创建 `Fory` 实例

直接把选项传给构造函数：

```dart
import 'package:fory/fory.dart';

// 默认配置，适合大多数单服务场景
final fory = Fory();

// 需要 Schema 演进的跨语言服务
final fory = Fory(
  compatible: true,
  maxDepth: 512,
);
```

每个应用创建一个实例并复用即可。按请求新建 `Fory` 没有任何收益。

## 选项

### `compatible`

当你的服务需要处理来自另一份模型版本代码的载荷时，请设置为 `true`。例如各服务独立发布，无法保证通信双方同时升级。

```dart
final fory = Fory(compatible: true);
```

当 `compatible: true` 时：

- 一侧新增或删除字段不会破坏另一侧。
- 各端仍然必须使用相同的 `namespace` + `typeName`，或者相同的数字 `id` 来标识类型。

当 `compatible: false`（默认）时：

- 双方必须拥有完全相同的 Schema。这样会略快一些，适合仅有 Dart 服务或始终一起升级的场景。

### `checkStructVersion`

仅在 `compatible: false` 时相关。当它为 `true` 时，Fory 会校验载荷中的 Schema 版本是否与接收端已知版本一致，从而在运行时尽早发现误用的 Schema。

```dart
final fory = Fory(
  compatible: false,
  checkStructVersion: true, // default
);
```

当 `compatible: true` 时，这个选项不起作用。

### `maxDepth`

限制对象图的最大嵌套深度。如果你的数据确实有很深的树形结构，可以增大它；如果你想快速拒绝异常深的载荷，可以减小它。

```dart
final fory = Fory(maxDepth: 128);
```

### `maxCollectionSize`

任意单个 list、set 或 map 字段可接受的最大元素数。用于防止畸形消息触发失控的内存分配。

```dart
final fory = Fory(maxCollectionSize: 100000);
```

### `maxBinarySize`

任意单个二进制 blob 字段允许接受的最大字节数。

```dart
final fory = Fory(maxBinarySize: 8 * 1024 * 1024);
```

## 默认值

| 选项                 | 默认值    |
| -------------------- | --------- |
| `compatible`         | `false`   |
| `checkStructVersion` | `true`    |
| `maxDepth`           | 256       |
| `maxCollectionSize`  | 1 048 576 |
| `maxBinarySize`      | 64 MiB    |

## 跨语言说明

当 Fory 用于不同语言实现的服务之间通信时：

- 如果任意一端需要 Schema 演进，则**所有**端都应设置 `compatible: true`。
- 每一端都要使用相同的数字 ID，或者相同的 `namespace + typeName` 组合。
- 写端和读端的 `compatible` 设置必须一致，模式不匹配会直接失败。

## 相关主题

- [基础序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
- [跨语言](cross-language.md)
