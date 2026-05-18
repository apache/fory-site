---
title: Android 支持
sidebar_position: 15
id: android_support
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

## Android 运行时

Fory Java 通过常规的 `fory-core` 构件支持 Android 8.0+（API level 26+）。核心对象序列化不需要单独的 Android 构件。

在 Android 上使用核心对象序列化：

- `Fory#serialize(Object)` 和 `Fory#deserialize(byte[])`。
- `BaseFory#deserialize(ByteBuffer)`，用于堆、直接和只读 `ByteBuffer` 输入。
- Stream、channel 和 out-of-band buffer API，可通过 byte-array、heap-buffer 或 `ByteBuffer` 复制路径使用。
- Java collections/maps 和 xlang collections/maps。

`java/fory-format` row-format API 仅适用于 JVM，不支持 Android。

## 运行时代码生成

Android 上会禁用运行时序列化器代码生成。如果设置了 `withCodegen(true)`，Fory 会让 Android 序列化保持在非代码生成路径，并记录一条警告日志。

需要生成序列化器的 Android 应用应改用构建时静态生成序列化器。

## 静态生成序列化器

Android 应用类应使用 `@ForyStruct` 静态生成序列化器。它们由 javac 在应用构建期间生成，无需运行时字节码生成即可工作。

### 安装注解处理器

将 `fory-annotation-processor` 添加到编译 Android 模型类的模块的注解处理器路径中：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <configuration>
        <annotationProcessorPaths>
          <path>
            <groupId>org.apache.fory</groupId>
            <artifactId>fory-annotation-processor</artifactId>
            <version>${fory.version}</version>
          </path>
        </annotationProcessorPaths>
      </configuration>
    </plugin>
  </plugins>
</build>
```

然后使用 `@ForyStruct` 标注 Android 模型类。

当被序列化类使用 Fory type-use 注解时，Android 上必须使用静态生成序列化器，例如：

```java
import java.util.List;
import org.apache.fory.annotation.ForyStruct;
import org.apache.fory.annotation.UInt8Type;

@ForyStruct
public class ImageBlock {
  public List<@UInt8Type Integer> pixels;
}
```

如果没有生成的静态描述符，Android 反射可能无法暴露 `@Ref`、`@Int8Type`、`@UInt8Type`、`@Float16Type` 或 `@BFloat16Type` 等注解所需的嵌套 type-use 元信息。这些类的序列化将无法获得 Fory 所需的 Schema 信息。

设置说明见[静态生成序列化器](static-generated-serializers.md)。

## 对象模型要求

Android 序列化器使用公开的 Android 运行时能力。对于应用类，优先使用：

- 可访问的无参构造函数，或带受支持构造函数的 records。
- public、protected 或 package-private 的序列化字段。
- 用于 private 序列化字段的非 private getter 和 setter。
- Android 模型类的 `@ForyStruct` 静态生成序列化器。

普通类中的 final 字段不适合生成的 read/copy 方法。基于构造函数的不可变值应使用 records。

## 不支持的功能

Android 不支持以下 JVM 功能：

- 运行时序列化器代码生成和异步编译。
- Lambda 和 `SerializedLambda` 序列化。
- 原生地址序列化 API 和原生地址 `MemoryBuffer` 包装。
- 原始 unsafe 内存复制 API。
- `java/fory-format` row-format API。

## ByteBuffer

`BaseFory#deserialize(ByteBuffer)` 通过将剩余字节复制到 Fory 拥有的堆缓冲区，在 Android 上支持堆、直接和只读缓冲区。调用方缓冲区的 position 和 limit 不会改变。

原始 direct-buffer 地址包装是仅限 JVM 的快速路径，Android 上不会使用。

## Collections、Maps 和 Proxies

Android 支持常见的 JDK collection 和 map 实现。在 xlang 模式下，collection 和 map 序列化使用 xlang 协议，不编码 Java wrapper/view 内部结构。

`java.lang.reflect.Proxy` 序列化支持普通代理用法。代理仍在反序列化时，不要调用、记录或将其作为 map/set key 使用；此时 invocation handler 可能尚未准备好。
