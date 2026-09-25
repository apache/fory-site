---
slug: fory_1_7_5_release
title: Fory v1.7.5 发布
description: "Fory 1.7.5 新增灵活的 JSON 输出选项，完善 Scala 和 Kotlin JSON 支持，并扩展 Python 集合支持。"
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala, python]
---

Apache Fory 1.7.5 已发布。本次发布包含 4 位贡献者提交的 15 个 PR，
为 JSON 输出提供更多控制选项，完善 Scala 和 Kotlin JSON 处理，并扩展 Python 集合支持。
安装方式请参阅[快速开始](/zh-CN/docs/start/)。

## 主要更新

- JSON 输出支持按次调用选择格式化输出、非 ASCII 转义、包含 Base16 的可配置字节数组格式，以及显式启用的默认值省略。
- Scala 和 Kotlin JSON 改进编解码器覆盖范围与字段缺失时的默认值处理，并修复 Java JSON 访问器的 GraalVM 兼容问题。
- Python 新增集合子类支持，并修复具名元组和时间类型数组缓冲区的处理。

## JSON 输出选项

Fory JSON 是 Java JSON 序列化框架，并提供可选的 Kotlin 和 Scala 模块。
应用现在可以复用同一个实例，按次调用选择格式化输出：

```java
import java.util.Collections;
import org.apache.fory.json.ForyJson;

ForyJson json = ForyJson.builder().build();
String pretty = json.toPrettyJson(Collections.singletonMap("name", "Fory"));
byte[] prettyBytes = json.toPrettyJsonBytes(Collections.singletonMap("name", "Fory"));
String compact = json.toJson(Collections.singletonMap("name", "Fory"));
```

`escapeNonAscii(true)` 将非 ASCII 字符串值和名称写为 JSON Unicode 转义。
builder 的 `byteArrayFormat` 为普通字节数组选择 Base64 字符串、Base16 字符串或有符号数字数组格式，
并适用于嵌套值。属性级 `JsonByteArray` 注解可以覆盖该默认设置：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonByteArray;

ForyJson hexJson = ForyJson.builder()
    .byteArrayFormat(JsonByteArray.Format.BASE16)
    .build();
String text = hexJson.toJson(new byte[] {1, -2, 3}); // "\"01fe03\""
byte[] bytes = hexJson.fromJson(text, byte[].class);
```

通过属性上的 `JsonProperty` 或类上的 `JsonInclude` 显式启用 `NON_DEFAULT`，即可省略默认值。
应用只能为稳定、可安全求值且字段缺失时能恢复一致值的默认值启用该策略。
全局 `NON_DEFAULT` 会被拒绝。Scala 的 `NON_EMPTY` 也能识别 `None` 以及受支持的空严格求值集合和 Map。

输出选项见 [JSON 对象映射](/zh-CN/docs/json/object-mapping/)，
支持的模型和配置示例见[默认值省略](/zh-CN/docs/json/annotations#jsoninclude-and-default-omission)。

## Scala 和 Kotlin JSON 支持

Scala 扩展了泛型 case class、`Unit`、枚举类型令牌的支持，并可为由单例分支组成的 sealed 类型层次
显式选择字符串编解码器。Scala 和 Kotlin 也完善了字段缺失时的默认值处理：Scala 使用声明的构造函数
默认值或类型默认值；Kotlin 优先使用声明的默认值，否则非空数值和 Boolean 参数使用零或 `false`，
可空参数使用 null。其他非空 Kotlin 参数仍为必需参数。

精确的类型和 null 行为见 [Scala](/zh-CN/docs/json/scala/) 和 [Kotlin](/zh-CN/docs/json/kotlin/)
指南。本次发布还修复了 GraalVM Native Image 中 Java JSON 访问器的处理。

## Python 集合与缓冲区

Xlang 模式接受 `Mapping`、`Sequence` 和 `Set` 的实现及其可变变体，
并将其值恢复为内置 `dict`、`list` 和 `set` 对象。Python 原生模式会保留已注册的
`list`、`dict` 和 `set` 子类及其实例状态。

原生模式还修复了具名元组重建，并支持 NumPy 日期时间、时间差数组，以及 Pandas 日期时间列和索引的
带外缓冲区。示例见 [Python 集合接口](/zh-CN/docs/object-serialization/python/basic-serialization#collection-interfaces)、
[原生模式](/zh-CN/docs/object-serialization/python/native/)和
[带外序列化](/zh-CN/docs/object-serialization/python/out-of-band/)。

完整发布说明见 [GitHub](https://github.com/apache/fory/releases/tag/v1.7.5)。

**完整变更记录**：[v1.7.4...v1.7.5](https://github.com/apache/fory/compare/v1.7.4...v1.7.5)
