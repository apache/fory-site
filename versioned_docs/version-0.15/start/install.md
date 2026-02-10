---
id: install
title: Install
sidebar_position: 0
---

The official Apache Fory™ releases are provided as source artifacts.

For source download, please see Apache Fory™ [download](https://fory.apache.org/download) page.

## Java

To add a dependency on Apache Fory™ using Maven, use the following:

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

## Scala

To add a dependency on Apache Fory™ scala for scala 2.13 with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>0.14.1</version>
</dependency>
```

To add a dependency on Apache Fory™ scala for scala 3 with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>0.14.1</version>
</dependency>
```

To add a dependency on Apache Fory™ scala for scala 2.13 with sbt, use the following:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "0.14.1"
```

To add a dependency on Apache Fory™ scala for scala 3 with sbt, use the following:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "0.14.1"
```

## Kotlin

To add a dependency on Apache Fory™ kotlin with maven, use the following:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>0.14.1</version>
</dependency>
```

## Python

```bash
python -m pip install --upgrade pip
pip install pyfory==0.14.1
```

## Rust

```toml
[dependencies]
fory = "0.14"
```

or just execute command:

```bash
cargo add fory@0.14.1
```

## JavaScript

Apache Fory™ is NOT yet available on npm, please install from source code now.
