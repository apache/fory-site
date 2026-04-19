---
title: Row Format
sidebar_position: 10
id: row_format
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

Swift 当前主要聚焦于对象图序列化，也就是 `Fory.serialize` / `Fory.deserialize`。

## 当前状态

- 对象图序列化：已支持
- 跨语言 xlang 对象协议：已支持
- Swift Row Format API：暂未公开

## 当前推荐做法

- 应用层载荷优先使用对象序列化
- 跨服务版本演进使用兼容模式
- 需要与其他 Fory 运行时互通时启用 xlang 模式

## 后续方向

Swift 将来可以在不改变现有对象序列化 API 的前提下补充 Row Format 支持。在此之前，可视为 Swift 运行时暂不提供 Row Format 功能。
