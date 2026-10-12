---
slug: fory_1_7_7_release
title: Fory v1.7.7 发布
description: "Fory 1.7.7 新增可配置的 JSON null 处理，并修复对象映射、Schema 编译器输出和发布归档的可复现性。"
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala]
---

Apache Fory 1.7.7 已发布。本次发布新增读取端 JSON null 处理，改进序列化性能、对象映射和生成代码。
安装方式请参阅[快速开始](/zh-CN/docs/start/)。

## 主要更新

- 配置 JSON 读取器对 null 属性、集合元素和 Map 值的处理方式。
- 降低 JSON 编解码器的生成成本，改进字符串写入，减少 C++ 序列化开销。
- 修复 JSON 对象字段语义、兼容模式下的字段类型校验和 Schema 编译器输出。
- 使 Java 和 Kotlin 发布归档可复现，并改进许可证和 NOTICE 打包。

## JSON null 处理

`onNullRead` 控制显式 null 属性值，`onContentNullRead` 控制数组或集合中的 null 元素以及 Map 中的
null 值。两者默认均为 `SET`，保留既有解码行为。`SKIP` 跳过该次输入；`FAIL` 拒绝它。

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonProperty;
import org.apache.fory.json.annotation.JsonProperty.NullHandling;

public final class Response {
  @JsonProperty(onNullRead = NullHandling.SKIP, onContentNullRead = NullHandling.SKIP)
  public java.util.List<String> seats = java.util.List.of("default");
}

ForyJson json = ForyJson.builder().build();
Response first = json.fromJson("{\"seats\":null}", Response.class);
Response second = json.fromJson("{\"seats\":[null,\"a\"]}", Response.class);
// first.seats is ["default"]; second.seats is ["a"].
```

也可以在 builder 上配置这些选项。属性注解覆盖对应的全局设置。内容覆盖仅影响直接元素或值；
嵌套容器遵循适用于自身的设置。这些选项只处理显式 JSON null，不改变写入或根值的 null 行为。

Kotlin 和 Scala 的 JSON builder 同样支持这些设置。跳过 null 属性可以保留构造函数默认值，
但必需属性校验仍然生效。详细规则见[读取端 null 处理](/zh-CN/docs/json/annotations#read-side-null-handling)、
[Kotlin](/zh-CN/docs/json/kotlin/) 和 [Scala](/zh-CN/docs/json/scala/)。

## 正确性与性能

JSON 对象映射现在会恢复符合条件的普通 final 字段；子类字段隐藏父类同名字段时，读写均选择子类字段。
通过具体基类类型写入子类实例时，会包含子类的映射属性；读取时若要恢复子类型，仍需声明子类型映射或
提供自定义编解码器。详见[对象映射](/zh-CN/docs/json/object-mapping/)。

Schema 编译器修复覆盖 Java、Kotlin、Scala、Python 和 TypeScript 输出。当 Schema case 名为
`Unknown` 或 Swift 的 `unknown` 时，生成的未知 case 载体会采用备用名称，保留 Schema case 名称。
详见[生成代码](/zh-CN/docs/compiler/generated-code/)。

性能改进降低了 JSON 编解码器生成成本，避免对 final 属性类型进行不必要的 `NON_EMPTY` 检查，
改进含转义字符的字符串写入，并在序列化 C++ `std::forward_list` 时避免创建临时 vector。

完整发布说明见 [GitHub](https://github.com/apache/fory/releases/tag/v1.7.7)。

**完整变更记录**：[v1.7.6...v1.7.7](https://github.com/apache/fory/compare/v1.7.6...v1.7.7)
