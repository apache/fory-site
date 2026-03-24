---
id: install
title: 安装 Apache Fory™
sidebar_position: 0
---

Apache Fory™ 同时提供源码发布物和各语言对应的软件包。

源码下载请参见 Apache Fory™ [download](https://fory.apache.org/download) 页面。

## Java

使用 Maven 添加 Apache Fory™：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.16.0</version>
</dependency>
<!-- 可选：row format 支持 -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>0.16.0</version>
</dependency>
-->
<!-- 可选：数组压缩 SIMD 加速（Java 16+） -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-simd</artifactId>
  <version>0.16.0</version>
</dependency>
-->
```

## Scala

Scala 2.13 的 Maven 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>0.16.0</version>
</dependency>
```

Scala 3 的 Maven 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>0.16.0</version>
</dependency>
```

Scala 2.13 的 sbt 依赖：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "0.16.0"
```

Scala 3 的 sbt 依赖：

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "0.16.0"
```

## Kotlin

使用 Maven 添加 Apache Fory™ Kotlin：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-kotlin</artifactId>
  <version>0.16.0</version>
</dependency>
```

## Python

```bash
python -m pip install --upgrade pip
pip install pyfory==0.16.0
```

## Go

```bash
go get github.com/apache/fory/go/fory@v0.16.0
```

## Rust

```toml
[dependencies]
fory = "0.16.0"
```

或者使用 `cargo add`：

```bash
cargo add fory@0.16.0
```

## JavaScript

安装 JavaScript 核心运行时：

```bash
npm install @apache-fory/core
```

可选的原生加速模块（需要 Node.js 20+）：

```bash
npm install @apache-fory/hps
```

## C#

安装 `Apache.Fory` NuGet 包。它同时包含运行时和 `[ForyObject]` 类型所需的源代码生成器。

```bash
dotnet add package Apache.Fory --version 0.16.0
```

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="0.16.0" />
</ItemGroup>
```

## Swift

使用 Swift Package Manager 从 GitHub 仓库引入 Apache Fory™：

```swift
dependencies: [
    .package(url: "https://github.com/apache/fory.git", exact: "0.16.0")
],
targets: [
    .target(
        name: "MyApp",
        dependencies: [
            .product(name: "Fory", package: "fory")
        ]
    )
]
```
