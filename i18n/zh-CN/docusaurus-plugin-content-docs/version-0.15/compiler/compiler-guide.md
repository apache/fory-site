---
title: 编译器指南
sidebar_position: 3
id: compiler_guide
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

本指南介绍 Fory IDL 编译器的安装、命令行使用方式以及构建系统集成方案。

## 安装

### 从源码安装

```bash
cd compiler
pip install -e .
```

### 验证安装

```bash
foryc --help
```

## 命令行接口

### 基本用法

```bash
foryc [OPTIONS] FILES...
```

```bash
foryc --scan-generated [OPTIONS]
```

### 选项

编译选项：

| 选项                                  | 说明                                             | 默认值        |
| ------------------------------------- | ------------------------------------------------ | ------------- |
| `--lang`                              | 目标语言列表（逗号分隔）                         | `all`         |
| `--output`, `-o`                      | 输出目录                                         | `./generated` |
| `--package`                           | 覆盖 Fory IDL 文件中的 package                   | （来自文件）  |
| `-I`, `--proto_path`, `--import_path` | 添加 import 搜索路径（可重复）                   | （无）        |
| `--java_out=DST_DIR`                  | 将 Java 代码输出到 `DST_DIR`                     | （无）        |
| `--python_out=DST_DIR`                | 将 Python 代码输出到 `DST_DIR`                   | （无）        |
| `--cpp_out=DST_DIR`                   | 将 C++ 代码输出到 `DST_DIR`                      | （无）        |
| `--go_out=DST_DIR`                    | 将 Go 代码输出到 `DST_DIR`                       | （无）        |
| `--rust_out=DST_DIR`                  | 将 Rust 代码输出到 `DST_DIR`                     | （无）        |
| `--go_nested_type_style`              | Go 嵌套类型命名风格：`camelcase` 或 `underscore` | schema/默认值 |
| `--emit-fdl`                          | 对非 `.fdl` 输入打印转换后的 Fory IDL            | `false`       |
| `--emit-fdl-path`                     | 将转换后的 Fory IDL 写入文件或目录               | （stdout）    |

扫描选项（配合 `--scan-generated`）：

| 选项         | 说明                   | 默认值  |
| ------------ | ---------------------- | ------- |
| `--root`     | 扫描根目录             | `.`     |
| `--relative` | 以相对路径输出         | `false` |
| `--delete`   | 删除匹配到的生成文件   | `false` |
| `--dry-run`  | 仅扫描输出，不执行删除 | `false` |

### 扫描生成文件

使用 `--scan-generated` 可以定位 `foryc` 生成的文件。扫描器会递归遍历目录树，跳过 `build/`、`target/` 和隐藏目录，并输出找到的每个生成文件。

```bash
# 扫描当前目录
foryc --scan-generated

# 扫描指定根目录
foryc --scan-generated --root ./src

# 输出相对路径
foryc --scan-generated --root ./src --relative

# 删除扫描到的生成文件
foryc --scan-generated --root ./src --delete

# Dry-run（仅扫描与输出）
foryc --scan-generated --root ./src --dry-run
```

### 示例

**为所有语言编译：**

```bash
foryc schema.fdl
```

**为指定语言编译：**

```bash
foryc schema.fdl --lang java,python
```

**指定输出目录：**

```bash
foryc schema.fdl --output ./src/generated
```

**覆盖 package：**

```bash
foryc schema.fdl --package com.myapp.models
```

**编译多个文件：**

```bash
foryc user.fdl order.fdl product.fdl --output ./generated
```

**使用 import 搜索路径：**

```bash
# 单个路径
foryc src/main.fdl -I libs/common

# 多个路径（重复参数）
foryc src/main.fdl -I libs/common -I libs/types

# 多个路径（逗号分隔）
foryc src/main.fdl -I libs/common,libs/types,third_party/

# --proto_path（protoc 兼容别名）
foryc src/main.fdl --proto_path=libs/common

# 混合写法
foryc src/main.fdl -I libs/common,libs/types --proto_path third_party/
```

**语言定向输出目录（protoc 风格）：**

```bash
# 仅生成 Java
foryc schema.fdl --java_out=./src/main/java

# 多语言分别输出到不同目录
foryc schema.fdl --java_out=./java/gen --python_out=./python/src --go_out=./go/gen

# 结合 import 路径
foryc schema.fdl --java_out=./gen/java -I proto/ -I common/
```

使用 `--{lang}_out` 时：

- 只生成显式指定的语言（不会生成全部语言）
- 输出写入指定目录（语言生成器可能继续按包/模块分层）
- 兼容 protoc 风格工作流

**查看 proto/fbs 输入转换后的 Fory IDL：**

```bash
# 输出到 stdout
foryc schema.proto --emit-fdl

# 输出到目录
foryc schema.fbs --emit-fdl --emit-fdl-path ./translated
```

## Import 路径解析

编译含 import 的 Fory IDL 文件时，导入文件按以下顺序查找：

1. **相对于导入者文件目录（默认）**：始终优先查找，无需 `-I`
2. **按顺序遍历每个 `-I` 路径**

**同目录 import 可直接生效：**

```protobuf
// main.fdl
import "common.fdl";  // 若 common.fdl 在同目录，将自动找到
```

```bash
# 同目录导入无需 -I
foryc main.fdl
```

**示例目录结构：**

```
project/
├── src/
│   └── main.fdl          # import "common.fdl";
└── libs/
    └── common.fdl
```

**不加 `-I`（失败）：**

```bash
$ foryc src/main.fdl
Import error: Import not found: common.fdl
  Searched in: /project/src
```

**加 `-I`（成功）：**

```bash
$ foryc src/main.fdl -I libs/
Compiling src/main.fdl...
  Resolved 1 import(s)
```

## 支持语言

| 语言   | 标记     | 输出后缀 | 说明                   |
| ------ | -------- | -------- | ---------------------- |
| Java   | `java`   | `.java`  | 带 Fory 注解的 POJO    |
| Python | `python` | `.py`    | 带类型提示的 dataclass |
| Go     | `go`     | `.go`    | 带 struct tag 的结构体 |
| Rust   | `rust`   | `.rs`    | 带 derive 宏的结构体   |
| C++    | `cpp`    | `.h`     | 带 FORY 宏的结构体     |

## 输出结构

### Java

```
generated/
└── java/
    └── com/
        └── example/
            ├── User.java
            ├── Order.java
            ├── Status.java
            └── ExampleForyRegistration.java
```

- 每个类型（enum/message）单独一个文件
- 包路径与 Fory IDL package 一致
- 会生成注册辅助类

### Python

```
generated/
└── python/
    └── example.py
```

- 所有类型位于单模块
- 模块名由 package 派生
- 包含注册函数

### Go

```
generated/
└── go/
    └── example/
        └── example.go
```

- 所有类型在单文件中
- 目录名与包名来自 `go_package` 或 Fory IDL package
- 包含注册函数

### Rust

```
generated/
└── rust/
    └── example.rs
```

- 所有类型位于单模块
- 模块名由 package 派生
- 包含注册函数

### C++

```
generated/
└── cpp/
    └── example.h
```

- 单头文件输出
- 命名空间与 package 对齐（点号转换为 `::`）
- 自动包含 header guard 与前向声明

## 构建系统集成

### Maven (Java)

在 `pom.xml` 中添加：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>exec-maven-plugin</artifactId>
      <version>3.1.0</version>
      <executions>
        <execution>
          <id>generate-fory-types</id>
          <phase>generate-sources</phase>
          <goals>
            <goal>exec</goal>
          </goals>
          <configuration>
            <executable>foryc</executable>
            <arguments>
              <argument>${project.basedir}/src/main/fdl/schema.fdl</argument>
              <argument>--java_out</argument>
              <argument>${project.build.directory}/generated-sources/fory</argument>
            </arguments>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

添加生成源码目录：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>build-helper-maven-plugin</artifactId>
      <version>3.4.0</version>
      <executions>
        <execution>
          <phase>generate-sources</phase>
          <goals>
            <goal>add-source</goal>
          </goals>
          <configuration>
            <sources>
              <source>${project.build.directory}/generated-sources/fory</source>
            </sources>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

### Gradle (Java/Kotlin)

在 `build.gradle` 中添加：

```groovy
task generateForyTypes(type: Exec) {
    commandLine 'foryc',
        "${projectDir}/src/main/fdl/schema.fdl",
        '--java_out', "${buildDir}/generated/sources/fory"
}

compileJava.dependsOn generateForyTypes

sourceSets {
    main {
        java {
            srcDir "${buildDir}/generated/sources/fory"
        }
    }
}
```

### Python (setuptools)

在 `setup.py` 或 `pyproject.toml` 中加入生成步骤：

```python
# setup.py
from setuptools import setup
from setuptools.command.build_py import build_py
import subprocess

class BuildWithForyIdl(build_py):
    def run(self):
        subprocess.run([
            'foryc',
            'schema.fdl',
            '--python_out', 'src/generated'
        ], check=True)
        super().run()

setup(
    cmdclass={'build_py': BuildWithForyIdl},
    # ...
)
```

### Go (`go generate`)

在 Go 文件中添加：

```go
//go:generate foryc ../schema.fdl --lang go --output .
package models
```

执行：

```bash
go generate ./...
```

### Rust (`build.rs`)

在 `build.rs` 中添加：

```rust
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=schema.fdl");

    let status = Command::new("foryc")
        .args(&["schema.fdl", "--rust_out", "src/generated"])
        .status()
        .expect("Failed to run foryc");

    if !status.success() {
        panic!("Fory IDL compilation failed");
    }
}
```

### CMake (C++)

在 `CMakeLists.txt` 中添加：

```cmake
find_program(FORY_COMPILER foryc)

add_custom_command(
    OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/generated/example.h
    COMMAND ${FORY_COMPILER}
        ${CMAKE_CURRENT_SOURCE_DIR}/schema.fdl
        --cpp_out ${CMAKE_CURRENT_SOURCE_DIR}/generated
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/schema.fdl
    COMMENT "Generating Fory IDL types"
)

add_custom_target(generate_fory_idl DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/generated/example.h)

add_library(mylib ...)
add_dependencies(mylib generate_fory_idl)
target_include_directories(mylib PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/generated)
```

### Bazel

在 `BUILD` 中添加规则：

```python
genrule(
    name = "generate_fdl",
    srcs = ["schema.fdl"],
    outs = ["generated/example.h"],
    cmd = "$(location //:fory_compiler) $(SRCS) --cpp_out $(RULEDIR)/generated",
    tools = ["//:fory_compiler"],
)

cc_library(
    name = "models",
    hdrs = [":generate_fdl"],
    # ...
)
```

## 错误处理

### 语法错误

```
Error: Line 5, Column 12: Expected ';' after field declaration
```

修复方式：检查对应行是否缺少分号或存在语法问题。

### 类型名重复

```
Error: Duplicate type name: User
```

修复方式：确保同一文件内每个 enum/message 名称唯一。

### 类型 ID 重复

```
Error: Duplicate type ID 100: User and Order
```

修复方式：为每个类型分配唯一 ID。

### 未知类型引用

```
Error: Unknown type 'Address' in Customer.address
```

修复方式：先定义被引用类型，或检查类型名拼写。

### 字段号重复

```
Error: Duplicate field number 1 in User: name and id
```

修复方式：确保同一 message 内字段号唯一。

## 最佳实践

### 项目结构

```
project/
├── fdl/
│   ├── common.fdl       # Shared types
│   ├── user.fdl         # User domain
│   └── order.fdl        # Order domain
├── src/
│   └── generated/       # Generated code (git-ignored)
└── build.gradle
```

### 版本控制

- **纳入版本控制**：Fory IDL schema 文件
- **忽略生成代码**：可在构建时再生成

在 `.gitignore` 中加入：

```
# Generated Fory IDL code
src/generated/
generated/
```

### CI/CD 集成

在构建流程中始终重新生成代码：

```yaml
# GitHub Actions 示例
steps:
  - name: Install Fory IDL Compiler
    run: pip install ./compiler

  - name: Generate Types
    run: foryc fdl/*.fdl --output src/generated

  - name: Build
    run: ./gradlew build
```

### Schema 演进

修改 schema 时建议遵循：

1. **不要复用字段号**：删除字段后应保留/预留
2. **不要改动类型 ID**：类型 ID 属于二进制协议的一部分
3. **新增字段使用新字段号**
4. **优先使用 `optional`**：保持向后兼容

```protobuf
message User [id=100] {
    string id = 1;
    string name = 2;
    // Field 3 was removed, don't reuse
    optional string email = 4;  // New field
}
```

## 故障排查

### Command Not Found

```
foryc: command not found
```

**解决：** 确认编译器已安装且在 PATH 中：

```bash
pip install -e ./compiler
# Or add to PATH
export PATH=$PATH:~/.local/bin
```

### Permission Denied

```
Permission denied: ./generated
```

**解决：** 确保输出目录具备写权限：

```bash
chmod -R u+w ./generated
```

### 生成代码 import 错误

**Java：** 确保项目包含 Fory 依赖：

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>${fory.version}</version>
</dependency>
```

**Python：** 确保安装 `pyfory`：

```bash
pip install pyfory
```

**Go：** 确保可获取 fory 模块：

```bash
go get github.com/apache/fory/go/fory
```

**Rust：** 确保 `Cargo.toml` 中包含 fory crate：

```toml
[dependencies]
fory = "x.y.z"
```

**C++：** 确保编译器 include 路径可找到 Fory 头文件。
