---
title: GraalVM 指南
sidebar_position: 19
id: graalvm_serialization
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

## GraalVM Native Image

GraalVM `native image` 提前将 Java 代码编译为本地可执行文件，从而实现更快的启动速度和更低的内存使用。但是，本地镜像不支持运行时 JIT 编译或反射，除非进行显式配置。

Apache Fory™ 通过**使用代码生成而非反射**，可以完美地与 GraalVM native image 配合使用。所有序列化器代码都在构建时生成，在大多数情况下无需反射配置文件。

## 工作原理

当您执行以下操作时，Fory 会在 GraalVM 构建时生成序列化代码：

1. 将 Fory 创建为**静态**字段
2. 在静态初始化器中**注册**所有类
3. 调用 `fory.ensureSerializersCompiled()` 来编译序列化器
4. 通过 `native-image.properties` 配置该类在构建时初始化

**主要优势**：对于大多数可序列化的类，您无需配置[反射 json](https://www.graalvm.org/latest/reference-manual/native-image/metadata/#specifying-reflection-metadata-in-json) 或[序列化 json](https://www.graalvm.org/latest/reference-manual/native-image/metadata/#serialization)。

注意：Fory 的 `asyncCompilationEnabled` 选项在 GraalVM native image 中会自动禁用，因为不支持运行时 JIT。

## 基础用法

### 步骤 1：创建 Fory 并注册类

```java
import org.apache.fory.Fory;

public class Example {
  // 必须是静态字段
  static Fory fory;

  static {
    fory = Fory.builder().build();
    fory.register(MyClass.class);
    fory.register(AnotherClass.class);
    // 在构建时编译所有序列化器
    fory.ensureSerializersCompiled();
  }

  public static void main(String[] args) {
    byte[] bytes = fory.serialize(new MyClass());
    MyClass obj = (MyClass) fory.deserialize(bytes);
  }
}
```

### 步骤 2：配置构建时初始化

创建 `resources/META-INF/native-image/your-group/your-artifact/native-image.properties`：

```properties
Args = --initialize-at-build-time=com.example.Example
```

## ForyGraalVMFeature（可选）

对于大多数具有公共构造函数的类型，上述基本设置就足够了。但是，一些高级情况需要反射注册：

- **私有构造函数**（没有可访问的无参构造函数的类）
- **私有内部类/记录**
- **动态代理序列化**

`fory-graalvm-feature` 模块会自动处理这些情况，无需手动配置 `reflect-config.json`。

### 添加依赖

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-graalvm-feature</artifactId>
  <version>${fory.version}</version>
</dependency>
```

### 启用功能

将以下内容添加到您的 `native-image.properties`：

```properties
Args = --initialize-at-build-time=com.example.Example \
       --features=org.apache.fory.graalvm.feature.ForyGraalVMFeature
```

### ForyGraalVMFeature 处理的内容

| 场景                     | 不使用 Feature              | 使用 Feature |
| ------------------------ | --------------------------- | ------------ |
| 具有无参构造函数的公共类 | ✅ 可工作                   | ✅ 可工作    |
| 私有构造函数             | ❌ 需要 reflect-config.json | ✅ 自动注册  |
| 私有内部记录             | ❌ 需要 reflect-config.json | ✅ 自动注册  |
| 动态代理                 | ❌ 需要手动配置             | ✅ 自动注册  |

### 私有记录示例

```java
public class Example {
  // 私有内部记录 - 需要 ForyGraalVMFeature
  private record PrivateRecord(int id, String name) {}

  static Fory fory;

  static {
    fory = Fory.builder().build();
    fory.register(PrivateRecord.class);
    fory.ensureSerializersCompiled();
  }
}
```

### 动态代理示例

```java
import org.apache.fory.util.GraalvmSupport;

public class ProxyExample {
  public interface MyService {
    String execute();
  }

  static Fory fory;

  static {
    fory = Fory.builder().build();
    // 为序列化注册代理接口
    GraalvmSupport.registerProxySupport(MyService.class);
    fory.ensureSerializersCompiled();
  }
}
```

## 线程安全的 Fory

对于多线程应用程序，使用 `ThreadLocalFory`：

```java
import org.apache.fory.Fory;
import org.apache.fory.ThreadLocalFory;
import org.apache.fory.ThreadSafeFory;

public class ThreadSafeExample {
  public record Foo(int f1, String f2, List<String> f3) {}

  static ThreadSafeFory fory;

  static {
    fory = new ThreadLocalFory(classLoader -> {
      Fory f = Fory.builder().build();
      f.register(Foo.class);
      f.ensureSerializersCompiled();
      return f;
    });
  }

  public static void main(String[] args) {
    Foo foo = new Foo(10, "abc", List.of("str1", "str2"));
    byte[] bytes = fory.serialize(foo);
    Foo result = (Foo) fory.deserialize(bytes);
  }
}
```

## 故障排除

### "Type is instantiated reflectively but was never registered"

如果您看到此错误：

```
Type com.example.MyClass is instantiated reflectively but was never registered
```

**解决方案**：使用 Fory 注册该类（不要添加到 reflect-config.json）：

```java
fory.register(MyClass.class);
fory.ensureSerializersCompiled();
```

如果该类具有私有构造函数，可以：

1. 添加 `fory-graalvm-feature` 依赖，或
2. 为该特定类创建 `reflect-config.json`

## 框架集成

对于集成 Fory 的框架开发者：

1. 为用户提供配置文件以列出可序列化的类
2. 加载这些类并为每个类调用 `fory.register(Class<?>)`
3. 完成所有注册后调用 `fory.ensureSerializersCompiled()`
4. 配置您的集成类以在构建时初始化

## 基准测试

Fory 与 GraalVM JDK 序列化的性能比较：

| 类型   | 压缩 | 速度      | 大小 |
| ------ | ---- | --------- | ---- |
| Struct | 关闭 | 46 倍更快 | 43%  |
| Struct | 开启 | 24 倍更快 | 31%  |
| Pojo   | 关闭 | 12 倍更快 | 56%  |
| Pojo   | 开启 | 12 倍更快 | 48%  |

查看 [Benchmark.java](https://github.com/apache/fory/blob/main/integration_tests/graalvm_tests/src/main/java/org/apache/fory/graalvm/Benchmark.java) 获取基准测试代码。

### Struct 基准测试

#### 类字段

```java
public class Struct implements Serializable {
  public int f1;
  public long f2;
  public float f3;
  public double f4;
  public int f5;
  public long f6;
  public float f7;
  public double f8;
  public int f9;
  public long f10;
  public float f11;
  public double f12;
}
```

#### 基准测试结果

无压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Struct
Compress number: false
Fory size: 76.0
JDK size: 178.0
Fory serialization took mills: 49
JDK serialization took mills: 2254
Compare speed: Fory is 45.70x speed of JDK
Compare size: Fory is 0.43x size of JDK
```

数字压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Struct
Compress number: true
Fory size: 55.0
JDK size: 178.0
Fory serialization took mills: 130
JDK serialization took mills: 3161
Compare speed: Fory is 24.16x speed of JDK
Compare size: Fory is 0.31x size of JDK
```

### Pojo 基准测试

#### 类字段

```java
public class Foo implements Serializable {
  int f1;
  String f2;
  List<String> f3;
  Map<String, Long> f4;
}
```

#### 基准测试结果

无压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Foo
Compress number: false
Fory size: 541.0
JDK size: 964.0
Fory serialization took mills: 1663
JDK serialization took mills: 16266
Compare speed: Fory is 12.19x speed of JDK
Compare size: Fory is 0.56x size of JDK
```

数字压缩：

```
Benchmark repeat number: 400000
Object type: class org.apache.fory.graalvm.Foo
Compress number: true
Fory size: 459.0
JDK size: 964.0
Fory serialization took mills: 1289
JDK serialization took mills: 15069
Compare speed: Fory is 12.11x speed of JDK
Compare size: Fory is 0.48x size of JDK
```
