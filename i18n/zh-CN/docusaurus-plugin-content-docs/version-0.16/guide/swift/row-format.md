---
title: 行格式
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

Swift 当前主要聚焦于对象图序列化（`Fory.serialize` / `Fory.deserialize`）。

## 当前状态

- 对象图序列化：已支持
- 跨语言 xlang 对象协议：已支持
- Swift 行格式 API：尚未对外暴露

## 当前推荐做法

- 应用载荷使用对象序列化
- 跨服务版本演进时使用兼容模式
- 与其他 Fory 运行时互操作时使用 xlang 模式

## 后续方向

Swift 未来可以在不改变现有对象序列化 API 的前提下补充行格式支持。在此之前，请将行格式能力视为 Swift 运行时代码中不可用的特性。
