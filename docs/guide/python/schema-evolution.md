---
title: Schema Evolution
sidebar_position: 8
id: schema_evolution
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

Apache Fory™ supports schema evolution in compatible mode, allowing fields to be added or removed
while maintaining compatibility. Xlang mode enables compatible mode by default. In native mode,
set `compatible=True` explicitly when Python-only payloads need schema evolution.

## Xlang Default

```python
import pyfory

f = pyfory.Fory(xlang=True)
```

## Disable Evolution for Stable Classes

If a dataclass schema is stable and will not change, you can disable evolution for that class to avoid compatible metadata overhead. Use `pyfory.dataclass` with `evolving=False`:

```python
import pyfory

@pyfory.dataclass(evolving=False)
class StableMessage:
    id: int
    name: str
```

`pyfory.dataclass` also supports `slots=True`:

```python
@pyfory.dataclass(slots=True)
class SlotMessage:
    id: int
```

## Schema Evolution Example

```python
import pyfory
from dataclasses import dataclass

# Version 1: Original class
@dataclass
class User:
    name: str
    age: pyfory.Int32

f = pyfory.Fory(xlang=True)
f.register(User, typename="User")
data = f.dumps(User("Alice", 30))

# Version 2: Add new field (backward compatible)
@dataclass
class User:
    name: str
    age: pyfory.Int32
    email: str = "unknown@example.com"  # New field with default

# Can still deserialize old data
user = f.loads(data)
print(user.email)  # "unknown@example.com"
```

## Supported Changes

- **Add new fields**: With default values
- **Remove fields**: Old data with extra fields will be skipped
- **Reorder fields**: Fields are matched by name, not position

## Best Practices

1. **Always provide default values** for new fields
2. **Use typename for cross-language compatibility**
3. **Test schema changes** before deploying
4. **Document schema versions** for your team

## Related Topics

- [Configuration](configuration.md) - Compatible mode settings
- [Cross-Language](cross-language.md) - Schema evolution across languages
- [Type Registration](type-registration.md) - Registration patterns
