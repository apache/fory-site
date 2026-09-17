---
slug: fory_json_spring
title: "Using Apache Fory™ JSON with Spring MVC, WebFlux, and Spring Boot"
description: "A practical guide to Spring Fory: configure Spring Boot 3.5 or 4, integrate directly with Spring MVC and WebFlux, stream JSON arrays and NDJSON, and customize JSON mapping and input limits."
authors: [chaokunyang]
tags: [fory, java, json, spring, serialization]
---

Spring applications can use Apache Fory JSON to read HTTP request bodies into Java objects and write controller results as JSON. [Spring Fory](https://github.com/chaokunyang/spring-fory) supplies the Spring MVC message converter, Spring WebFlux codecs, and Spring Boot starters that connect Fory to the web framework. Controllers keep their usual `@RequestBody`, return types, `Mono`, and `Flux` APIs.

This guide builds a small order API, then shows how to configure JSON mapping, stream a sequence of orders, and integrate without Spring Boot. The examples use **Spring Fory 1.1.0** and require **Java 17 or later**.

<!-- truncate -->

## What Spring Fory Adds

Fory JSON reads and writes standard JSON, so HTTP clients continue to send `Content-Type: application/json` and consume normal JSON responses. The integration uses Fory's UTF-8 byte APIs; application code does not need to turn each request or response into a JSON string.

| Application    | Integration                                                            | Controller contract                             |
| -------------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| Spring MVC     | `ForyJsonHttpMessageConverter`                                         | `@RequestBody Order`, `Order`, `List<Order>`    |
| Spring WebFlux | `ForyJsonDecoder` and `ForyJsonEncoder`                                | `Mono<Order>`, `Flux<Order>`, typed collections |
| Spring Boot    | A starter installs the integration for the active web application type | The same MVC or WebFlux controller APIs         |

`ForyJson` is thread-safe and intended to be reused. The Boot starters create a shared instance, and direct Spring applications can provide a singleton bean. Fory's generated codecs and direct byte processing are described in the [Fory JSON introduction](/blog/fory_json_fastest_java_json_framework). Serialization benchmark results do not by themselves predict end-to-end HTTP throughput; application work, networking, and response sizes still matter.

## Choose the Matching Dependency

Spring Fory publishes two integration lines. Select the row matching your application:

| Spring Boot | Spring Framework | Boot starter                     | Adapter for applications without Boot |
| ----------- | ---------------- | -------------------------------- | ------------------------------------- |
| 4.x         | 7.x              | `fory-json-spring-boot-starter`  | `fory-json-spring`                    |
| 3.5.x       | 6.2.x            | `fory-json-spring-boot3-starter` | `fory-json-spring6`                   |

All four artifacts use group ID `io.github.chaokunyang` and version `1.1.0`. They are available from Maven Central. Spring Fory's version is independent of the `org.apache.fory` library version.

For an existing **Spring Boot 4** application, add:

```xml title="pom.xml"
<dependency>
  <groupId>io.github.chaokunyang</groupId>
  <artifactId>fory-json-spring-boot-starter</artifactId>
  <version>1.1.0</version>
</dependency>
```

For **Spring Boot 3.5**, use this dependency instead:

```xml title="pom.xml"
<dependency>
  <groupId>io.github.chaokunyang</groupId>
  <artifactId>fory-json-spring-boot3-starter</artifactId>
  <version>1.1.0</version>
</dependency>
```

Gradle users can select the same starter:

```kotlin title="build.gradle.kts"
repositories {
  mavenCentral()
}

dependencies {
  implementation("io.github.chaokunyang:fory-json-spring-boot-starter:1.1.0")
}
```

For Boot 3.5, change the artifact to `fory-json-spring-boot3-starter`. Each Fory starter already brings its matching adapter and Fory JSON dependency. Do not combine the two integration lines.

Keep the application's normal web starter as well:

| Application      | Spring Boot 4                 | Spring Boot 3.5               |
| ---------------- | ----------------------------- | ----------------------------- |
| Servlet MVC      | `spring-boot-starter-webmvc`  | `spring-boot-starter-web`     |
| Reactive WebFlux | `spring-boot-starter-webflux` | `spring-boot-starter-webflux` |

Let your Boot parent or dependency management choose the versions of Spring dependencies. The Fory starter does not replace the web starter or supply an embedded server on its own. The following MVC and WebFlux examples are alternative applications; choose the web stack you intend to run.

## Spring Boot with Spring MVC

### Define the Application and Model

Use a normal Boot application entry point. Put the following classes in package `example.orders`, so component scanning finds the controllers and configuration:

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

The API model is a Java record. Its annotation comes from **Fory**, and maps the Java component `customer` to the JSON member `customer_name`:

```java title="Order.java"
package example.orders;

import java.util.List;
import org.apache.fory.json.annotation.JsonProperty;

public record Order(
    long id,
    @JsonProperty("customer_name") String customer,
    List<String> items) {}
```

Fory also supports ordinary Java classes and beans. Records make this example's construction and declared types explicit; see [object mapping](/docs/json/object-mapping) for other model shapes.

### Read and Write Typed Request Bodies

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

The starter handles both directions: it deserializes the request before the controller runs and serializes the return value afterward. There is no need to call `toJson` or `fromJson` inside the controller.

Start the application using your normal Boot workflow, then send:

```bash
curl -i http://localhost:8080/orders \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  --data '{"id":42,"customer_name":"Ada","items":["book","pen"]}'
```

The response contains these JSON values; member order is not significant:

```json
{ "id": 42, "customer_name": "Ada", "items": ["book", "pen"] }
```

The `customer_name` member is also a useful integration check: with this model, the Fory annotation must control both input and output.

For the batch endpoint:

```bash
curl http://localhost:8080/orders/batch \
  -H 'Content-Type: application/json' \
  --data '[{"id":42,"customer_name":"Ada","items":["book"]}]'
```

The response is an array of order objects. The converter retains declared generic arguments for types such as `List<Order>` and `Map<String, Order>`. Use concrete, fully resolved types for API bodies; wildcard types such as `List<?>` and unresolved type variables are not accepted by the Fory adapter.

### Keep the Default Boot Web Configuration

With the starter, no additional MVC configuration is needed. Boot 4 selects the Fory JSON converter through its server converter configuration; Boot 3.5 registers the Fory converter ahead of the default Jackson JSON converter. Jackson can remain on the classpath.

Do not add `@EnableWebMvc` just to enable Fory in a Boot application. That annotation changes who owns MVC configuration. Use the starter with normal Boot auto-configuration, or deliberately manage the converters using the direct Spring setup below.

## Spring Boot with Spring WebFlux

Use the matching Fory starter together with `spring-boot-starter-webflux`. Reuse `OrdersApplication` and `Order` from above, and use this controller in the reactive application:

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

### Choose Between One Value, an Array, and NDJSON

The declared reactive type and media type define the JSON representation:

| Controller body type | Media type             | Representation                             |
| -------------------- | ---------------------- | ------------------------------------------ |
| `Mono<Order>`        | `application/json`     | One JSON object                            |
| `Mono<List<Order>>`  | `application/json`     | One JSON array handled as a complete list  |
| `Flux<Order>`        | `application/json`     | A JSON array containing the emitted orders |
| `Flux<Order>`        | `application/x-ndjson` | One JSON object per line                   |

The same POST command used for MVC exercises the reactive single-order endpoint. For the array endpoint:

```bash
curl http://localhost:8080/orders/array
```

```json
[
  { "id": 42, "customer_name": "Ada", "items": ["book"] },
  { "id": 43, "customer_name": "Lin", "items": ["pen"] }
]
```

For newline-delimited JSON (NDJSON), disable curl's output buffering:

```bash
curl -N http://localhost:8080/orders/stream \
  -H 'Accept: application/x-ndjson'
```

```text
{"id":42,"customer_name":"Ada","items":["book"]}
{"id":43,"customer_name":"Lin","items":["pen"]}
```

Use NDJSON when clients should process independent values as they arrive. A JSON array is emitted incrementally too, but becomes a complete JSON document only after its closing `]`. A client calling an API that reads an entire JSON document may wait for completion. NDJSON is a separate representation from Server-Sent Events (`text/event-stream`); these examples use NDJSON.

### Read an Incoming Stream

The `/orders/import` endpoint accepts either an array or NDJSON and returns a count. For NDJSON:

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

For an array, send the two objects inside `[...]` with `Content-Type: application/json`. The decoder can handle a value split across network buffers and emit orders individually. Calling `collectList()` in application code would accumulate those orders again; keep a `Flux` pipeline when processing should remain incremental. JSON `null` elements are skipped when decoding a `Flux`, since Reactor does not allow null emissions.

The starter configures the active web application type. Adding both MVC and WebFlux dependencies does not create two independently configured servers. If a mixed-classpath application is intentionally reactive, configure `spring.main.web-application-type=reactive` and verify the selected application type.

## Customize JSON Mapping

### Supply a Shared ForyJson Bean

Both starters use an application-provided `ForyJson` bean instead of creating the default one. This optional configuration writes long values as strings and omits empty object properties:

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

With this configuration, returning `new Order(42, "Ada", List.of())` produces:

```json
{ "id": "42", "customer_name": "Ada" }
```

Writing long identifiers as strings is useful when a JavaScript client must preserve values beyond its exact integer range. This option affects long values throughout the configured JSON mapping, so choose it as part of the API contract.

By default, Fory omits null object properties. `NON_EMPTY` additionally omits empty strings, arrays, collections, maps, and absent optionals. It keeps numeric zero and boolean false, and does not remove elements from collections or entries from maps. To include null properties instead, use `writeNullFields(true)` in the builder rather than the `NON_EMPTY` setting above. Per-property `@JsonProperty(include = Include.ALWAYS)` can override omission for one property. See [JSON annotations](/docs/json/annotations) for the full rules.

### Install Modules and Custom Codecs

When the starter creates the default `ForyJson`, it discovers `ForyJsonModule` beans and installs them in Spring order. This is useful for a reusable collection of custom codecs or Mixins; see the [module guide](/docs/json/modules) and [custom codec guide](/docs/json/custom-codecs).

When you provide your own `ForyJson` bean, module installation becomes your responsibility. The configuration above explicitly retains the module-bean behavior. Custom codecs shared by that instance must be thread-safe.

### Migrate Jackson Settings Explicitly

Fory JSON uses its own annotations, modules, and builder options. Jackson's `ObjectMapper` configuration, Jackson annotations, and `spring.jackson.*` settings do not configure Fory. For example, import `org.apache.fory.json.annotation.JsonProperty` for field names, and use Fory's property-inclusion options for null or empty values.

When migrating an existing API, compare representative request and response JSON, especially field names, null omission, dates, enums, numeric formatting, and custom serializers. Returning an object lets the converter apply these rules. A controller that already returns a serialized `String` does not exercise the Fory object converter.

## Set Input Limits for the Web Stack

MVC request limits and WebFlux buffering limits use different settings and have different scopes:

| Input path        | Default in Spring Fory    | Scope                                         |
| ----------------- | ------------------------- | --------------------------------------------- |
| MVC request body  | 64 MiB                    | Complete body consumed by the Fory converter  |
| WebFlux `Mono<T>` | 256 KiB unless overridden | Complete aggregated JSON input                |
| WebFlux `Flux<T>` | 256 KiB unless overridden | Each JSON value in the array or NDJSON stream |

For MVC, both Boot starters accept a positive byte count:

```properties title="application.properties"
fory.json.max-input-bytes=8388608
```

This example sets an 8 MiB body limit. The converter checks bytes actually read, including requests without a known `Content-Length`.

For **Boot 4 WebFlux**, use:

```properties title="application.properties"
spring.http.codecs.max-in-memory-size=8MB
```

For **Boot 3.5 WebFlux**, use:

```properties title="application.properties"
spring.codec.max-in-memory-size=8MB
```

`fory.json.max-input-bytes` does not set the WebFlux decoder limit. Also distinguish `Flux<Order>` from `Mono<List<Order>>`: a stream can exceed the per-value limit in total while each order stays within it, whereas a list read through `Mono` must fit as a complete input. Per-value limits do not impose a total item count or a duration limit on a stream; configure those separately when the endpoint needs them.

## Use Spring MVC Without Boot

For a Spring Framework application, add the adapter directly. With **Spring 7**:

```xml title="pom.xml"
<dependency>
  <groupId>io.github.chaokunyang</groupId>
  <artifactId>fory-json-spring</artifactId>
  <version>1.1.0</version>
</dependency>
```

For **Spring 6.2**, replace the artifact with `fory-json-spring6`. Keep your application's existing Spring web dependencies and server setup. Register a shared `ForyJson` bean; `JsonConfiguration` above can be reused, or its builder can simply use the defaults.

In an application that already enables Spring MVC, import or component-scan this **Spring 7** configuration:

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

For **Spring 6.2**, use its list-based extension point instead:

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

Placing the converter first gives it priority for supported JSON objects while preserving the other converters. Use `extendMessageConverters` here so the existing converter set remains available. In a new non-Boot Java configuration, enable MVC through your normal `@EnableWebMvc` setup and register these configuration classes with it.

## Use Spring WebFlux Without Boot

Use the same direct adapter dependency for your Spring version and the shared `ForyJson` bean. In an application that already enables WebFlux, register both directions. For **Spring 7**:

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

For **Spring 6.2**, replace the two registration calls with its Jackson 2 codec slots:

```java
configurer.defaultCodecs().jackson2JsonEncoder(new ForyJsonEncoder(json));
configurer.defaultCodecs().jackson2JsonDecoder(new ForyJsonDecoder(json));
```

These slot names are Spring configuration APIs; the supplied encoder and decoder use Fory JSON. `maxInMemorySize` configures the default codec set, so it can also affect other codecs using that limit. A new non-Boot application still needs its normal `@EnableWebFlux` configuration and reactive server setup. Do not add these manual registrations on top of the Boot starter examples.

## HTTP Types and Integration Checks

The MVC converter and WebFlux codecs support UTF-8 `application/json` and `application/*+json`. WebFlux additionally supports `application/x-ndjson`. `String` and other `CharSequence` bodies, `byte[]`, `Resource`, and `ResourceRegion` are left to Spring's other converters or codecs. This lets text responses and downloads continue using their own HTTP handling.

Spring's `ProblemDetail` is supported, including `application/problem+json`; extension properties are written as top-level JSON members. This allows an error response to retain Spring's problem-details representation when Fory is selected.

Before switching an existing application's JSON handling, exercise a small set of HTTP checks:

| Check                       | What to verify                                                         |
| --------------------------- | ---------------------------------------------------------------------- |
| Annotated object round trip | A Fory `@JsonProperty` name is honored in both directions              |
| Typed collection            | A `List<Order>` request reaches the controller as orders               |
| Reactive output             | JSON arrays have brackets; NDJSON has one value per line               |
| Existing API examples       | Field names, optional values, and custom formatting match the contract |
| Large requests              | The setting for the selected Boot version and web stack takes effect   |

If Fory does not appear to handle a response, first check the selected starter, active web application type, response type, media type, and any custom MVC or WebFlux configuration. A raw string response or a configuration that replaces Boot's web defaults needs different investigation from an ordinary DTO endpoint.

The [Spring Fory repository](https://github.com/chaokunyang/spring-fory) contains the adapters and integration tests for both Spring lines. The [Fory JSON guides](/docs/json) cover model mapping, annotations, modules, and custom codecs beyond the HTTP examples shown here.
