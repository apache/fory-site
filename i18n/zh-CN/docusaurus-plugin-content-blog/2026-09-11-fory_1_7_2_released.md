---
slug: fory_1_7_2_release
title: Apache Fory 1.7.2 正式发布
description: "Fory 1.7.2 支持省略 Java JSON 空属性，并修复 Go 线程安全包装器在垃圾回收后丢失类型注册的问题。"
authors: [chaokunyang]
tags: [fory, java, json, go, javascript]
---

Apache Fory 团队很高兴地宣布 1.7.2 版本正式发布。这个补丁版本新增 JSON 属性过滤功能，
并修复了 Go、Java 和 JavaScript 中的序列化问题。安装方法请参阅
[快速开始](https://fory.apache.org/zh-CN/docs/start/)。

## 亮点

- Java JSON 支持省略对象中的空属性。
- 即使垃圾回收清除了缓存实例，Go 线程安全序列化仍能保留类型注册信息。
- Java 兼容模式元数据缓存命中后，不再重复查询本地元数据。

## 省略 JSON 空属性

Fory JSON 1.7.2 新增 `NON_EMPTY` 包含策略，应用可以在输出 JSON 对象时省略空属性。
通过 builder 可以为所有属性启用该策略：

```java
import java.util.Collections;
import java.util.List;
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonProperty.Include;

public final class Response {
  public String message = "";
  public List<String> items = Collections.emptyList();
  public int count = 0;
}

ForyJson json = ForyJson.builder().defaultPropertyInclusion(Include.NON_EMPTY).build();

assert json.toJson(new Response()).equals("{\"count\":0}");
```

空字符串 `message` 和空列表 `items` 被省略，`count` 则保留。
`NON_EMPTY` 会跳过 null、长度为零的字符串及其他 `CharSequence`、空 Java 数组、集合和 Map，
以及不含值的 JDK Optional。数字零和 `false` 会保留。过滤不递归检查内部内容：
含 null 元素或空列表元素的非空列表仍会输出。

如果只想对个别属性应用该规则，可以使用 `@JsonProperty`：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonProperty;

public final class Result {
  @JsonProperty(include = JsonProperty.Include.NON_EMPTY)
  public java.util.List<String> items;

  @JsonProperty(include = JsonProperty.Include.ALWAYS)
  public String nextPage;
}

ForyJson json = ForyJson.builder().build();

assert json.toJson(new Result()).equals("{\"nextPage\":null}");
```

属性上显式指定的包含策略优先于 builder 默认值。这里的 `items` 被省略，`nextPage` 即使为 null
也会输出。默认策略仍为 `NON_NULL`，应用需要主动启用空属性过滤。
`defaultPropertyInclusion` 和 `writeNullFields` 修改同一个设置，以最后一次调用为准。

包含策略只影响对象属性的写入，不过滤根值、集合元素或 Map 条目，并且会在调用自定义编解码器之前
检查属性的逻辑值。Kotlin 和 Scala 仍遵循各自的构造函数参数重建规则，详情参阅
[Kotlin 指南](/zh-CN/docs/json/kotlin#immutable-classes-and-compiler-defaults)和
[Scala 指南](/zh-CN/docs/json/scala)。完整说明见
[JSON 注解指南](/zh-CN/docs/json/annotations#jsonproperty)和
[builder 配置](/zh-CN/docs/json/object-mapping#builder-configuration)。

## Go 线程安全类型注册

Go `threadsafe` 包装器现在能在垃圾回收清除缓存实例后保留注册信息。请在第一次序列化或反序列化
之前注册所有类型：第一次操作会冻结注册状态，即使该操作失败也是如此。之后再尝试注册会返回错误。
如需为每个实例执行自定义初始化，可以使用 `NewWithFactory`，每次调用都返回配置相同的全新实例。
详情参阅 [Go 线程安全指南](/zh-CN/docs/object-serialization/go/thread-safety)。

## 功能改进

- Java 兼容模式元数据缓存命中后跳过重复查询，由
  [@chaokunyang](https://github.com/chaokunyang) 在 [#4023](https://github.com/apache/fory/pull/4023) 中贡献。
- 增加 Java 非 ASCII 元数据编码失败的断言，由
  [@LouisLou2](https://github.com/LouisLou2) 在 [#4025](https://github.com/apache/fory/pull/4025) 中贡献。
- 支持过滤 JSON 空属性，由
  [@chaokunyang](https://github.com/chaokunyang) 在 [#4028](https://github.com/apache/fory/pull/4028) 中贡献。

## 问题修复

- 在 writer 重置时清空 JavaScript 元字符串回收列表，由
  [@ayush00git](https://github.com/ayush00git) 在 [#4015](https://github.com/apache/fory/pull/4015) 中贡献。
- JavaScript 的 struct、extension 和 enum 工厂支持用户类型 ID `0`，由
  [@ayush00git](https://github.com/ayush00git) 在 [#4014](https://github.com/apache/fory/pull/4014) 中贡献。
- 为工厂创建的自定义序列化器保持一致的 TypeDef 根类别，由
  [@Pigsy-Monk](https://github.com/Pigsy-Monk) 在 [#4022](https://github.com/apache/fory/pull/4022) 中贡献。
- 修正 JVM NOTICE 和 C# 许可证头，由
  [@chaokunyang](https://github.com/chaokunyang) 在 [#4026](https://github.com/apache/fory/pull/4026) 中贡献。
- JavaScript 根容器注册遵循声明的元素类型，由
  [@ayush00git](https://github.com/ayush00git) 在 [#4013](https://github.com/apache/fory/pull/4013) 中贡献。
- 修复 Go 线程安全实例池，并移除 Python 延迟导入，由
  [@chaokunyang](https://github.com/chaokunyang) 在 [#4027](https://github.com/apache/fory/pull/4027) 中贡献。

## 其他改进

- 将 JavaScript browserslist 从 4.28.2 升级至 4.28.8，由
  [@dependabot](https://github.com/apps/dependabot) 在 [#4016](https://github.com/apache/fory/pull/4016) 中贡献。

**完整变更日志**：[v1.7.1...v1.7.2](https://github.com/apache/fory/compare/v1.7.1...v1.7.2)
