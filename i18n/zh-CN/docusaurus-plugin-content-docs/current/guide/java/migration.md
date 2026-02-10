---
title: 迁移指南
sidebar_position: 10
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

本页介绍从 JDK 序列化迁移以及在 Fory 版本之间升级的策略。

## JDK 序列化迁移

如果你之前使用 JDK 序列化，并且无法同时升级客户端和服务器（这对于在线应用程序很常见），Fory 提供了一个实用方法 `org.apache.fory.serializer.JavaSerializer.serializedByJDK` 来检查二进制是否由 JDK 序列化生成。

你可以使用以下模式使现有序列化协议感知，然后以异步滚动方式升级序列化到 Fory：

```java
if (JavaSerializer.serializedByJDK(bytes)) {
  ObjectInputStream objectInputStream = xxx;
  return objectInputStream.readObject();
} else {
  return fory.deserialize(bytes);
}
```

这允许你：

1. 部署可以同时读取 JDK 和 Fory 序列化数据的新代码
2. 逐步将序列化迁移到 Fory
3. 最终移除 JDK 序列化支持

## 升级 Fory

### 小版本升级

目前，仅为小版本提供二进制兼容性。例如，如果你使用 Fory `v0.2.0`，如果升级到 Fory `v0.2.1`，将提供二进制兼容性。

如果你按小版本升级，或者你不会有旧版 Fory 序列化的数据，你可以直接升级 Fory，无需任何特殊处理。

### 大版本升级

如果你从 `v0.2.x` 升级到 Fory `v0.4.1`，则不保证二进制兼容性。

大多数时候不需要升级 Fory 到更新的大版本——当前版本已经足够快速和紧凑，我们为最近的旧版本提供一些小修复。

### 为序列化数据添加版本

如果你确实想升级 Fory 以获得更好的性能和更小的大小，你需要将 Fory 版本作为头部写入序列化数据，使用如下代码来保持二进制兼容性：

#### 带版本头的序列化

```java
MemoryBuffer buffer = xxx;
buffer.writeVarInt32(2);  // 写入 Fory 版本
fory.serialize(buffer, obj);
```

#### 带版本头的反序列化

```java
MemoryBuffer buffer = xxx;
int foryVersion = buffer.readVarInt32();
Fory fory = getFory(foryVersion);
fory.deserialize(buffer);
```

`getFory` 是一个加载相应 Fory 版本的方法。你可以将不同版本的 Fory shade 和 relocate 到不同的包，并按版本加载 Fory。

### Shading 示例

```xml
<!-- Maven Shade Plugin 配置用于多个 Fory 版本 -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-shade-plugin</artifactId>
  <executions>
    <execution>
      <id>shade-fory-v1</id>
      <phase>package</phase>
      <goals>
        <goal>shade</goal>
      </goals>
      <configuration>
        <relocations>
          <relocation>
            <pattern>org.apache.fory</pattern>
            <shadedPattern>com.myapp.fory.v1</shadedPattern>
          </relocation>
        </relocations>
      </configuration>
    </execution>
  </executions>
</plugin>
```

## 最佳实践

1. **升级前彻底测试**：确保与现有序列化数据的兼容性
2. **对长期存储使用版本头**：如果数据在 Fory 版本之间持久化
3. **保持向后兼容性**：保留旧版本 Fory 以读取遗留数据
4. **升级后监控**：在生产环境中注意反序列化错误

## 相关主题

- [配置选项](configuration.md) - ForyBuilder 选项
- [Schema 演化](schema-evolution.md) - 处理类变更
- [故障排除](troubleshooting.md) - 常见迁移问题
