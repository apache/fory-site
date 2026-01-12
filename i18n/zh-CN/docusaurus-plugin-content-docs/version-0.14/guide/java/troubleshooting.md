---
title: 故障排除
sidebar_position: 11
id: java_troubleshooting
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

本页介绍常见问题及其解决方案。

## 类不一致和类版本检查

如果你创建 Fory 时没有将 `CompatibleMode` 设置为 `org.apache.fory.config.CompatibleMode.COMPATIBLE`，并且遇到奇怪的序列化错误，这可能是由于序列化端和反序列化端之间的类不一致造成的。

在这种情况下，你可以调用 `ForyBuilder#withClassVersionCheck` 来创建 Fory 以验证它。如果反序列化抛出 `org.apache.fory.exception.ClassNotCompatibleException`，则表示类不一致，你应该使用 `ForyBuilder#withCompatibleMode(CompatibleMode.COMPATIBLE)` 创建 Fory。

```java
// 启用类版本检查以诊断问题
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withClassVersionCheck(true)
  .build();

// 如果抛出 ClassNotCompatibleException，使用兼容模式
Fory fory = Fory.builder()
  .withLanguage(Language.JAVA)
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .build();
```

**注意**：`CompatibleMode.COMPATIBLE` 有更多的性能和空间成本。如果你的类在序列化和反序列化之间始终一致，请不要默认设置它。

## 使用错误的反序列化 API

确保使用匹配的 API 对：

| 序列化 API                         | 反序列化 API                         |
| ---------------------------------- | ------------------------------------ |
| `Fory#serialize`                   | `Fory#deserialize`                   |
| `Fory#serializeJavaObject`         | `Fory#deserializeJavaObject`         |
| `Fory#serializeJavaObjectAndClass` | `Fory#deserializeJavaObjectAndClass` |

**错误使用示例：**

```java
// ❌ 错误：使用 serialize 序列化，使用 deserializeJavaObject 反序列化
byte[] bytes = fory.serialize(object);
Object result = fory.deserializeJavaObject(bytes, MyClass.class);  // 错误！

// ❌ 错误：使用 serializeJavaObject 序列化，使用 deserialize 反序列化
byte[] bytes = fory.serializeJavaObject(object);
Object result = fory.deserialize(bytes);  // 错误！
```

**正确使用：**

```java
// ✅ 正确：匹配的 API 对
byte[] bytes = fory.serialize(object);
Object result = fory.deserialize(bytes);

byte[] bytes = fory.serializeJavaObject(object);
MyClass result = fory.deserializeJavaObject(bytes, MyClass.class);

byte[] bytes = fory.serializeJavaObjectAndClass(object);
Object result = fory.deserializeJavaObjectAndClass(bytes);
```

## 将 POJO 反序列化为另一种类型

如果你想序列化一个 POJO 并将其反序列化为另一个 POJO 类型，你必须使用 `CompatibleMode.COMPATIBLE`：

```java
public class DeserializeIntoType {
  static class Struct1 {
    int f1;
    String f2;

    public Struct1(int f1, String f2) {
      this.f1 = f1;
      this.f2 = f2;
    }
  }

  static class Struct2 {
    int f1;
    String f2;
    double f3;
  }

  static ThreadSafeFory fory = Fory.builder()
    .withCompatibleMode(CompatibleMode.COMPATIBLE).buildThreadSafeFory();

  public static void main(String[] args) {
    Struct1 struct1 = new Struct1(10, "abc");
    byte[] data = fory.serializeJavaObject(struct1);
    Struct2 struct2 = (Struct2) fory.deserializeJavaObject(data, Struct2.class);
  }
}
```

## 常见错误消息

### "Class not registered"

**原因**：需要类注册，但类未注册。

**解决方案**：在序列化之前注册类：

```java
fory.register(MyClass.class);
// 或使用显式 ID
fory.register(MyClass.class, 100);
```

### "ClassNotCompatibleException"

**原因**：序列化和反序列化之间的类 schema 不同。

**解决方案**：使用兼容模式：

```java
Fory fory = Fory.builder()
  .withCompatibleMode(CompatibleMode.COMPATIBLE)
  .build();
```

### "Max depth exceeded"

**原因**：对象图太深，可能表示循环引用攻击。

**解决方案**：如果是合法的，增加最大深度，或检查恶意数据：

```java
Fory fory = Fory.builder()
  .withMaxDepth(100)  // 从默认的 50 增加
  .build();
```

### "Serializer not found"

**原因**：未为该类型注册序列化器。

**解决方案**：注册自定义序列化器：

```java
fory.registerSerializer(MyClass.class, new MyClassSerializer(fory));
```

## 性能问题

### 初始序列化慢

**原因**：JIT 编译在第一次序列化时发生。

**解决方案**：启用异步编译：

```java
Fory fory = Fory.builder()
  .withAsyncCompilation(true)
  .build();
```

### 内存使用高

**原因**：大对象图或引用跟踪开销。

**解决方案**：

- 如果不需要，禁用引用跟踪：`.withRefTracking(false)`
- 使用自定义内存分配器进行池化
- 考虑对大数据集使用行格式

### 序列化大小大

**原因**：元数据开销或未压缩的数据。

**解决方案**：

- 启用压缩：`.withIntCompressed(true)`、`.withLongCompressed(true)`
- 仅在需要时使用兼容模式
- 注册类以避免类名序列化

## 调试技巧

1. **启用类版本检查**以诊断 schema 问题
2. **检查 API 配对** - 确保序列化/反序列化 API 匹配
3. **验证注册顺序** - 必须在各端之间保持一致
4. **启用日志记录**以查看内部操作：

```java
LoggerFactory.setLogLevel(LogLevel.DEBUG_LEVEL);
```

## 相关主题

- [配置选项](configuration.md) - 所有 ForyBuilder 选项
- [Schema 演化](schema-evolution.md) - 兼容模式详情
- [类型注册](type-registration.md) - 注册最佳实践
- [迁移指南](migration.md) - 升级 Fory 版本
