---
title: 安全最佳实践
sidebar_position: 9
id: python_security
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

本页介绍安全最佳实践和 DeserializationPolicy。

## 生产环境配置

除非环境完全可信，否则不要在生产环境中禁用 `strict=True`：

```python
import pyfory

# 生产环境推荐设置
f = pyfory.Fory(
    xlang=False,   # 如果需要跨语言支持则为 True
    ref=True,      # 处理循环引用
    strict=True,   # 重要：防止恶意数据
    max_depth=100  # 防止深度递归攻击
)

# 显式注册允许的类型
f.register(UserModel, type_id=100)
f.register(OrderModel, type_id=101)
# 永远不要在生产环境中对不受信任的数据设置 strict=False！
```

## 开发环境 vs 生产环境

使用环境变量在配置之间切换：

```python
import pyfory
import os

# 开发环境配置
if os.getenv('ENV') == 'development':
    fory = pyfory.Fory(
        xlang=False,
        ref=True,
        strict=False,    # 开发时允许任何类型
        max_depth=1000   # 开发时更高的限制
    )
else:
    # 生产环境配置（安全加固）
    fory = pyfory.Fory(
        xlang=False,
        ref=True,
        strict=True,     # 关键：需要注册
        max_depth=100    # 合理的限制
    )
    # 只注册已知的安全类型
    for idx, model_class in enumerate([UserModel, ProductModel, OrderModel]):
        fory.register(model_class, type_id=100 + idx)
```

## DeserializationPolicy

当需要 `strict=False` 时（例如，反序列化函数/lambda），使用 `DeserializationPolicy` 在反序列化期间实现细粒度的安全控制。

**为什么使用 DeserializationPolicy？**

- 阻止危险的类/模块（例如，`subprocess.Popen`）
- 在调用前拦截和验证 `__reduce__` 可调用对象
- 在 `__setstate__` 期间清理敏感数据
- 根据自定义规则替换或拒绝反序列化的对象

### 阻止危险类

```python
import pyfory
from pyfory import DeserializationPolicy

dangerous_modules = {'subprocess', 'os', '__builtin__'}

class SafeDeserializationPolicy(DeserializationPolicy):
    """在反序列化期间阻止潜在危险的类。"""

    def validate_class(self, cls, is_local, **kwargs):
        # 阻止危险模块
        if cls.__module__ in dangerous_modules:
            raise ValueError(f"已阻止危险类：{cls.__module__}.{cls.__name__}")
        return None

    def intercept_reduce_call(self, callable_obj, args, **kwargs):
        # 在 __reduce__ 期间阻止特定的可调用对象调用
        if getattr(callable_obj, '__name__', "") == 'Popen':
            raise ValueError("已阻止尝试调用 subprocess.Popen")
        return None

    def intercept_setstate(self, obj, state, **kwargs):
        # 清理敏感数据
        if isinstance(state, dict) and 'password' in state:
            state['password'] = '***REDACTED***'
        return None

# 使用自定义安全策略创建 Fory
policy = SafeDeserializationPolicy()
fory = pyfory.Fory(xlang=False, ref=True, strict=False, policy=policy)

# 现在反序列化受到自定义策略的保护
data = fory.serialize(my_object)
result = fory.deserialize(data)  # 将调用策略钩子
```

## 可用的策略钩子

| 钩子                                         | 描述                                  |
| -------------------------------------------- | ------------------------------------- |
| `validate_class(cls, is_local)`              | 在反序列化期间验证/阻止类类型         |
| `validate_module(module, is_local)`          | 验证/阻止模块导入                     |
| `validate_function(func, is_local)`          | 验证/阻止函数引用                     |
| `intercept_reduce_call(callable_obj, args)`  | 拦截 `__reduce__` 调用                |
| `inspect_reduced_object(obj)`                | 检查/替换通过 `__reduce__` 创建的对象 |
| `intercept_setstate(obj, state)`             | 在 `__setstate__` 之前清理状态        |
| `authorize_instantiation(cls, args, kwargs)` | 控制类实例化                          |

**另请参阅：** `pyfory/policy.py` 包含每个钩子的详细文档和示例。

## 最佳实践

1. **生产环境始终使用 `strict=True`**
2. **必要时使用 `DeserializationPolicy`** 当需要 `strict=False` 时
3. **阻止危险模块**（subprocess、os 等）
4. **设置适当的 `max_depth`** 以防止栈溢出
5. **在反序列化前验证数据源**
6. **记录安全事件** 用于审计

## 相关主题

- [类型注册](type-registration.md) - 注册和严格模式
- [配置](configuration.md) - Fory 参数
- [Python 原生模式](python-native.md) - 函数和 lambda
