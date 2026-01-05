---
id: install
title: 安装 Apache Fory™
sidebar_position: 0
---

Apache Fory™ 源码下载请参见 Apache Fory™ [download](https://github.com/apache/fory/releases)页面。

## 安装 Apache Fory™ Java

要使用 Maven 添加对 Apache Fory™ 的依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.14.1</version>
</dependency>
<!-- Optional row format support -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>0.13.1</version>
</dependency>
-->
<!-- SIMD acceleration for array compression (Java 16+) -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-simd</artifactId>
  <version>0.13.1</version>
</dependency>
-->
```

## 安装 Apache Fory™ Scala

要使用 Maven 添加 scala 2.13 的 Fory scala 依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>0.14.1</version>
</dependency>
```

要使用 Maven 添加 scala 3 的 Fory scala 依赖，请使用以下配置：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>0.14.1</version>
</dependency>
```

要使用 sbt 添加 scala 2.13 的 Fory scala 依赖，请使用以下配置：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "0.14.1"
```

要使用 sbt 添加 scala 3 的 Fory scala 依赖，请使用以下配置：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "0.14.1"
```

## 安装 Apache Fory™ Kotlin

To add a dependency on Apache Fory™kotlin with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>0.14.1</version>
</dependency>
```

## 安装 Apache Fory™ Python

```bash
python -m pip install --upgrade pip
pip install pyfory==0.14.1
```

## 安装 Apache Fory™ Rust

```toml
[dependencies]
fory = "0.14"
```

或者直接执行以下命令：

```bash
cargo add fory@0.14.1
```
