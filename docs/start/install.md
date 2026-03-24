---
id: install
title: Install
sidebar_position: 0
---

Apache Fory™ releases are available both as source artifacts and language-specific packages.

For source downloads, see the Apache Fory™ [download](https://fory.apache.org/download) page.

## Java

Use Maven to add Apache Fory™:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.16.0</version>
</dependency>
<!-- Optional row format support -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-format</artifactId>
  <version>0.16.0</version>
</dependency>
-->
<!-- SIMD acceleration for array compression (Java 16+) -->
<!--
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-simd</artifactId>
  <version>0.16.0</version>
</dependency>
-->
```

## Scala

Scala 2.13 with Maven:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_2.13</artifactId>
  <version>0.16.0</version>
</dependency>
```

Scala 3 with Maven:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-scala_3</artifactId>
  <version>0.16.0</version>
</dependency>
```

Scala 2.13 with sbt:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_2.13" % "0.16.0"
```

Scala 3 with sbt:

```sbt
libraryDependencies += "org.apache.fory" % "fory-scala_3" % "0.16.0"
```

## Kotlin

Add Apache Fory™ Kotlin with Maven:

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

Use the full Go module path `github.com/apache/fory/go/fory`:

```bash
go get github.com/apache/fory/go/fory@v0.16.0
```

If your Go proxy has not picked up the new submodule tag yet, retry later or use `GOPROXY=direct` temporarily.

## Rust

```toml
[dependencies]
fory = "0.16.0"
```

Or use `cargo add`:

```bash
cargo add fory@0.16.0
```

## JavaScript

The JavaScript packages are defined in the Apache Fory source tree as `@apache-fory/core` and `@apache-fory/hps`, but they are not published to npm yet.

Install and build them from source for now:

```bash
git clone https://github.com/apache/fory.git
cd fory/javascript
npm install
npm run build
```

After building from source, use `@apache-fory/core` and optionally `@apache-fory/hps` in your project or workspace setup.

Optional native acceleration requires Node.js 20+:

```bash
cd packages/hps
npm run build
```

## C\#

Install the `Apache.Fory` NuGet package. It includes both the runtime and the source generator for `[ForyObject]` types.

```bash
dotnet add package Apache.Fory --version 0.16.0
```

```xml
<ItemGroup>
  <PackageReference Include="Apache.Fory" Version="0.16.0" />
</ItemGroup>
```

## Swift

Add Apache Fory™ from the GitHub repository with Swift Package Manager:

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
