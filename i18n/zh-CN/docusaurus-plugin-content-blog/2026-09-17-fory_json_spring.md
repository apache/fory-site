---
slug: fory_json_spring
title: "在 Spring MVC、WebFlux 和 Spring Boot 中使用 Apache Fory™ JSON"
description: "Spring Fory 实用指南：配置 Spring Boot 3.5 和 4，直接接入 Spring MVC 与 WebFlux，流式处理 JSON 数组和 NDJSON，并自定义 JSON 映射与输入大小限制。"
authors: [chaokunyang]
tags: [fory, java, json, spring, serialization]
---

Spring 应用可以使用 Apache Fory JSON 将 HTTP 请求体反序列化为 Java 对象，并将控制器的返回值序列化为 JSON。[Spring Fory](https://github.com/chaokunyang/spring-fory) 提供了 Spring MVC 消息转换器、Spring WebFlux 编解码器和 Spring Boot starter，将 Fory 接入 Web 框架。控制器仍然使用熟悉的 `@RequestBody`、返回值类型、`Mono` 和 `Flux` API。

本文从一个简单的订单 API 出发，介绍 JSON 映射配置、订单流的处理方式，以及不使用 Spring Boot 时的手动接入方法。示例使用 **Spring Fory 1.1.0**，要求 **Java 17 或更高版本**。

<!-- truncate -->

## Spring Fory 提供了什么

Fory JSON 读写标准 JSON，HTTP 客户端仍然使用 `Content-Type: application/json` 发送请求，并接收普通的 JSON 响应。集成层使用 Fory 的 UTF-8 字节 API，应用代码无需先把每个请求或响应转换成 JSON 字符串。

| 应用           | 集成组件                                | 控制器使用方式                                 |
| -------------- | --------------------------------------- | ---------------------------------------------- |
| Spring MVC     | `ForyJsonHttpMessageConverter`          | `@RequestBody Order`、`Order`、`List<Order>`   |
| Spring WebFlux | `ForyJsonDecoder` 和 `ForyJsonEncoder`  | `Mono<Order>`、`Flux<Order>`、带具体类型的集合 |
| Spring Boot    | starter 为当前 Web 应用类型安装对应集成 | 沿用 MVC 或 WebFlux 控制器 API                 |

`ForyJson` 是线程安全的，应当复用。Boot starter 会创建共享实例，直接使用 Spring 的应用则可以提供单例 Bean。Fory 的代码生成和直接字节处理机制可以参考 [Fory JSON 介绍](/blog/fory_json_fastest_java_json_framework)。序列化基准测试的结果不能直接代表 HTTP 接口的端到端吞吐量，业务处理、网络和响应大小同样会影响性能。

## 选择匹配的依赖

Spring Fory 提供两套集成模块，按应用版本选择对应的一行：

| Spring Boot | Spring Framework | Boot starter                     | 不使用 Boot 时的适配器 |
| ----------- | ---------------- | -------------------------------- | ---------------------- |
| 4.x         | 7.x              | `fory-json-spring-boot-starter`  | `fory-json-spring`     |
| 3.5.x       | 6.2.x            | `fory-json-spring-boot3-starter` | `fory-json-spring6`    |

这四个模块的 group ID 都是 `io.github.chaokunyang`，版本均为 `1.1.0`，可以从 Maven Central 获取。Spring Fory 的版本号与 `org.apache.fory` 库的版本号相互独立。

已有的 **Spring Boot 4** 应用添加以下依赖：

```xml title="pom.xml"
<dependency>
  <groupId>io.github.chaokunyang</groupId>
  <artifactId>fory-json-spring-boot-starter</artifactId>
  <version>1.1.0</version>
</dependency>
```

**Spring Boot 3.5** 则使用：

```xml title="pom.xml"
<dependency>
  <groupId>io.github.chaokunyang</groupId>
  <artifactId>fory-json-spring-boot3-starter</artifactId>
  <version>1.1.0</version>
</dependency>
```

Gradle 用户选择相同的 starter：

```kotlin title="build.gradle.kts"
repositories {
  mavenCentral()
}

dependencies {
  implementation("io.github.chaokunyang:fory-json-spring-boot-starter:1.1.0")
}
```

使用 Boot 3.5 时，将 artifact 改为 `fory-json-spring-boot3-starter`。每个 Fory starter 已经包含匹配的适配器和 Fory JSON 依赖，不要混用两套集成模块。

应用原有的 Web starter 也需要保留：

| 应用           | Spring Boot 4                 | Spring Boot 3.5               |
| -------------- | ----------------------------- | ----------------------------- |
| Servlet MVC    | `spring-boot-starter-webmvc`  | `spring-boot-starter-web`     |
| 响应式 WebFlux | `spring-boot-starter-webflux` | `spring-boot-starter-webflux` |

Spring 依赖的版本继续交给 Boot parent 或依赖管理配置决定。Fory starter 不能替代 Web starter，也不会单独提供嵌入式服务器。下面的 MVC 和 WebFlux 示例对应两种应用方案，请选择实际要运行的 Web 技术栈。

## 在 Spring Boot MVC 中使用

### 定义应用与数据模型

使用普通的 Boot 应用入口。将以下类放在 `example.orders` 包下，确保组件扫描能发现控制器和配置类：

```java title="OrdersApplication.java"
package example.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrdersApplication.class, args);
  }
}
```

API 模型使用 Java record。这里的注解来自 **Fory**，将 Java 成员 `customer` 映射为 JSON 属性 `customer_name`：

```java title="Order.java"
package example.orders;

import java.util.List;
import org.apache.fory.json.annotation.JsonProperty;

public record Order(
    long id,
    @JsonProperty("customer_name") String customer,
    List<String> items) {}
```

Fory 也支持普通 Java 类和 JavaBean。record 可以清晰地表达本例的构造方式和声明类型；其他模型形式参见[对象映射指南](/docs/json/object-mapping)。

### 读写具有明确类型的请求体

```java title="OrderController.java"
package example.orders;

import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrderController {
  @PostMapping(
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public Order echo(@RequestBody Order order) {
    return order;
  }

  @PostMapping(
      path = "/batch",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public List<Order> echoBatch(@RequestBody List<Order> orders) {
    return orders;
  }
}
```

starter 同时负责两个方向：在控制器执行前反序列化请求，在控制器返回后序列化结果。控制器内部无需调用 `toJson` 或 `fromJson`。

按项目原有的 Boot 启动方式运行应用，然后发送请求：

```bash
curl -i http://localhost:8080/orders \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  --data '{"id":42,"customer_name":"Ada","items":["book","pen"]}'
```

响应包含以下 JSON 值，属性顺序不影响含义：

```json
{ "id": 42, "customer_name": "Ada", "items": ["book", "pen"] }
```

`customer_name` 也是一个方便的接入检查点：使用这个模型时，输入和输出的属性名都应由 Fory 注解决定。

批量接口可以这样调用：

```bash
curl http://localhost:8080/orders/batch \
  -H 'Content-Type: application/json' \
  --data '[{"id":42,"customer_name":"Ada","items":["book"]}]'
```

响应是订单对象数组。转换器会保留 `List<Order>`、`Map<String, Order>` 等声明类型的泛型参数。API 请求体和返回值应使用明确、完整的类型；Fory 适配器不接受 `List<?>` 这样的通配符类型，也不接受尚未解析的类型变量。

### 保留 Boot 默认的 Web 配置

使用 starter 时不需要额外配置 MVC。Boot 4 通过服务端消息转换器配置选择 Fory JSON；Boot 3.5 将 Fory 转换器注册到默认 Jackson JSON 转换器之前。Jackson 可以继续保留在 classpath 中。

不要仅仅为了启用 Fory 就在 Boot 应用中添加 `@EnableWebMvc`，因为它会改变 MVC 配置的接管方式。可以沿用 Boot 自动配置并添加 starter；如果确实需要自行管理转换器，则使用后文的直接 Spring 接入方式。

## 在 Spring Boot WebFlux 中使用

添加匹配的 Fory starter 和 `spring-boot-starter-webflux`。复用前面的 `OrdersApplication` 与 `Order`，在响应式应用中使用以下控制器：

```java title="ReactiveOrderController.java"
package example.orders;

import java.time.Duration;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/orders")
public class ReactiveOrderController {
  @PostMapping(
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public Mono<Order> echo(@RequestBody Mono<Order> order) {
    return order;
  }

  @GetMapping(path = "/array", produces = MediaType.APPLICATION_JSON_VALUE)
  public Flux<Order> array() {
    return sampleOrders();
  }

  @GetMapping(path = "/stream", produces = MediaType.APPLICATION_NDJSON_VALUE)
  public Flux<Order> stream() {
    return sampleOrders().delayElements(Duration.ofMillis(250));
  }

  @PostMapping(
      path = "/import",
      consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_NDJSON_VALUE},
      produces = MediaType.APPLICATION_JSON_VALUE)
  public Mono<ImportResult> count(@RequestBody Flux<Order> orders) {
    return orders.count().map(ImportResult::new);
  }

  private Flux<Order> sampleOrders() {
    return Flux.just(
        new Order(42, "Ada", java.util.List.of("book")),
        new Order(43, "Lin", java.util.List.of("pen")));
  }

  public record ImportResult(long count) {}
}
```

### 选择单个值、数组或 NDJSON

声明的响应式类型和媒体类型共同决定 JSON 的表示方式：

| 控制器请求体或返回值类型 | 媒体类型               | 表示方式                         |
| ------------------------ | ---------------------- | -------------------------------- |
| `Mono<Order>`            | `application/json`     | 单个 JSON 对象                   |
| `Mono<List<Order>>`      | `application/json`     | 作为完整列表处理的一个 JSON 数组 |
| `Flux<Order>`            | `application/json`     | 包含流中各个订单的 JSON 数组     |
| `Flux<Order>`            | `application/x-ndjson` | 每行一个 JSON 对象               |

前面 MVC 示例的 POST 命令也适用于响应式的单订单接口。访问数组接口：

```bash
curl http://localhost:8080/orders/array
```

```json
[
  { "id": 42, "customer_name": "Ada", "items": ["book"] },
  { "id": 43, "customer_name": "Lin", "items": ["pen"] }
]
```

读取换行分隔的 JSON（NDJSON）时，关闭 curl 的输出缓冲：

```bash
curl -N http://localhost:8080/orders/stream \
  -H 'Accept: application/x-ndjson'
```

```text
{"id":42,"customer_name":"Ada","items":["book"]}
{"id":43,"customer_name":"Lin","items":["pen"]}
```

如果客户端需要在数据到达时逐条处理，可以选择 NDJSON。JSON 数组也会逐步输出，但直到收到末尾的 `]` 才是一个完整的 JSON 文档。使用完整文档读取 API 的客户端可能会等待流结束。NDJSON 与服务端发送事件（Server-Sent Events，`text/event-stream`）是不同的表示方式，本文示例使用 NDJSON。

### 读取传入的数据流

`/orders/import` 接口接受数组或 NDJSON，并返回订单数量。发送 NDJSON：

```bash
printf '%s\n' \
  '{"id":42,"customer_name":"Ada","items":["book"]}' \
  '{"id":43,"customer_name":"Lin","items":["pen"]}' | \
  curl http://localhost:8080/orders/import \
    -H 'Content-Type: application/x-ndjson' \
    -H 'Accept: application/json' \
    --data-binary @-
```

```json
{ "count": 2 }
```

发送数组时，将两个对象放在 `[...]` 中，并使用 `Content-Type: application/json`。即使一个值被拆分到多个网络缓冲区，解码器也能处理，并逐个输出订单。应用代码调用 `collectList()` 又会把这些订单全部累积起来；如果需要持续增量处理，应保留 `Flux` 处理链。由于 Reactor 不允许发出 null 值，解码为 `Flux` 时会跳过 JSON `null` 元素。

starter 配置的是当前 Web 应用类型。同时添加 MVC 和 WebFlux 依赖不会创建两个分别配置的服务器。如果应用的 classpath 中包含两者，但明确要运行响应式应用，可以设置 `spring.main.web-application-type=reactive`，并确认实际选择的应用类型。

## 自定义 JSON 映射

### 提供共享的 ForyJson Bean

如果应用已经提供 `ForyJson` Bean，两套 starter 都会使用它，不再创建默认实例。下面是一个可选配置：将 long 值写为字符串，同时省略对象中的空属性。

```java title="JsonConfiguration.java"
package example.orders;

import org.apache.fory.json.ForyJson;
import org.apache.fory.json.ForyJsonBuilder;
import org.apache.fory.json.ForyJsonModule;
import org.apache.fory.json.annotation.JsonProperty.Include;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class JsonConfiguration {
  @Bean
  public ForyJson foryJson(
      ApplicationContext applicationContext,
      ObjectProvider<ForyJsonModule> modules) {
    ForyJsonBuilder builder = ForyJson.builder()
        .withClassLoader(applicationContext.getClassLoader())
        .writeLongAsString(true)
        .defaultPropertyInclusion(Include.NON_EMPTY);
    modules.orderedStream().forEach(builder::withModule);
    return builder.build();
  }
}
```

启用后，返回 `new Order(42, "Ada", List.of())` 会得到：

```json
{ "id": "42", "customer_name": "Ada" }
```

当 long 标识符可能超出 JavaScript 的精确整数范围时，写为字符串便于客户端保留原值。这一选项会影响当前 JSON 配置下各处的 long 值，应当作为 API 契约的一部分来选择。

Fory 默认省略值为 null 的对象属性。`NON_EMPTY` 还会省略空字符串、空数组、空集合、空 Map 和无值的 Optional，但保留数字零和布尔值 false，也不会删除集合中的元素或 Map 中的条目。如果需要输出 null 属性，可以将上述 `NON_EMPTY` 设置替换为 builder 的 `writeNullFields(true)`。单个属性还可以使用 `@JsonProperty(include = Include.ALWAYS)` 覆盖省略规则。完整规则参见 [JSON 注解指南](/docs/json/annotations)。

### 安装模块和自定义编解码器

starter 创建默认 `ForyJson` 时，会查找所有 `ForyJsonModule` Bean，并按 Spring 的顺序安装。可以通过模块复用一组自定义编解码器或 Mixin，具体参见[模块指南](/docs/json/modules)和[自定义编解码器指南](/docs/json/custom-codecs)。

如果自行提供 `ForyJson` Bean，就需要自行安装模块。上面的配置显式保留了发现并安装模块 Bean 的行为。共享实例使用的自定义编解码器也必须是线程安全的。

### 显式迁移 Jackson 配置

Fory JSON 使用自己的注解、模块和 builder 选项。Jackson 的 `ObjectMapper` 配置、Jackson 注解以及 `spring.jackson.*` 设置不会配置 Fory。例如，属性改名需要导入 `org.apache.fory.json.annotation.JsonProperty`，null 或空值的处理需要使用 Fory 的属性输出选项。

迁移已有 API 时，应对比有代表性的请求和响应 JSON，尤其是属性名、null 省略、日期、枚举、数字格式以及自定义序列化器。控制器返回对象时，转换器才能应用这些规则；如果控制器已经返回序列化完成的 `String`，就不会经过 Fory 的对象转换器。

## 按 Web 技术栈设置输入限制

MVC 请求大小限制与 WebFlux 缓冲限制使用不同的配置项，作用范围也不同：

| 输入路径          | Spring Fory 中的默认值 | 作用范围                         |
| ----------------- | ---------------------- | -------------------------------- |
| MVC 请求体        | 64 MiB                 | Fory 转换器读取的完整请求体      |
| WebFlux `Mono<T>` | 未覆盖配置时为 256 KiB | 聚合后的完整 JSON 输入           |
| WebFlux `Flux<T>` | 未覆盖配置时为 256 KiB | 数组或 NDJSON 流中的每个 JSON 值 |

对于 MVC，两套 Boot starter 都接受一个正整数，单位为字节：

```properties title="application.properties"
fory.json.max-input-bytes=8388608
```

上面的配置将请求体限制为 8 MiB。转换器检查实际读取的字节数，也覆盖没有已知 `Content-Length` 的请求。

**Boot 4 WebFlux** 使用：

```properties title="application.properties"
spring.http.codecs.max-in-memory-size=8MB
```

**Boot 3.5 WebFlux** 使用：

```properties title="application.properties"
spring.codec.max-in-memory-size=8MB
```

`fory.json.max-input-bytes` 不会设置 WebFlux 解码器的限制。还需要区分 `Flux<Order>` 和 `Mono<List<Order>>`：流的总大小可以超过单值限制，只要每个订单在限制以内；通过 `Mono` 读取列表时，完整输入必须在限制以内。单值大小限制不会限制流的总条目数或持续时间，接口有这类要求时需要另行配置。

## 不使用 Boot 时接入 Spring MVC

直接使用 Spring Framework 的应用添加适配器依赖。**Spring 7** 使用：

```xml title="pom.xml"
<dependency>
  <groupId>io.github.chaokunyang</groupId>
  <artifactId>fory-json-spring</artifactId>
  <version>1.1.0</version>
</dependency>
```

**Spring 6.2** 将 artifact 替换为 `fory-json-spring6`。保留应用原有的 Spring Web 依赖和服务器配置，并注册共享的 `ForyJson` Bean。可以复用前面的 `JsonConfiguration`，也可以将其中的 builder 改为使用默认选项。

在已经启用 Spring MVC 的应用中，通过 import 或组件扫描注册下面的 **Spring 7** 配置：

```java title="ForyMvcConfiguration.java"
package example.orders;

import io.github.chaokunyang.springfory.ForyJsonHttpMessageConverter;
import org.apache.fory.json.ForyJson;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverters;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class ForyMvcConfiguration implements WebMvcConfigurer {
  private final ForyJson json;

  public ForyMvcConfiguration(ForyJson json) {
    this.json = json;
  }

  @Override
  public void configureMessageConverters(HttpMessageConverters.ServerBuilder builder) {
    builder.withJsonConverter(new ForyJsonHttpMessageConverter(json, 8 * 1024 * 1024));
  }
}
```

**Spring 6.2** 改用基于列表的扩展入口：

```java title="ForyMvcConfiguration.java"
package example.orders;

import io.github.chaokunyang.springfory.ForyJsonHttpMessageConverter;
import java.util.List;
import org.apache.fory.json.ForyJson;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class ForyMvcConfiguration implements WebMvcConfigurer {
  private final ForyJson json;

  public ForyMvcConfiguration(ForyJson json) {
    this.json = json;
  }

  @Override
  public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
    converters.add(0, new ForyJsonHttpMessageConverter(json, 8 * 1024 * 1024));
  }
}
```

把转换器放在首位，可以让它优先处理所支持的 JSON 对象，同时保留其他转换器。这里使用 `extendMessageConverters`，以便继续使用已有的转换器集合。如果是新建的非 Boot Java 配置应用，还需要按常规方式通过 `@EnableWebMvc` 启用 MVC，并注册这些配置类。

## 不使用 Boot 时接入 Spring WebFlux

按照 Spring 版本选择同一套直接适配器依赖，并提供共享的 `ForyJson` Bean。在已经启用 WebFlux 的应用中，同时注册编码器和解码器。**Spring 7** 使用：

```java title="ForyWebFluxConfiguration.java"
package example.orders;

import io.github.chaokunyang.springfory.ForyJsonDecoder;
import io.github.chaokunyang.springfory.ForyJsonEncoder;
import org.apache.fory.json.ForyJson;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration(proxyBeanMethods = false)
public class ForyWebFluxConfiguration implements WebFluxConfigurer {
  private final ForyJson json;

  public ForyWebFluxConfiguration(ForyJson json) {
    this.json = json;
  }

  @Override
  public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
    configurer.defaultCodecs().jacksonJsonEncoder(new ForyJsonEncoder(json));
    configurer.defaultCodecs().jacksonJsonDecoder(new ForyJsonDecoder(json));
    configurer.defaultCodecs().maxInMemorySize(8 * 1024 * 1024);
  }
}
```

**Spring 6.2** 将两个注册调用替换为它的 Jackson 2 编解码器配置入口：

```java
configurer.defaultCodecs().jackson2JsonEncoder(new ForyJsonEncoder(json));
configurer.defaultCodecs().jackson2JsonDecoder(new ForyJsonDecoder(json));
```

这些入口名称属于 Spring 的配置 API，传入的编码器和解码器实际使用 Fory JSON。`maxInMemorySize` 配置的是默认编解码器集合，因此也可能影响使用该限制的其他编解码器。新建的非 Boot 应用仍然需要常规的 `@EnableWebFlux` 配置和响应式服务器。使用前面的 Boot starter 方案时，无需再叠加这些手动注册。

## HTTP 类型与接入检查

MVC 转换器和 WebFlux 编解码器支持 UTF-8 的 `application/json` 和 `application/*+json`，WebFlux 还支持 `application/x-ndjson`。`String` 及其他 `CharSequence` 请求体或响应体、`byte[]`、`Resource` 和 `ResourceRegion` 交给 Spring 的其他转换器或编解码器处理，因此文本响应和文件下载仍然沿用各自的 HTTP 处理方式。

集成层支持 Spring 的 `ProblemDetail`，包括 `application/problem+json`，扩展属性会写为 JSON 顶层成员。选择 Fory 后，错误响应仍可保留 Spring 的问题详情表示方式。

替换已有应用的 JSON 处理方式前，可以执行以下几项 HTTP 检查：

| 检查项               | 要确认的行为                                     |
| -------------------- | ------------------------------------------------ |
| 带注解对象的读写往返 | 输入和输出都使用 Fory `@JsonProperty` 指定的名称 |
| 带具体类型的集合     | `List<Order>` 请求中的元素以订单对象进入控制器   |
| 响应式输出           | JSON 数组有方括号，NDJSON 每行一个值             |
| 已有 API 示例        | 属性名、可选值和自定义格式符合接口契约           |
| 大请求               | 所选 Boot 版本与 Web 技术栈对应的大小限制生效    |

如果某个响应似乎没有使用 Fory，先检查 starter 是否匹配、当前 Web 应用类型、响应类型、媒体类型，以及自定义的 MVC 或 WebFlux 配置。直接返回字符串，或自行替换 Boot Web 默认配置的接口，与普通 DTO 接口的排查方向不同。

[Spring Fory 仓库](https://github.com/chaokunyang/spring-fory)包含两套 Spring 集成的适配器与集成测试。[Fory JSON 指南](/docs/json)进一步介绍了模型映射、注解、模块和自定义编解码器，可用于扩展本文的 HTTP 示例。
