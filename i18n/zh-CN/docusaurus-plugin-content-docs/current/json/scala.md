---
title: Scala
sidebar_position: 7
id: scala
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

Fory JSON 通过可选的 `fory-json-scala` 制品支持 Scala 2.13 和 Scala 3。该模块支持普通 JVM 和 GraalVM Native Image，不支持 Android。

## 设置 {#setup}

```sbt
libraryDependencies += "org.apache.fory" %% "fory-json-scala" % "1.7.5"
```

`ForyJsonScala.builder()` 安装 Scala 模块并返回标准 Fory JSON builder：

```scala
import org.apache.fory.json.scala.ForyJsonScala

case class Person(name: String, age: Int = 18, aliases: List[String] = Nil)

val json = ForyJsonScala.builder().build()
val text = json.toJson(Person("Ada"))
val person = json.fromJson(text, classOf[Person])
```

请复用得到的 `ForyJson` 实例。它在构建后不可变且线程安全。
使用 `ForyJsonScala.builder().escapeNonAscii(true)` 可在紧凑和格式化输出中转义非 ASCII 字符串内容与名称。
该设置在实例构建后固定；原始 JSON 保持原样。见[非 ASCII 转义](object-mapping.md#non-ascii-escaping)。

使用 `ForyJsonScala.builder().writeLongAsString(true)` 可将 Scala `Long` 值以带引号的十进制字符串
输出，包括声明的 collection 和 Map 值、`Option[Long]`、以 `Long` 为底层值的值类以及 Java Long
类包装器。Reader 同时接受带引号和不带引号的整数 token。参数化声明包含 `Long` 时应使用
`ScalaTypeRef`，因为普通 JVM 签名可能会将 Scala 值类型参数擦除为 `Object`。

## 字节数组格式 {#byte-array-formats}

Scala `Array[Byte]` 默认使用 Base64 字符串。标准 builder 的 `byteArrayFormat` 可选择数字数组或
十六进制字符串，也适用于 `Option`、Scala 集合和 Map 中的数组：

```scala
import org.apache.fory.json.annotation.JsonByteArray
import org.apache.fory.json.scala.{ForyJsonScala, ScalaTypeRef}

val hexJson = ForyJsonScala.builder().byteArrayFormat(JsonByteArray.Format.BASE16).build()
val bytesType = ScalaTypeRef[Array[Byte]]
val text = hexJson.toJson(Array[Byte](1, -2, 3), bytesType) // "\"01fe03\""
val bytes = hexJson.fromJson(text, bytesType)
```

字段或 getter 上的 `JsonByteArray`（包括 Mixin）覆盖该属性的默认值。
读写契约见[字节数组格式](object-mapping.md#builder-configuration)。

## Case class 与注解 {#case-classes-and-annotations}

case class 通过调用完整主构造函数解码。对于缺失且有默认值的参数，Fory 调用 Scala 生成的构造函数默认值方法，
不解析默认值表达式，也不修改构造函数 `val` 字段。后续参数列表中的默认值会按 Scala 语义接收前面的构造函数参数。
构造函数参数没有显式默认值时，缺失属性使用类型默认值：

- 数值使用零，Boolean 使用 `false`。
- 集合、Map 和数组使用空值。每个对象的可变默认值相互独立。
- `Option[A]` 使用 `None`。
- 其他引用值（包括字符串和嵌套对象）使用 `null`。

类体中的可变属性在缺失时保留初始化值，存在时在构造后赋值。

```scala
case class Options(value: Option[Int], selected: Option[Int] = Some(7))
case class Profile(age: Int, enabled: Boolean, tags: List[String], name: String)

json.fromJson("{}", classOf[Options]) // Options(None, Some(7))
json.fromJson("""{"selected":null}""", classOf[Options]) // Options(None, None)
json.fromJson("{}", classOf[Profile]) // Profile(0, false, List(), null)
```

显式构造函数默认值优先用于缺失的属性。显式 JSON `null` 对 `Option[A]` 解码为 `None`，
即使其构造函数默认值为 `Some(...)` 也是如此。

case class 可以声明在顶层，也可以嵌套在任意层数的 `object` 内，但每一层外部作用域都必须是 `object`。如果外层是 `class`、trait 或方法，读写都会被拒绝，因为 Fory 无法访问重建值所需的外部实例或伴生对象。
构造要求具有公共 JVM 构造函数以及匹配的公共伴生对象 `apply`；不支持的私有构造形式会被拒绝。

Fory JSON 注解可以直接放在 Scala 构造函数属性上：

```scala
import org.apache.fory.json.annotation.{JsonCodec, JsonIgnore, JsonProperty}

case class Media(
    @JsonProperty("media_uri") uri: String,
    @JsonIgnore internalId: String = "hidden",
    @JsonCodec(elementCodec = classOf[TagCodec]) tags: List[Tag] = Nil,
    @JsonProperty(include = JsonProperty.Include.NON_NULL) title: String = null
)
```

`JsonIgnore` 适用于字段、属性方法、setter 参数和选定的构造函数参数。`JsonCodec` 子槽位绑定直接集合元素、`Option` 内容，以及 Map 键或值。其他 Fory JSON 注解保持[注解](annotations.md)中描述的行为。

属性包含策略控制写出的值。省略的属性在读取时使用构造函数或类型默认值，因此省略空字符串可能恢复为 `null`。
如果需要保留区别，使用 `ALWAYS`。显式 JSON `null` 保持声明类型的常规 null 行为，不会请求构造函数默认值。

`NON_EMPTY` 识别 `None` 和受支持的空严格求值 Scala 序列、集合、Map，包括可变集合和 range。
过滤不递归：`Some("")`、`Some(Nil)`、`Some(null)` 和非空容器都会保留。
它不会遍历惰性集合来判断是否为空，也不会移除根值、数组元素、Map 条目或元组位置。

这些 Scala 编解码器实现 `isEmpty(writer, value)`。使用自定义编解码器替换它们时，需要重写该方法
以保留所需的空值省略行为；默认返回 `false`。例如，没有重写该方法的自定义 Option 编解码器会在
`NON_EMPTY` 下保留 `None` 属性。动态 `Any` 属性使用实际值选定的编解码器，属性专用的自定义
编解码器控制自身空值检查。见[自定义空值](custom-codecs.md#custom-empty-values)。

通过 `NON_DEFAULT` 显式授权稳定的声明默认值：

```scala
import org.apache.fory.json.annotation.JsonProperty.Include
import org.apache.fory.json.annotation.{JsonInclude, JsonProperty}
import org.apache.fory.json.scala.ForyJsonScala

@JsonInclude(Include.NON_DEFAULT)
case class Request(
  @JsonProperty(include = Include.ALWAYS) id: Int,
  retries: Int = 3,
  tags: List[String] = Nil
)

val json = ForyJsonScala.builder().build()
json.toJson(Request(0)) // {"id":0}
json.fromJson("""{"id":0}""", classOf[Request]) // Request(0, 3, Nil)
json.toJson(Request(0, retries = 0)) // {"id":0,"retries":0}
```

`id` 没有声明默认值，因此需要显式排除，否则类级授权会失败。读取时隐含的零、空集合或 `None`
不是声明的默认值。也可移除类注解，只在选定的默认值属性上添加
`@JsonProperty(include = Include.NON_DEFAULT)`。Mixin 支持两种形式；全局 `NON_DEFAULT` 会被拒绝。

默认值表达式在写入时执行，必须具有确定性且没有外部可见副作用。
对于 `case class Limits(low: Int)(val high: Int = low + 1)`，比较 `high` 时使用对象实际的 `low`。
当 `low=5, high=2` 时会保留 high，因为默认值为 6。缺少默认值方法或写入 Schema 依赖时，
模型初始化会失败。JVM 方法返回 `void` 的 `Unit` 默认值不能用作比较来源；
授权整个类时，应通过 `ALWAYS` 保留这些属性。

授权表示调用方确认缺失输入可以恢复相同上下文；Fory 不证明这一点或表达式的纯度。
对于依赖时间、随机数或状态的默认值，应使用 `ALWAYS`。数组按内容比较，浮点数区分正零与负零。
Scala 类体初始化器不会被推断为构造函数默认值。不同于默认值的值（包括 null 和空集合）仍会写出。
读取行为独立，并创建新的可变默认值。类级授权也覆盖未来新增的字段，见
[默认值省略](annotations.md#jsoninclude-and-default-omission)。

## 支持的 Scala 类型 {#supported-scala-types}

| Scala 类型                                                | JSON 表示形式                            |
| --------------------------------------------------------- | ---------------------------------------- |
| `Unit`                                                    | `null`                                   |
| case class                                                | 对象                                     |
| 单例对象                                                  | 空对象                                   |
| 值类                                                      | 底层值                                   |
| `Option[A]`、`Some[A]`、`None`                            | 所含值或 `null`                          |
| `Either[L, R]`                                            | 恰好包含一个 `l` 或 `r` 成员的对象       |
| `List`、`Seq`、`Vector`、`Queue`、`ArraySeq`、buffer、set | 数组                                     |
| Scala Map、`IntMap`、`LongMap`                            | 对象                                     |
| 不可变与可变 `BitSet`                                     | 升序整数数组                             |
| `Tuple1` 至 `Tuple22`                                     | 定长数组                                 |
| Scala 3 `EmptyTuple`                                      | 空数组                                   |
| `BigInt`、`BigDecimal`                                    | JSON 数字                                |
| Scala `StringBuilder`                                     | string                                   |
| `Range`、受支持的 `NumericRange`                          | 已求值的值数组                           |
| `FiniteDuration`、`Duration`                              | 固定的 `length`/`unit` 或 `special` 对象 |
| 无参数的 Scala 3 枚举                                     | 字符串形式的枚举分支名                   |
| Scala 2 `Enumeration`                                     | 通过绑定所属枚举的编解码器表示为字符串   |

严格求值的标准库集合通过标准 Scala builder 重建。`Either` 写入紧凑的 `l` 和 `r` 成员名，读取器也接受旧的 `left` 和 `right` 名称。Fory 不增加 Scala 专用集合大小限制；编解码器使用与 Fory JSON 核心相同的输入长度、深度、对象图内存和读取进度限制。如果稀疏 `BitSet` 的最高索引要求分配与可用 JSON 输入不成比例的底层存储，则会被拒绝。

默认模块有意不支持惰性求值或进程局部值，包括 `LazyList`、`Stream`、view、迭代器、集合 builder、`Try`、`Throwable`、`Future`、`Promise`、`ExecutionContext`、`Deadline`、函数、反射/编译器元数据和正则表达式值。有序集合或自定义集合需要精确的应用编解码器，因为排序或构造方式属于应用配置。

## 参数化类型 {#parameterized-types}

读取参数化 Scala 类型时，使用完整的 `TypeRef`：

```scala
import org.apache.fory.reflect.TypeRef

val typeRef = new TypeRef[Map[String, Option[Int]]]() {}
val value = json.fromJson("""{"count":1}""", typeRef)
```

Scala 原始字符串可以直接传给 `fromJson`，JSON 双引号无需反斜杠转义。

Scala 值类型参数在常规 JVM 签名中可能被擦除为 `Object`。`ScalaTypeRef` 是编译期类型令牌构造器，可在 Scala 2.13 和 Scala 3 上保留这些参数：

```scala
import org.apache.fory.json.scala.ScalaTypeRef

val rangeType = ScalaTypeRef[scala.collection.immutable.NumericRange[Int]]
val range = json.fromJson("[1,3,5,7]", rangeType)
```

泛型 case class 保留类型参数，包括同一个类的有限嵌套：

```scala
case class Box[A](value: A)

val boxType = ScalaTypeRef[Box[Box[Int]]]
val box = json.fromJson("""{"value":{"value":1}}""", boxType)
json.toJson(box, boxType) // {"value":{"value":1}}
```

持续扩张类型参数的递归声明（例如 `Node[A]` 包含 `Node[List[A]]`）需要自定义编解码器。
`Unit` 根值应使用 `ScalaTypeRef[Unit]`：

```scala
val unitType = ScalaTypeRef[Unit]
json.toJson((), unitType)       // "null"
json.fromJson("null", unitType) // ()
```

`Unit` 也支持 case class 字段及 `List[Unit]`、`Array[Unit]`、`Option[Unit]` 等嵌套类型。
每个 `Unit` 值编码为 JSON `null`。由于 Option 使用值或 null 表示，`Some(())` 写为 `null` 后会读回 `None`。
不要将 `classOf[Unit]` 传给 Java `Class` 重载：它表示 JVM `void`，作为根值写入时会被拒绝。

提供完整类型参数时，`Some[Int]` 是有效声明类型。非 null JSON 值解码为 `Some(value)`；`Some[Int]` 拒绝 JSON `null`，而 `Option[Int]` 将其解码为 `None`。

## Scala 2 Enumeration

在 Scala 2.13 和 Scala 3 上，使用 `ScalaTypeRef` 保留静态已知的枚举所有者，
包括数组、集合、Option 和 Map 中的枚举：

```scala
import org.apache.fory.json.scala.{ForyJsonScala, ScalaTypeRef}

object Suit extends Enumeration {
  val Hearts, Clubs = Value
}

val json = ForyJsonScala.builder().build()
val suits = ScalaTypeRef[Array[Suit.Value]]
val values = json.fromJson("""["Hearts","Clubs"]""", suits)
val text = json.toJson(values, suits)
```

每个类型使用位置分别选定所有者，不同枚举可在同一运行时共存，无需为共享的 `Enumeration.Value` 类注册。
保留所有者的类型别名也受支持。被擦除的 `Enumeration#Value`、`Class` 或普通 JVM `TypeRef` 无法恢复所有者。
通过 JVM 反射发现的 case class 属性，如果签名已擦除所有者，需要使用 `JsonEnumeration`。
该注解可用于直接值、集合或数组元素、`Option` 内容以及 Map 键/值：

```scala
import org.apache.fory.json.scala.JsonEnumeration

object Weekday extends Enumeration {
  val Monday, Tuesday = Value
}

object Month extends Enumeration {
  val January, February = Value
}

case class Schedule(
    @JsonEnumeration(classOf[Weekday.type]) day: Weekday.Value,
    @JsonEnumeration(element = classOf[Weekday.type]) days: List[Weekday.Value],
    @JsonEnumeration(content = classOf[Month.type]) month: Option[Month.Value],
    @JsonEnumeration(
      mapKey = classOf[Weekday.type],
      mapValue = classOf[Month.type]
    ) labels: Map[Weekday.Value, Month.Value]
)
```

每个槽位描述一个直接的 `Enumeration.Value` 使用位置。`value` 不能与子槽位组合；`element`、`content` 和 Map 槽位必须匹配被标注属性的直接类型结构。无效或冲突的声明会在创建 case class 元数据时失败。

自定义编码表示时，扩展 `ScalaEnumerationCodec` 并通过 `@JsonCodec` 选择该编解码器。该编解码器也实现 Map 键契约，因此其类可用于 `keyCodec`。

## 单例 sealed ADT {#singleton-sealed-adts}

在 Scala 2.13 和 Scala 3 上，显式选择 `ScalaJsonCodec.stringEnum[T]`，
可将由单例分支组成的封闭 sealed 类型层次编码为 JSON 字符串：

```scala
import org.apache.fory.json.scala.{ForyJsonScala, ScalaJsonCodec, ScalaTypeRef}

sealed trait Color
case object Red extends Color
case object Blue extends Color

val json = ForyJsonScala.builder()
  .registerCodec(classOf[Color], ScalaJsonCodec.stringEnum[Color])
  .build()
val colors = ScalaTypeRef[Array[Color]]
val text = json.toJson(Array[Color](Red, Blue), colors) // ["Red","Blue"]
val values = json.fromJson(text, colors)
```

编译器发现分支及其名称，包括 sealed 中间分支下的分支，无需手写名称到成员的映射。
开放抽象分支或包含构造函数参数的分支会在编译时被拒绝。未知输入名称会被拒绝，名称不会用于加载类，
也不依赖重写的 `toString`。

该表示需要显式选择。`ScalaJsonCodec.derived[T]` 保留包装对象表示，也支持显式注册的 Scala 2 sealed 层次。
Scala 3 `derives` 和无参数 Scala 3 枚举的默认行为不变。`null` 仍表示为 JSON `null`。

## 标量字符串 {#scalar-strings}

在 Boolean 或数值属性上使用 `JsonFormat(shape = JsonFormat.Shape.STRING)`，
可将标量 token 写为 JSON 字符串。读取同时接受字符串和原生标量 token：

```scala
import org.apache.fory.json.annotation.{JsonFormat, JsonMixin}
import org.apache.fory.json.scala.ForyJsonScala

case class Artifact(expired: Boolean, size: Long)

@JsonMixin(target = classOf[Artifact])
abstract class ArtifactMixin {
  @JsonFormat(shape = JsonFormat.Shape.STRING) var expired: Boolean = false
}

val json = ForyJsonScala.builder().registerMixin(classOf[ArtifactMixin]).build()
val text = json.toJson(Artifact(false, 7L)) // {"expired":"false","size":7}
```

也可以直接在构造函数属性上添加注解。Mixin 只使用 Fory 注解且不修改模型。
除基本和装箱 Boolean/数值类型外，也支持 Scala `BigInt` 和 `BigDecimal`。
null、非有限数及受支持的直接包装行为见[注解](annotations.md#jsonformat)。

## Scala 3 封闭枚举与 sealed 层次结构 {#scala-3-closed-enums-and-sealed-hierarchies}

无参数的 Scala 3 枚举以分支名作为 JSON 字符串，也可用作 `Map[Color, String]` 等有类型 Scala Map 的键。
对于带参数分支的枚举，添加 `derives ScalaJsonCodec`，即可为所有分支定义统一的封闭包装对象表示：

```scala
import org.apache.fory.json.scala.*

enum Result derives ScalaJsonCodec {
  case Ok(value: String)
  case Error(code: Int)
  case Pending
}

val json = ForyJsonScala.builder().build()
```

上述值分别使用 `{"Ok":{"value":"ready"}}`、`{"Error":{"code":7}}` 和 `{"Pending":{}}`。读取器不会接受类名或通过运行时反射选择子类型。对于无法添加 `derives` 的第三方枚举，可在 builder 调用处派生并注册其 Schema：

```scala
val json = ForyJsonScala.builder().register[thirdparty.Result].build()
```

对于 Scala 3 sealed trait 或类，添加空的 `JsonSubTypes` 注解并派生 `ScalaJsonCodec`：

```scala
import org.apache.fory.json.annotation.JsonSubTypes
import org.apache.fory.json.scala.*

@JsonSubTypes(property = "kind")
sealed trait Event derives ScalaJsonCodec

final case class Message(value: String) extends Event
case object Idle extends Event
```

此示例使用 `Message` 和 `Idle` 作为逻辑子类型名。派生过程递归遍历 sealed 分支。具体 open 类作为一个精确成员，其后代不被允许；开放抽象分支会被拒绝。非空注解值仍表示显式子集。此推导功能不支持 Scala 2 sealed trait 和类。

### 将派生编解码器打包到模块 {#packaging-derived-codecs-in-a-module}

支持多个第三方 Scala 3 枚举的库，可以将其派生编解码器打包为可复用模块：

```scala
import org.apache.fory.json.{ForyJsonModule, ModuleContext}
import org.apache.fory.json.scala.*

object ThirdPartyJsonModule extends ForyJsonModule:
  override def install(context: ModuleContext): Unit =
    context.registerCodec(
      classOf[thirdparty.Result],
      ScalaJsonCodec.derived[thirdparty.Result]
    )

val json =
  ForyJsonScala.builder()
    .withModule(ThirdPartyJsonModule)
    .build()
```

派生代码作为模块的一部分编译，因此使用者只需安装已编译的模块。这相当于将一个 builder 上的 `register[thirdparty.Result]` 调用封装为可复用形式。

模块通过 `withModule` 显式安装。Fory JSON 不扫描类路径，也不通过 `ServiceLoader` 调用模块；显式安装让启用的编解码器保持确定，并防止无关依赖改变反序列化行为。通用模块 API 和注册规则见[模块](modules.md)。

## GraalVM Native Image

Scala 模块在 JVM 和原生镜像中使用相同的注册方式。应用模型、自定义编解码器，以及派生的枚举或 sealed Schema 必须在原生镜像构建时可达。应在 native-image 构建过程中生成 Fory 编解码器，而不是添加通用反射配置。
