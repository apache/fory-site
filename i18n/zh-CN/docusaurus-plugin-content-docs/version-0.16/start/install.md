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

请使用完整的 Go 模块路径 `github.com/apache/fory/go/fory`：

```bash
go get github.com/apache/fory/go/fory@v0.16.0
```

如果你的 Go proxy 还没有同步到新的子模块 tag，可以稍后重试，或者临时使用 `GOPROXY=direct`。

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

Apache Fory 的 JavaScript 包目前还没有发布到 npm。

目前请先从源码安装并构建：

```bash
git clone https://github.com/apache/fory.git
cd fory/javascript
npm install
npm run build
```

完成源码构建后，再在你的项目或 workspace 中使用 `@apache-fory/core`，并按需启用 `@apache-fory/hps`。

可选的原生加速模块需要 Node.js 20+：

```bash
cd packages/hps
npm run build
```

## C\#

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
