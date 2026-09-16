---
slug: fory_1_7_3_release
title: Apache Fory 1.7.3 正式发布
description: "Fory 1.7.3 新增 Go Standard Row Format 支持，提升 Java JSON 读写性能，并修复 Kotlin JSON 属性包含策略。"
authors: [chaokunyang]
tags: [fory, java, json, go, kotlin]
---

Apache Fory 1.7.3 已正式发布。本次发布新增 Go Standard Row Format 支持，提升 Java JSON
读写性能，并修复 Kotlin JSON 属性包含策略和 Java 序列化中的边界问题。
安装方法请参阅[快速开始](/zh-CN/docs/start/)。

## 亮点

- Go 支持将结构体编码为 Standard Row 字节，并直接读取指定字段和集合元素。
- Java JSON 优化浮点数转换、读写路径和带时区的时间戳解析。
- Kotlin JSON 在 JVM、GraalVM Native Image 和 Android 上遵循配置的属性包含策略，包括 `NON_EMPTY`。
- Java 修复嵌套 `Externalizable` 回调和读取已耗尽数据流时的异常处理不一致问题。

## Go Standard Row Format

新增的 `github.com/apache/fory/go/fory/row` 包支持与 Java、C++、Python 和 Rust 共享的
Standard Row 布局。如果读取方只需要少量字段，不希望重建整个对象，可以将它用于可信的分析数据。

```go
package main

import (
    "fmt"

    "github.com/apache/fory/go/fory/row"
)

type Profile struct {
    Name   string
    Scores []int32
}

func main() {
    encoder, err := row.NewEncoder[Profile]()
    if err != nil {
        panic(err)
    }
    data, err := encoder.ToRow(&Profile{Name: "Alice", Scores: []int32{95, 87}})
    if err != nil {
        panic(err)
    }
    schema := encoder.Schema()
    view := row.NewRow(schema, data)
    fmt.Println(view.String(schema.FieldIndex("name"))) // Alice
    fmt.Println(view.Array(schema.FieldIndex("scores")).Int32(1)) // 87
}
```

每种结构体类型可以复用 encoder，但并发 goroutine 应分别创建实例，或使用互斥锁保护。
Row 视图要求底层字节保持有效且不被修改。读取 Go 字符串会复制数据；嵌套 Row、数组和 Map
则通过原始字节上的视图访问。

`ToRow` 和 `FromRow` 处理裸 Row 字节，`Encode` 和 `Decode` 额外携带八字节 Schema hash。
跨语言读写双方必须使用一致的 Schema，包括字段类型和可空性。Row Format 只接受可信输入；
如果需要对象图或处理不可信输入，应使用对象序列化。支持的类型和 Schema 交换方法见
[Go Row Format 指南](/zh-CN/docs/row-format/go)。

## Kotlin JSON 属性包含策略

Kotlin 的构造函数参数和类体属性现在都遵循配置的包含策略。
`NON_NULL` 省略 null；`NON_EMPTY` 还会省略空字符串、数组、集合、Map 和不含值的 JDK Optional。
属性上的 `@JsonProperty(include = ...)` 优先于 builder 默认值。

```kotlin
import org.apache.fory.json.annotation.JsonProperty.Include
import org.apache.fory.json.kotlin.ForyJsonKotlin

data class Response(
    val id: Int,
    val name: String? = null,
    val items: List<String>? = null,
)

val json = ForyJsonKotlin.builder().defaultPropertyInclusion(Include.NON_EMPTY).build()
val text = json.toJson(Response(1, items = emptyList())) // {"id":1}
```

包含策略影响写入。读取示例输出时，`items` 使用声明的默认值 null，因此不会保留原来的空列表。
缺失的构造函数参数使用其默认值，没有默认值则读取失败；缺失的类体属性保留初始化值。
如果应用要求精确往返，应选择能保留所需值的包含策略。完整规则见
[Kotlin JSON 指南](/zh-CN/docs/json/kotlin#immutable-classes-and-compiler-defaults)。

## Java JSON 与序列化修复

Java JSON 优化了浮点数转换和常见读写路径，包括带时区的时间戳解析。
本次发布还修复了嵌套 `Externalizable` 回调结束后外层序列化上下文的恢复，
以及读取已耗尽数据流时异常处理不一致的问题。

包含全部 13 个 PR 的发布说明见
[GitHub Release](https://github.com/apache/fory/releases/tag/v1.7.3)。

**完整变更日志**：[v1.7.2...v1.7.3](https://github.com/apache/fory/compare/v1.7.2...v1.7.3)
