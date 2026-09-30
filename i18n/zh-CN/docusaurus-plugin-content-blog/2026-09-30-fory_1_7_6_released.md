---
slug: fory_1_7_6_release
title: Fory v1.7.6 发布
description: "Fory 1.7.6 新增可选的 JSON 构造函数属性缺失校验，并在 NON_DEFAULT 包含策略下保留没有默认值的属性。"
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala]
---

Apache Fory 1.7.6 已发布。本次发布改进了 Java、Scala 和 Kotlin 的 JSON 构造函数属性处理。
安装方式请参阅[快速开始](/zh-CN/docs/start/)。

## 主要更新

- 通过 `failOnMissingRequiredProperties(true)` 显式启用必需构造函数属性的缺失校验。
- `NON_DEFAULT` 包含策略保留没有默认值的属性，包括必需构造函数属性。

## 必需的构造函数属性

当输入必须包含未声明默认值的普通构造函数属性时，可以启用 `failOnMissingRequiredProperties(true)`。
下面以 Java record 为例：

```java
import org.apache.fory.json.ForyJson;

record Request(int id) {}

ForyJson json = ForyJson.builder()
    .failOnMissingRequiredProperties(true)
    .build();

Request request = json.fromJson("{\"id\":42}", Request.class);
json.fromJson("{}", Request.class); // Fails because id is missing.
```

该选项默认关闭，适用于 Java record、基于属性的 `JsonCreator` 模型、Scala case class 和 Kotlin
构造函数模型，包括嵌套对象。声明的语言默认值以及现有的 Optional 或容器默认值仍然可用。
显式 null 继续遵循属性的类型和可空性规则。

对于 Kotlin，启用此选项后，没有默认值的可空构造函数属性也必须出现在输入中，但其值可以是 null。
此选项不改变写入：如果包含策略省略了必需属性，严格读取器可能拒绝这些输出。

详细规则见[必需的构造函数属性](/zh-CN/docs/json/object-mapping#required-constructor-properties)，
以及 [Kotlin](/zh-CN/docs/json/kotlin/) 和 [Scala](/zh-CN/docs/json/scala/) 指南。

## 保留没有默认值的属性

字段级和类级 `NON_DEFAULT` 包含策略现在都会保留没有默认值的属性，包括 null、零、false 和空值。
例如，Scala case class 可以省略声明的默认值，同时保留必需的标识符：

```scala
import org.apache.fory.json.annotation.JsonInclude
import org.apache.fory.json.annotation.JsonProperty.Include
import org.apache.fory.json.scala.ForyJsonScala

@JsonInclude(Include.NON_DEFAULT)
case class Request(id: Int, retries: Int = 3)

val json = ForyJsonScala.builder().build()
json.toJson(Request(0)) // {"id":0}
json.toJson(Request(0, retries = 1)) // {"id":0,"retries":1}
```

此行为也适用于 Java 中没有默认值的构造函数属性，以及 Kotlin 的必需构造函数属性和 `lateinit` 属性。
受支持的默认值比较仍遵循原有要求。对于 Kotlin，比较有默认值的属性仍需要有效的参考对象；
构造函数含必需参数时，不能在没有这些参数的情况下提供参考对象。全局 `NON_DEFAULT` 仍不受支持。

支持的模型和配置示例见[默认值省略](/zh-CN/docs/json/annotations#jsoninclude-and-default-omission)。

完整发布说明见 [GitHub](https://github.com/apache/fory/releases/tag/v1.7.6)。

**完整变更记录**：[v1.7.5...v1.7.6](https://github.com/apache/fory/compare/v1.7.5...v1.7.6)
