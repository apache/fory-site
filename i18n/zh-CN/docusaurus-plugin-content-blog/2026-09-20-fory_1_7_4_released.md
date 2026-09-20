---
slug: fory_1_7_4_release
title: Fory v1.7.4 发布
description: "Fory 1.7.4 提升 JSON 性能，新增运行时 Kotlin JSON 类型令牌，并修复 Java 序列化边界问题。"
authors: [chaokunyang]
tags: [fory, java, json, kotlin, scala]
---

Apache Fory 1.7.4 已发布。本次发布包含 2 位贡献者提交的 9 个 PR，涵盖 JSON 性能优化、
用于框架集成的运行时 Kotlin 类型令牌，以及 Java 序列化修复。
安装方式请参阅[快速开始](/zh-CN/docs/start/)。

## 主要更新

- 优化 Java JSON 读写和 Scala 集合编解码器。
- 从运行时 `KType` 构造 Kotlin JSON 类型令牌，保留嵌套泛型参数和可空性。
- Java 兼容模式反序列化保留已注册字段的声明类型，并在序列化时校验不可空字段中的 null 值。
- 修复 JDK 8 ARM 平台上的 Unsafe 地址访问问题。

## 运行时 Kotlin JSON 类型令牌

框架回调通常在运行时才能确定请求或响应的类型。1.7.4 提供
`jsonTypeRef<Any?>(kType)`，让适配器在 JSON 读写时保留完整 Kotlin 声明。
传入的 `KType` 决定 JSON 类型；`Any?` 只是回调中值的静态视图。

例如，可以保留 Kotlin 控制器方法的响应类型：

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

每个类型只需发现一次，并复用对应类型令牌。Kotlin 反射需要应用添加与 Kotlin 版本匹配的
`kotlin-reflect` 依赖。对于包装后的 HTTP 响应，应先选取消息体类型，再创建令牌。
未解析的类型参数、星投影和逆变投影仍不受支持。

依赖配置、请求转换和 Spring MVC 适配要求见
[JSON 框架集成](/zh-CN/docs/json/integration#kotlin-integration)。

## JSON 性能优化

本次发布优化了 Java JSON 标量、字符串、数组和时间类型的读写路径，以及 Scala 集合编解码器。
应用继续使用现有 JSON API 即可使用这些优化。
[JSON 指南](/zh-CN/docs/json/)提供现有基准测试报告及其测量条件。

## Java 序列化修复

兼容模式反序列化现在会保留已注册字段的声明类型。对于时间戳字段，声明为
`java.util.Date` 或 `java.sql.Date` 的字段会保留对应类型，不再被赋予 `Instant`。
动态 xlang 时间戳值仍使用 `Instant`。精度和 Java 原生模式行为见
[时间戳映射](/zh-CN/docs/object-serialization/java/basic-serialization#timestamps)。

当字段的编码既没有 null 标志也没有引用标志时，序列化会拒绝其中的 null 值，并在错误中指出字段。
允许为空的字段应标注 `@Nullable`；对于仅在 Java 中使用的序列化，
`Fory.builder().withXlang(false)` 会让未标注的引用字段默认可空。
详见 [Schema 元数据](/zh-CN/docs/object-serialization/java/schema-metadata)。

本次发布还修复了 JDK 8 ARM 平台的 Unsafe 地址访问问题，并恢复了分发包中的 dataclasses
和 gRPC 许可归属说明。

完整发布说明见 [GitHub](https://github.com/apache/fory/releases/tag/v1.7.4)。

**完整变更记录**：[v1.7.3...v1.7.4](https://github.com/apache/fory/compare/v1.7.3...v1.7.4)
