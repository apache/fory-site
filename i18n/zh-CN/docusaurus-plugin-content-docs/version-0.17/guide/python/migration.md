---
title: 迁移指南
sidebar_position: 12
id: migration
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

本页介绍如何从 pickle 和 JSON 迁移到 pyfory。

## 从 Pickle 迁移

用 Fory 替换 pickle，在保持相同 API 的同时获得更好的性能：

```python
# 之前（pickle）
import pickle
data = pickle.dumps(obj)
result = pickle.loads(data)

# 之后（Fory - 直接替换，性能更好）
import pyfory
f = pyfory.Fory(xlang=False, ref=True, strict=False)
data = f.dumps(obj)      # 更快且更紧凑
result = f.loads(data)   # 更快的反序列化

# 优势：
# - 序列化快 2-10 倍
# - 反序列化快 2-5 倍
# - 数据大小减少高达 3 倍
# - 相同的 API，更好的性能
```

## 从 JSON 迁移

与 JSON 不同，Fory 支持包括函数在内的任意 Python 类型：

```python
# 之前（JSON - 类型受限）
import json
data = json.dumps({"name": "Alice", "age": 30})
result = json.loads(data)

# 之后（Fory - 所有 Python 类型）
import pyfory
f = pyfory.Fory()
data = f.dumps({"name": "Alice", "age": 30, "func": lambda x: x})
result = f.loads(data)
```

## 主要区别

| 特性     | pickle      | JSON | pyfory           |
| -------- | ----------- | ---- | ---------------- |
| 性能     | 中等        | 慢   | 快               |
| 数据大小 | 大          | 大   | 紧凑             |
| 类型支持 | 所有 Python | 受限 | 所有 Python      |
| 跨语言   | 否          | 是   | 是（xlang 模式） |
| 安全性   | 低          | 高   | 可配置           |

## 迁移提示

1. **从 strict=False 开始** 以确保兼容性
2. **添加类型注册** 以提高性能和安全性
3. **在部署前彻底测试**
4. **监控性能** 改进

## 相关主题

- [配置](configuration.md) - Fory 参数
- [Python 原生模式](python-native.md) - Pickle 替换功能
- [安全性](security.md) - 安全最佳实践
