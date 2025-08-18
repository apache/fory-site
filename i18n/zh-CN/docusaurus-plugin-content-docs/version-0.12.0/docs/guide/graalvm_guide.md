---
title: GraalVM 序列化
sidebar_position: 6
id: graalvm_guide
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

GraalVM 的 `native image` 能将 Java 代码提前编译为本地代码，从而构建更快、更小、更精简的应用。
Native image 不包含 JIT 编译器，无法在运行时将字节码编译为机器码，也不支持反射，除非配置反射元数据文件。

Fory 在 GraalVM native image 下运行良好。Fory 会在 graalvm 构建阶段为 `Fory JIT framework` 和 `MethodHandle/LambdaMetafactory` 生成所有序列化器代码，运行时直接使用这些生成的代码进行序列化，无需额外开销，性能优异。

在 graalvm native image 下使用 Fory 时，必须将 Fory 创建为类的**静态**字段，并在类初始化时**注册**所有类型。然后在 `resources/META-INF/native-image/$xxx/native-image.properties` 下配置 `native-image.properties`，告知 graalvm 在 native image 构建时初始化该类。例如，配置 `org.apache.fory.graalvm.Example` 类在构建时初始化：

```properties
Args = --initialize-at-build-time=org.apache.fory.graalvm.Example
```

使用 fory 的另一个好处是无需配置繁琐的 [reflection json](https://www.graalvm.org/latest/reference-manual/native-image/metadata/#specifying-reflection-metadata-in-json) 和 [serialization json](https://www.graalvm.org/latest/reference-manual/native-image/metadata/#serialization)。只需对每个需要序列化的类型调用 `org.apache.fory.Fory.register(Class<?>, boolean)` 即可。

注意：Fory 的 `asyncCompilationEnabled` 选项在 graalvm native image 下会自动禁用，因为 native image 运行时不支持 JIT。

## 非线程安全 Fory

示例：

```java
import org.apache.fory.Fory;
import org.apache.fory.util.Preconditions;

import java.util.List;
import java.util.Map;

public class Example {
  public record Record (
    int f1,
    String f2,
    List<String> f3,
    Map<String, Long> f4) {
  }

  static Fory fory;

  static {
    fory = Fory.builder().build();
    // 注册并生成序列化器代码。
    fory.register(Record.class, true);
  }

  public static void main(String[] args) {
    Record record = new Record(10, "abc", List.of("str1", "str2"), Map.of("k1", 10L, "k2", 20L));
    System.out.println(record);
    byte[] bytes = fory.serialize(record);
    Object o = fory.deserialize(bytes);
    System.out.println(o);
    Preconditions.checkArgument(record.equals(o));
  }
}
```

然后在 `native-image.properties` 配置中添加 `org.apache.fory.graalvm.Example` 的构建时初始化：

```properties
Args = --initialize-at-build-time=org.apache.fory.graalvm.Example
```

## 线程安全 Fory

```java
import org.apache.fory.Fory;
import org.apache.fory.ThreadLocalFory;
import org.apache.fory.ThreadSafeFory;
import org.apache.fory.util.Preconditions;

import java.util.List;
import java.util.Map;

public class ThreadSafeExample {
  public record Foo (
    int f1,
    String f2,
    List<String> f3,
    Map<String, Long> f4) {
  }

  static ThreadSafeFory fory;

  static {
    fory = new ThreadLocalFory(classLoader -> {
      Fory f = Fory.builder().build();
      // 注册并生成序列化器代码。
      f.register(Foo.class, true);
      return f;
    });
  }

  public static void main(String[] args) {
    System.out.println(fory.deserialize(fory.serialize("abc")));
    System.out.println(fory.deserialize(fory.serialize(List.of(1,2,3))));
    System.out.println(fory.deserialize(fory.serialize(Map.of("k1", 1, "k2", 2))));
    Foo foo = new Foo(10, "abc", List.of("str1", "str2"), Map.of("k1", 10L, "k2", 20L));
    System.out.println(foo);
    byte[] bytes = fory.serialize(foo);
    Object o = fory.deserialize(bytes);
    System.out.println(o);
  }
}
```

然后在 `native-image.properties` 配置中添加 `org.apache.fory.graalvm.ThreadSafeExample` 的构建时初始化：

```properties
Args = --initialize-at-build-time=org.apache.fory.graalvm.ThreadSafeExample
```

## 框架集成

对于框架开发者，如果希望集成 fory 作为序列化方案，可以提供一个配置文件，让用户列出所有需要序列化的类，然后加载这些类并在 Fory 集成类中调用 `org.apache.fory.Fory.register(Class<?>, boolean)` 进行注册，并配置该类在 graalvm native image 构建时初始化。

## Benchmark

这里给出 Fory 与 Graalvm Serialization 的两个类的基准测试。

Fory 未开启压缩时：

- Struct：Fory 为 JDK 的 `46x 速度，43% 大小`
- Pojo：Fory 为 JDK 的 `12x 速度，56% 大小`

Fory 开启压缩时：

- Struct：Fory 为 JDK 的 `24x 速度，31% 大小`
- Pojo：Fory 为 JDK 的 `12x 速度，48% 大小`

基准测试代码见 [[Benchmark.java](https://github.com/apache/fory/blob/main/integration_tests/graalvm_tests/src/main/java/org/apache/fory/graalvm/Benchmark.java)]。

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

#### Benchmark 结果

未压缩：

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

压缩：

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

#### Benchmark 结果

未压缩：

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

压缩：

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
