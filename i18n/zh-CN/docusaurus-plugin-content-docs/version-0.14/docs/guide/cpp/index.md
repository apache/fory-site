---
title: C++ 序列化指南
sidebar_position: 0
id: cpp_serialization_index
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

**Apache Fory™** 是一个极速的多语言序列化框架，基于 **JIT 编译**和**零拷贝**技术，在保持易用性和安全性的同时提供**超高性能**。

C++ 实现利用现代 C++17 特性和模板元编程，提供具有编译时类型安全的高性能序列化。

## 为什么选择 Apache Fory™ C++？

- **🔥 极速性能**：快速序列化和优化的二进制协议
- **🌍 跨语言**：在 Java、Python、C++、Go、JavaScript 和 Rust 之间无缝序列化/反序列化数据
- **🎯 类型安全**：基于宏的结构体注册实现编译时类型检查
- **🔄 引用跟踪**：自动跟踪共享引用和循环引用
- **📦 Schema 演化**：兼容模式支持独立的 schema 变更
- **⚡ 双格式支持**：对象图序列化和零拷贝行格式
- **🧵 线程安全**：同时提供单线程（最快）和线程安全两种变体

## 安装

C++ 实现同时支持 CMake 和 Bazel 构建系统。

### 前置条件

- CMake 3.16+（用于 CMake 构建）或 Bazel 8+（用于 Bazel 构建）
- C++17 兼容的编译器（GCC 7+、Clang 5+、MSVC 2017+）

### 使用 CMake（推荐）

使用 CMake 的 `FetchContent` 模块是最简单的方式：

```cmake
cmake_minimum_required(VERSION 3.16)
project(my_project LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
    fory
    GIT_REPOSITORY https://github.com/apache/fory.git
    GIT_TAG        v0.14.0
    SOURCE_SUBDIR  cpp
)
FetchContent_MakeAvailable(fory)

add_executable(my_app main.cc)
target_link_libraries(my_app PRIVATE fory::serialization)
```

然后构建并运行：

```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --parallel
./my_app
```

### 使用 Bazel

在项目根目录创建 `MODULE.bazel` 文件：

```bazel
module(
    name = "my_project",
    version = "1.0.0",
)

bazel_dep(name = "rules_cc", version = "0.1.1")

bazel_dep(name = "fory", version = "0.14.0")
git_override(
    module_name = "fory",
    remote = "https://github.com/apache/fory.git",
    commit = "v0.14.0",  # 或使用特定的 commit hash 以确保可重现性
)
```

为应用程序创建 `BUILD` 文件：

```bazel
cc_binary(
    name = "my_app",
    srcs = ["main.cc"],
    deps = ["@fory//cpp/fory/serialization:fory_serialization"],
)
```

然后构建并运行：

```bash
bazel build //:my_app
bazel run //:my_app
```

对于本地开发，可以使用 `local_path_override`：

```bazel
bazel_dep(name = "fory", version = "0.14.0")
local_path_override(
    module_name = "fory",
    path = "/path/to/fory",
)
```

### 示例

请参阅 [examples/cpp](https://github.com/apache/fory/tree/main/examples/cpp) 目录获取完整的工作示例：

- [hello_world](https://github.com/apache/fory/tree/main/examples/cpp/hello_world) - 对象图序列化
- [hello_row](https://github.com/apache/fory/tree/main/examples/cpp/hello_row) - 行格式编码

## 快速开始

### 基础示例

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// 定义结构体
struct Person {
  std::string name;
  int32_t age;
  std::vector<std::string> hobbies;

  bool operator==(const Person &other) const {
    return name == other.name && age == other.age && hobbies == other.hobbies;
  }
};

// 使用 Fory 注册结构体（必须在同一命名空间中）
FORY_STRUCT(Person, name, age, hobbies);

int main() {
  // 创建 Fory 实例
  auto fory = Fory::builder()
      .xlang(true)          // 启用跨语言模式
      .track_ref(false)     // 对简单类型禁用引用跟踪
      .build();

  // 使用唯一 ID 注册类型
  fory.register_struct<Person>(1);

  // 创建对象
  Person person{"Alice", 30, {"reading", "coding"}};

  // 序列化
  auto result = fory.serialize(person);
  if (!result.ok()) {
    // 处理错误
    return 1;
  }
  std::vector<uint8_t> bytes = std::move(result).value();

  // 反序列化
  auto deser_result = fory.deserialize<Person>(bytes);
  if (!deser_result.ok()) {
    // 处理错误
    return 1;
  }
  Person decoded = std::move(deser_result).value();

  assert(person == decoded);
  return 0;
}
```

## 线程安全

Apache Fory™ C++ 为不同的线程需求提供两种变体：

### 单线程（最快）

```cpp
// 单线程 Fory - 最快，但非线程安全
auto fory = Fory::builder()
    .xlang(true)
    .build();
```

### 线程安全

```cpp
// 线程安全 Fory - 使用上下文池
auto fory = Fory::builder()
    .xlang(true)
    .build_thread_safe();

// 可以从多个线程安全使用
std::thread t1([&]() {
  auto result = fory.serialize(obj1);
});
std::thread t2([&]() {
  auto result = fory.serialize(obj2);
});
```

**提示：** 在生成线程之前完成类型注册，以确保每个工作线程看到相同的元数据。

## 使用场景

### 对象序列化

- 包含嵌套对象和引用的复杂数据结构
- 微服务中的跨语言通信
- 具有完整类型安全的通用序列化
- 使用兼容模式的 schema 演化

### 行格式序列化

- 高吞吐量数据处理
- 需要快速字段访问的分析工作负载
- 内存受限环境
- 零拷贝场景

## 后续步骤

- [配置](configuration.md) - 构建器选项和模式
- [基础序列化](basic-serialization.md) - 对象图序列化
- [Schema 演化](schema-evolution.md) - 兼容模式和 schema 变更
- [类型注册](type-registration.md) - 注册类型
- [支持的类型](supported-types.md) - 所有支持的类型
- [跨语言](cross-language.md) - XLANG 模式
- [行格式](row-format.md) - 零拷贝行格式
