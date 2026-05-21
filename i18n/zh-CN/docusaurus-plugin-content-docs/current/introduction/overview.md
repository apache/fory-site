---
id: overview
title: 概述
sidebar_position: 1
---

<div class="themed-logo">
    <img width="65%" alt="Apache Fory logo" src="/img/fory-logo-dark.png" class="themed-logo-dark"/>
    <img width="65%" alt="Apache Fory logo" src="/img/fory-logo-light.png" class="themed-logo-light"/>
</div>

**Apache Fory™** 是一个面向惯用领域对象、Schema IDL 和跨语言数据交换的极速多语言序列化框架。

Fory 面向跨语言、跨运行时的紧凑高吞吐序列化而构建。它可以直接处理应用中的对象；当需要稳定契约时，也可以使用共享 Schema；同时保留对象图中的共享引用、循环引用和多态运行时类型等语义。

## 快速示例

跨语言序列化，在 Rust 中序列化，在 Python 中反序列化：

**Rust**

```rust
use fory::{Fory, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
}

fn main() {
    let mut fory = Fory::default().xlang(true);
    fory.register::<User>(1);

    let user = User { name: "Alice".to_string(), age: 30 };
    let bytes = fory.serialize(&user).unwrap();
    let decoded: User = fory.deserialize(&bytes).unwrap();
    println!("{:?}", decoded);  // User { name: "Alice", age: 30 }
}
```

**Python**

```python
import pyfory
from dataclasses import dataclass

@dataclass
class User:
    name: str
    age: pyfory.int32

fory = pyfory.Fory(xlang=True)
fory.register(User, type_id=1)

user = User(name="Alice", age=30)
data = fory.serialize(user)
decoded = fory.deserialize(data)
print(decoded)  # User(name='Alice', age=30)
```

## 核心特性

### 高效跨语言编码

**[xlang 序列化格式](../specification/xlang_serialization_spec.md)** 可以在支持的语言之间交换紧凑二进制载荷：

- **紧凑元数据**：打包类型元信息和字段信息，降低载荷体积。
- **Schema 演进**：兼容模式支持应用 Schema 的向前和向后演进。
- **对象图语义**：跨运行时保留共享引用、循环引用和多态运行时类型。
- **类型映射**：语言特定值通过共享的[类型映射](../specification/xlang_type_mapping.md)进行转换。

### 领域对象优先

Fory 直接序列化宿主语言模型，而不是要求应用引入包装类型：

- Java 类、Scala/Kotlin 类型，以及 GraalVM native image 工作负载。
- Python dataclass 和 Python 原生对象图。
- Go struct、Rust struct、C++ struct、C# 模型、Swift 类型、Dart 模型，以及 JavaScript/TypeScript 值。
- 当需要共享契约时，也支持生成或注解过的模型类型。

### 感知引用的 Schema IDL

**[Fory IDL 和编译器](../compiler/index.md)** 允许团队一次定义 Schema，并为每种目标语言生成原生领域对象：

- 建模数字、字符串、list、map、array、enum、struct 和 union。
- 在 Schema 中直接表达共享引用和循环引用。
- 生成惯用的宿主语言代码，不把传输专用包装类型引入用户代码。
- 当服务需要在独立维护的运行时之间共享稳定契约时，可以使用 Schema IDL。

### 行格式随机访问

缓存友好的 **[行格式](../specification/row_format_spec.md)** 面向分析和部分读取工作负载优化：

- **零拷贝随机访问**：无需重建完整对象即可读取字段、数组和嵌套值。
- **部分操作**：只读取查询或流水线阶段需要的值。
- **Apache Arrow 集成**：转换为列式数据，用于分析流水线。
- **多语言支持**：可在 Java、Python、Rust 和 C++ 中使用行格式。

### 优化运行时

Fory 让热点路径保持高速，同时不要求所有运行时采用相同实现策略：

- **Java JIT 序列化器**：运行时代码生成消除反射开销，并内联热点路径。
- **生成式和静态序列化器**：其他运行时在合适场景下使用生成式或静态序列化器。
- **零拷贝路径**：行格式和带外 buffer 可避免大值的不必要复制。
- **元数据共享**：复用或打包重复类型信息，降低序列化开销。

### 生产就绪

企业级安全性和兼容性：

- **类注册**：基于白名单的反序列化控制（默认启用）
- **深度限制**：防止递归对象图攻击
- **可配置策略**：自定义类检查器和反序列化策略
- **平台支持**：Java 8-24、GraalVM 原生镜像、多操作系统平台

## 协议

Apache Fory™ 实现了针对不同场景优化的多个二进制协议：

| 协议                                                             | 使用场景          | 核心特性                          |
| ---------------------------------------------------------------- | ----------------- | --------------------------------- |
| **[跨语言序列化](../specification/xlang_serialization_spec.md)** | 跨语言对象交换    | 自动序列化、引用、多态            |
| **[Java 序列化](../specification/java_serialization_spec.md)**   | 高性能 Java 专用  | Java 原生对象图、JDK 钩子、优化运行时 |
| **[行格式](../specification/row_format_spec.md)**                | 分析和数据处理    | 零拷贝随机访问、Arrow 兼容        |
| **Python 原生**                                                  | Python 专用序列化 | Pickle/cloudpickle 替代，性能更好 |

所有协议共享相同的优化代码库，一个协议的改进可以惠及其他协议。

## 文档

### 用户指南

| 指南             | 描述                    | 源文件                                                                                | 网站                                   |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| **Java 序列化**  | Java 序列化综合指南     | [Java 指南](https://github.com/apache/fory/blob/main/docs/guide/java/)                | [查看](../guide/java)               |
| **跨语言序列化** | 多语言对象交换          | [Xlang 指南](https://github.com/apache/fory/blob/main/docs/guide/xlang/)              | [查看](../guide/xlang)              |
| **行格式**       | 零拷贝随机访问格式      | [Java 行格式](https://github.com/apache/fory/blob/main/docs/guide/java/row-format.md) | [查看](../guide/java/row-format.md) |
| **Python**       | Python 特定功能和用法   | [Python 指南](https://github.com/apache/fory/blob/main/docs/guide/python/)            | [查看](../guide/python)             |
| **Rust**         | Rust 实现和模式         | [Rust 指南](https://github.com/apache/fory/blob/main/docs/guide/rust/)                | [查看](../guide/rust)               |
| **Go**           | Go 实现和用法           | [Go 指南](https://github.com/apache/fory/blob/main/docs/guide/go/)                    | [查看](../guide/go)                 |
| **Scala**        | Scala 集成和最佳实践    | [Scala 指南](https://github.com/apache/fory/blob/main/docs/guide/scala/)              | [查看](../guide/scala)              |
| **GraalVM**      | 原生镜像支持和 AOT 编译 | [GraalVM 支持](https://github.com/apache/fory/blob/main/docs/guide/java/graalvm-support.md) | [查看](../guide/java/graalvm_support) |
| **开发**         | 构建和贡献 Fory         | [开发指南](https://github.com/apache/fory/blob/main/docs/DEVELOPMENT.md)              | [查看](../community/DEVELOPMENT)    |

### 协议规范

| 规范             | 描述               | 源文件                                                                                                                 | 网站                                                    |
| ---------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **跨语言序列化** | 跨语言二进制协议   | [xlang_serialization_spec.md](https://github.com/apache/fory/blob/main/docs/specification/xlang_serialization_spec.md) | [查看](../specification/xlang_serialization_spec.md) |
| **Java 序列化**  | Java 优化协议      | [java_serialization_spec.md](https://github.com/apache/fory/blob/main/docs/specification/java_serialization_spec.md)   | [查看](../specification/java_serialization_spec.md)  |
| **行格式**       | 基于行的二进制格式 | [row_format_spec.md](https://github.com/apache/fory/blob/main/docs/specification/row_format_spec.md)                   | [查看](../specification/row_format_spec.md)          |
| **类型映射**     | 跨语言类型转换     | [xlang_type_mapping.md](https://github.com/apache/fory/blob/main/docs/specification/xlang_type_mapping.md)             | [查看](../specification/xlang_type_mapping.md)       |

## 兼容性

### Schema 兼容性

Apache Fory™ 支持 **Java、Python、Rust 和 Golang** 的类 Schema 向前/向后兼容，支持生产系统中的无缝 Schema 演进，无需跨所有服务协调升级。Fory 提供两种 Schema 兼容性模式：

1. **Schema 一致模式（默认）**：假设序列化和反序列化端之间的类 Schema 相同。此模式提供最小的序列化开销、最小的数据大小和最快的性能：适用于稳定的 Schema 或受控环境。

2. **兼容模式**：支持独立的 Schema 演进，具有向前和向后兼容性。此模式支持字段添加/删除、有限的类型演进和优雅处理 Schema 不匹配。在 Java 中使用 `withCompatibleMode(CompatibleMode.COMPATIBLE)` 启用，在 Python 中使用 `compatible=True`，在 Rust 中使用 `compatible_mode(true)`，在 Go 中使用 `NewFory(true)`。

## 社区与支持

### 获取帮助

- **Slack**：加入我们的 [Slack 工作区](https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw)参与社区讨论
- **Twitter/X**：关注 [@ApacheFory](https://x.com/ApacheFory) 获取更新和公告
- **GitHub Issues**：在 [apache/fory](https://github.com/apache/fory/issues) 报告错误和请求功能
- **邮件列表**：订阅 Apache Fory 邮件列表参与开发讨论

### 贡献

我们欢迎贡献！请阅读我们的[贡献指南](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)开始。

**贡献方式**：

- 报告错误和问题
- 提出新功能
- 改进文档
- 提交 Pull Request
- 添加测试用例
- 分享基准测试

详见[开发指南](../community/DEVELOPMENT.md)了解构建说明和开发工作流程。
