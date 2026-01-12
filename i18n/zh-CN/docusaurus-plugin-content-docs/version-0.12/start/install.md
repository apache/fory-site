---
id: install
title: 安装 Apache Fory
sidebar_position: 0
---

Apache Fory™ 源码下载请参见 Apache Fory [download](https://github.com/apache/fory/releases)页面。

### Apache Fory™ Java 安装

要使用 Maven 添加对 Apache Fory 的依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.12.3</version>
</dependency>
<!-- row/arrow format support -->
<!-- <dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>0.12.3</version>
</dependency> -->
```

### Apache Fory™ Scala 安装

要使用 Maven 添加 scala 2.13 的 Fory scala 依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>0.12.3</version>
</dependency>
```

要使用 Maven 添加 scala 3 的 Fory scala 依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>0.12.3</version>
</dependency>
```

要使用 sbt 添加 scala 2.13 的 Fory scala 依赖，请使用以下配置：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "0.12.3"
```

要使用 sbt 添加 scala 3 的 Fory scala 依赖，请使用以下配置：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "0.12.3"
```

## Fory Kotlin 安装

To add a dependency on Apache Fory™kotlin with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>0.12.3</version>
</dependency>
```

## Fory Python 安装

```bash
pip install pyfory
```

## Fory JavaScript 安装

Apache Fory 目前暂未发布到 NPM, 请通过源码安装。
