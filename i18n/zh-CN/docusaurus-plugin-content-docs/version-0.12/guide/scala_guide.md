---
title: Scala 序列化
sidebar_position: 4
id: scala_guide
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

Fory 支持所有 Scala 对象的序列化：

- 支持 `case` class 序列化
- 支持 `pojo/bean` class 序列化
- 支持 `object` 单例对象序列化
- 支持 `collection` 集合序列化
- 其他类型如 `tuple/either` 以及基础类型也都支持

同时支持 Scala 2 和 Scala 3。

## 安装

如果你使用 sbt 并希望在 Scala 2 项目中引入 Fory Scala 依赖，请添加如下内容：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "0.12.0"
```

如果你使用 sbt 并希望在 Scala 3 项目中引入 Fory Scala 依赖，请添加如下内容：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "0.12.0"
```

## 快速开始

```scala
case class Person(name: String, id: Long, github: String)
case class Point(x : Int, y : Int, z : Int)

object ScalaExample {
  val fory: Fory = Fory.builder().withScalaOptimizationEnabled(true).build()
  // 注册针对 Scala 优化的 fory 序列化器
  ScalaSerializers.registerSerializers(fory)
  fory.register(classOf[Person])
  fory.register(classOf[Point])

  def main(args: Array[String]): Unit = {
    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
  }
}
```

## Fory 实例创建

在使用 fory 进行 Scala 序列化时，建议至少以如下方式创建 fory 实例：

```scala
import org.apache.fory.Fory
import org.apache.fory.serializer.scala.ScalaSerializers

val fory = Fory.builder().withScalaOptimizationEnabled(true).build()

// 注册针对 Scala 优化的 fory 序列化器
ScalaSerializers.registerSerializers(fory)
```

根据你需要序列化的对象类型，可能还需要注册一些 Scala 内部类型：

```scala
fory.register(Class.forName("scala.Enumeration.Val"))
```

如果你希望避免手动注册这些类型，可以通过 `ForyBuilder#requireClassRegistration(false)` 关闭类注册功能。
注意：关闭类注册后，可以反序列化未知类型的对象，灵活性更高，但如果反序列化的类包含恶意代码，可能存在安全风险。

Scala 中循环引用较为常见，建议通过 `ForyBuilder#withRefTracking(true)` 启用引用跟踪（Reference tracking）。如果未启用引用跟踪，在某些 Scala 版本下序列化 Scala Enumeration 时，可能会出现 [StackOverflowError](https://github.com/apache/fory/issues/1032)。

注意：fory 实例应在多次序列化操作间复用，fory 实例的创建开销较大。

如果你需要在多线程环境下共享 fory 实例，应通过 `ForyBuilder#buildThreadSafeFory()` 创建 `ThreadSafeFory` 实例。

## 序列化 case class

```scala
case class Person(github: String, age: Int, id: Long)
val p = Person("https://github.com/chaokunyang", 18, 1)
println(fory.deserialize(fory.serialize(p)))
println(fory.deserializeJavaObject(fory.serializeJavaObject(p)))
```

## 序列化 pojo

```scala
class Foo(f1: Int, f2: String) {
  override def toString: String = s"Foo($f1, $f2)"
}
println(fory.deserialize(fory.serialize(Foo(1, "chaokunyang"))))
```

## 序列化 object 单例对象

```scala
object singleton {
}
val o1 = fory.deserialize(fory.serialize(singleton))
val o2 = fory.deserialize(fory.serialize(singleton))
println(o1 == o2)
```

## 序列化集合（Collection）

```scala
val seq = Seq(1,2)
val list = List("a", "b")
val map = Map("a" -> 1, "b" -> 2)
println(fory.deserialize(fory.serialize(seq)))
println(fory.deserialize(fory.serialize(list)))
println(fory.deserialize(fory.serialize(map)))
```

## 序列化 Tuple

```scala
val tuple = Tuple2(100, 10000L)
println(fory.deserialize(fory.serialize(tuple)))
val tuple = Tuple4(100, 10000L, 10000L, "str")
println(fory.deserialize(fory.serialize(tuple)))
```

## 序列化 Enum

### Scala3 Enum

```scala
enum Color { case Red, Green, Blue }
println(fory.deserialize(fory.serialize(Color.Green)))
```

### Scala2 Enum

```scala
object ColorEnum extends Enumeration {
  type ColorEnum = Value
  val Red, Green, Blue = Value
}
println(fory.deserialize(fory.serialize(ColorEnum.Green)))
```

## 序列化 Option

```scala
val opt: Option[Long] = Some(100)
println(fory.deserialize(fory.serialize(opt)))
val opt1: Option[Long] = None
println(fory.deserialize(fory.serialize(opt1)))
```

## 性能

`pojo/bean/case/object` Scala 对 Apache Fory JIT 的支持很好，性能与 Apache Fory Java 一样优异。

Scala 集合和泛型不遵循 Java 集合框架，并且未与当前发行版中的 Apache Fory JIT 完全集成。性能不会像 Java 的 Fory collections 序列化那么好。

scala 集合的执行将调用 Java 序列化 API `writeObject/readObject/writeReplace/readResolve/readObjectNoData/Externalizable` 和 Fory `ObjectStream` 实现。虽然 `org.apache.fory.serializer.ObjectStreamSerializer` 比 JDK `ObjectOutputStream/ObjectInputStream` 快很多，但它仍然不知道如何使用 Scala 集合泛型。

未来我们计划为 Scala 类型提供更多优化，敬请期待，更多信息请参看 [#682](https://github.com/apache/fory/issues/682)！

Scala 集合序列化已在 [#1073](https://github.com/apache/fory/pull/1073) 完成 ，如果您想获得更好的性能，请使用 Apache Fory snapshot 版本。
