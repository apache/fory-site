---
title: Migration Guide
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

This page covers migration from pickle and JSON to pyfory.

## From Pickle

Replace pickle with Fory for better performance while keeping the same API:

```python
# Before (pickle)
import pickle
data = pickle.dumps(obj)
result = pickle.loads(data)

# After (Fory - drop-in replacement with better performance)
import pyfory
f = pyfory.Fory(xlang=False, ref=True, strict=False)
data = f.dumps(obj)      # Faster and more compact
result = f.loads(data)   # Faster deserialization

# Benefits:
# - 2-10x faster serialization
# - 2-5x faster deserialization
# - Up to 3x smaller data size
# - Same API, better performance
```

## From JSON

Unlike JSON, Fory supports arbitrary Python types including functions:

```python
# Before (JSON - limited types)
import json
data = json.dumps({"name": "Alice", "age": 30})
result = json.loads(data)

# After (Fory - all Python types)
import pyfory
f = pyfory.Fory()
data = f.dumps({"name": "Alice", "age": 30, "func": lambda x: x})
result = f.loads(data)
```

## Key Differences

| Feature        | pickle     | JSON    | pyfory           |
| -------------- | ---------- | ------- | ---------------- |
| Performance    | Moderate   | Slow    | Fast             |
| Data Size      | Large      | Large   | Compact          |
| Type Support   | All Python | Limited | All Python       |
| Cross-Language | No         | Yes     | Yes (xlang mode) |
| Security       | Low        | High    | Configurable     |

## Migration Tips

1. **Start with strict=False** to ensure compatibility
2. **Add type registration** for performance and security
3. **Test thoroughly** before deploying
4. **Monitor performance** improvements

## Related Topics

- [Configuration](configuration.md) - Fory parameters
- [Python Native Mode](python-native.md) - Pickle replacement features
- [Security](security.md) - Security best practices
