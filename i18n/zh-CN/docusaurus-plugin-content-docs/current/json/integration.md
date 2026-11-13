---
title: 框架集成
sidebar_position: 13
id: integration
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

## Spring Fory

[spring-fory](https://github.com/chaokunyang/spring-fory) 为 Fory JSON 提供 Spring MVC 消息转换器、
Spring WebFlux 编解码器以及 Spring Boot 自动配置 starter。它支持常规 JSON 请求和响应体，
并在 WebFlux 中支持流式 JSON 和 NDJSON。

请参阅项目的[安装和使用指南](https://github.com/chaokunyang/spring-fory#installation)，
选择与 Spring 版本匹配的适配器或 starter，并配置应用。

## Kotlin 集成 {#kotlin-integration}

当框架在运行时提供 Kotlin `KType`，且回调无法使用 reified 类型参数时，请使用
`jsonTypeRef<Any?>(kType)`。传入的 `KType` 决定完整 JSON 类型，包括嵌套泛型参数和可空性。
`Any?` 只是回调中值的静态视图，不会将传入类型替换为动态 JSON Schema。

从 Kotlin 函数或 Java `Method` 获取 `KType`，需要应用添加 `kotlin-reflect` 依赖。
其版本应与应用的 Kotlin 版本保持一致：

```kotlin
dependencies {
  implementation(kotlin("reflect"))
}
```

例如，发现并保留控制器方法的响应类型：

```kotlin
import java.io.OutputStream
import kotlin.reflect.jvm.kotlinFunction
import org.apache.fory.json.kotlin.ForyJsonKotlin
import org.apache.fory.json.kotlin.jsonTypeRef

data class Employee(val id: Long, val name: String)
data class Response<T>(val flag: Boolean, val data: T? = null, val msg: String? = null)

class EmployeeController {
  fun employees(): Response<List<Employee>> =
    Response(true, listOf(Employee(1, "Alice")))
}

val json = ForyJsonKotlin.builder().build()
val method = EmployeeController::class.java.getMethod("employees")
val responseType = jsonTypeRef<Any?>(requireNotNull(method.kotlinFunction).returnType)

fun writeResponse(value: Any?, output: OutputStream) {
  json.writeJsonTo(value, responseType, output)
}

fun readResponse(bytes: ByteArray): Any? = json.fromJson(bytes, responseType)
```

每个声明类型只需发现一次，并复用对应类型令牌。对于请求体，应获取对应 Kotlin 值参数的
`KType`。如果方法仍有未解析的类型参数，转换前必须提供具体类型实参；星投影和逆变投影仍不受支持。
若选择了比 `Any?` 更具体的静态类型，调用方必须保证它与传入的 `KType` 一致。

在 Spring MVC 中，将请求或响应适配到转换器时，应保留控制器的 Kotlin 声明。
`SmartHttpMessageConverter` 可以通过应用提供的读写 hints 接收该 `KType` 或 Fory 类型令牌。
如果存在 `ResponseEntity<Response<List<Employee>>>` 等 HTTP 包装类型，
应先选取消息体类型 `Response<List<Employee>>`，再构造令牌。

只提供运行时对象的 `AbstractHttpMessageConverter` 回调会丢失泛型参数。
`AbstractGenericHttpMessageConverter` 能保留 Java 泛型，但 `TypeRef.of(javaType)` 无法恢复 Kotlin
可空性。单独使用 Java `Type` 或运行时值，都无法恢复完整 Kotlin 声明。
应在获取该声明后使用 `jsonTypeRef(kType)`；此 API 不会自动安装 Spring 转换器。

## 逐个读写 token {#token-level-reading-and-writing}

自带序列化器的框架可以直接使用 Fory JSON 的 UTF-8 读取器和写入器。`readUtf8` 接受 `Function<Utf8JsonReader, R>` 并返回回调结果。`writeUtf8` 接受 `Consumer<Utf8JsonWriter>` 并返回写出的字节：

```java
ForyJson json = ForyJson.builder().build();

byte[] bytes =
    json.writeUtf8(
        writer -> {
          writer.writeObjectStart();
          writer.writeFieldName("id");
          writer.writeInt(7);
          writer.writeObjectEnd();
        });

int id =
    json.readUtf8(
        bytes,
        0,
        bytes.length,
        reader -> {
          reader.expectNextToken('{');
          String name = reader.readFieldName(); // "id"
          reader.expect(':');
          int value = reader.readInt();
          reader.expectNextToken('}');
          return value;
        });
```

每次调用须同步读写一个完整 JSON 值，读取器和写入器仅在回调期间有效。回调返回后，若剩余输入包含非空白字符，`readUtf8` 会报错。

`expectNextToken` 等方法不会自动记录嵌套深度或内存分配。处理不可信输入时，自定义反序列化器应在读每个对象或数组前后调用 `reader.enterDepth()` 和 `reader.exitDepth()`，并在分配容器前调用 `reader.reserveGraphMemory(bytes)`，以应用实例的 `maxDepth` 和对象图内存限制。详见[安全指南](security.md)。回调抛出的非受检异常会原样传播，受检异常需由集成代码包装，例如将 `IOException` 包装为 `UncheckedIOException`。同一个 `ForyJson` 实例上的这些根操作不可重入。
