---
title: Security Best Practices
sidebar_position: 9
id: security
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

This page covers security best practices and DeserializationPolicy.

## Production Configuration

Never disable `strict=True` in production unless your environment is completely trusted:

```python
import pyfory

# Recommended production settings
f = pyfory.Fory(
    xlang=False,   # or True for cross-language
    ref=True,      # Handle circular references
    strict=True,   # IMPORTANT: Prevent malicious data
    max_depth=100  # Prevent deep recursion attacks
)

# Explicitly register allowed types
f.register(UserModel, type_id=100)
f.register(OrderModel, type_id=101)
# Never set strict=False in production with untrusted data!
```

## Development vs Production

Use environment variables to switch between configurations:

```python
import pyfory
import os

# Development configuration
if os.getenv('ENV') == 'development':
    fory = pyfory.Fory(
        xlang=False,
        ref=True,
        strict=False,    # Allow any type for development
        max_depth=1000   # Higher limit for development
    )
else:
    # Production configuration (security hardened)
    fory = pyfory.Fory(
        xlang=False,
        ref=True,
        strict=True,     # CRITICAL: Require registration
        max_depth=100    # Reasonable limit
    )
    # Register only known safe types
    for idx, model_class in enumerate([UserModel, ProductModel, OrderModel]):
        fory.register(model_class, type_id=100 + idx)
```

## DeserializationPolicy

When `strict=False` is necessary (e.g., deserializing functions/lambdas), use `DeserializationPolicy` to implement fine-grained security controls during deserialization.

**Why use DeserializationPolicy?**

- Block dangerous classes/modules (e.g., `subprocess.Popen`)
- Intercept and validate `__reduce__` callables before invocation
- Sanitize sensitive data during `__setstate__`
- Replace or reject deserialized objects based on custom rules

### Blocking Dangerous Classes

```python
import pyfory
from pyfory import DeserializationPolicy

dangerous_modules = {'subprocess', 'os', '__builtin__'}

class SafeDeserializationPolicy(DeserializationPolicy):
    """Block potentially dangerous classes during deserialization."""

    def validate_class(self, cls, is_local, **kwargs):
        # Block dangerous modules
        if cls.__module__ in dangerous_modules:
            raise ValueError(f"Blocked dangerous class: {cls.__module__}.{cls.__name__}")
        return None

    def intercept_reduce_call(self, callable_obj, args, **kwargs):
        # Block specific callable invocations during __reduce__
        if getattr(callable_obj, '__name__', "") == 'Popen':
            raise ValueError("Blocked attempt to invoke subprocess.Popen")
        return None

    def intercept_setstate(self, obj, state, **kwargs):
        # Sanitize sensitive data
        if isinstance(state, dict) and 'password' in state:
            state['password'] = '***REDACTED***'
        return None

# Create Fory with custom security policy
policy = SafeDeserializationPolicy()
fory = pyfory.Fory(xlang=False, ref=True, strict=False, policy=policy)

# Now deserialization is protected by your custom policy
data = fory.serialize(my_object)
result = fory.deserialize(data)  # Policy hooks will be invoked
```

## Available Policy Hooks

| Hook                                         | Description                                       |
| -------------------------------------------- | ------------------------------------------------- |
| `validate_class(cls, is_local)`              | Validate/block class types during deserialization |
| `validate_module(module, is_local)`          | Validate/block module imports                     |
| `validate_function(func, is_local)`          | Validate/block function references                |
| `intercept_reduce_call(callable_obj, args)`  | Intercept `__reduce__` invocations                |
| `inspect_reduced_object(obj)`                | Inspect/replace objects created via `__reduce__`  |
| `intercept_setstate(obj, state)`             | Sanitize state before `__setstate__`              |
| `authorize_instantiation(cls, args, kwargs)` | Control class instantiation                       |

**See also:** `pyfory/policy.py` contains detailed documentation and examples for each hook.

## Best Practices

1. **Always use `strict=True` in production**
2. **Use `DeserializationPolicy`** when `strict=False` is necessary
3. **Block dangerous modules** (subprocess, os, etc.)
4. **Set appropriate `max_depth`** to prevent stack overflow
5. **Validate data sources** before deserialization
6. **Log security events** for auditing

## Related Topics

- [Type Registration](type-registration.md) - Registration and strict mode
- [Configuration](configuration.md) - Fory parameters
- [Python Native Mode](python-native.md) - Functions and lambdas
