---
id: overview
title: 概述
sidebar_position: 1
---

<div class="themed-logo">
    <img width="65%" alt="Apache Fory logo" src="/img/fory-logo-dark.png" class="themed-logo-dark"/>
    <img width="65%" alt="Apache Fory logo" src="/img/fory-logo-light.png" class="themed-logo-light"/>
</div>

**Apache Fory™** 是一个由 **JIT 编译**、**零拷贝** 技术和 **高级代码生成** 驱动的超高性能多语言序列化框架，可实现高达 **170 倍性能提升**，同时保持简洁易用。

## 快速示例

跨语言序列化 - 在 Rust 中序列化，在 Python 中反序列化：

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

### 🚀 高性能序列化

Apache Fory™ 通过先进的优化技术提供卓越性能：

- **JIT 编译**：Java 运行时代码生成消除虚方法调用并内联热路径
- **静态代码生成**：Rust、C++ 和 Go 的编译时代码生成，无运行时开销即可达到峰值性能
- **零拷贝操作**：无需中间缓冲区复制的直接内存访问；行格式支持随机访问和部分序列化
- **智能编码**：整数和字符串的变长压缩；数组的 SIMD 加速（Java 16+）
- **元数据共享**：类元数据打包减少跨序列化的冗余类型信息

### 🔄 跨语言序列化

**[xlang 序列化格式](../specification/xlang_serialization_spec.md)** 支持跨编程语言的无缝数据交换：

- **自动类型映射**：语言特定类型之间的智能转换（[类型映射](../specification/xlang_type_mapping.md)）
- **引用保持**：共享和循环引用在跨语言时正确工作
- **多态支持**：对象以其实际运行时类型进行序列化/反序列化
- **Schema 演进**：可选的向前/向后兼容性支持 Schema 演进
- **自动序列化**：无需 IDL 或 Schema 定义；直接序列化任何对象，无需代码生成

### 📊 行格式

针对分析工作负载优化的缓存友好型 **[行格式](../specification/row_format_spec.md)**：

- **零拷贝随机访问**：无需反序列化整个对象即可读取单个字段
- **部分操作**：选择性字段序列化和反序列化以提高效率
- **Apache Arrow 集成**：无缝转换为列格式以用于分析流水线
- **多语言支持**：可用于 Java、Python、Rust 和 C++

### 🔒 安全性与生产就绪

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
| **[Java 序列化](../specification/java_serialization_spec.md)**   | 高性能 Java 专用  | JDK 序列化的直接替代，快 100 倍   |
| **[行格式](../specification/row_format_spec.md)**                | 分析和数据处理    | 零拷贝随机访问、Arrow 兼容        |
| **Python 原生**                                                  | Python 专用序列化 | Pickle/cloudpickle 替代，性能更好 |

所有协议共享相同的优化代码库，一个协议的改进可以惠及其他协议。

## 文档

### 用户指南

| 指南             | 描述                    | 源文件                                                                                | 网站                                   |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| **Java 序列化**  | Java 序列化综合指南     | [Java 指南](https://github.com/apache/fory/blob/main/docs/guide/java/)                | [📖 查看](../guide/java)               |
| **跨语言序列化** | 多语言对象交换          | [Xlang 指南](https://github.com/apache/fory/blob/main/docs/guide/xlang/)              | [📖 查看](../guide/xlang)              |
| **行格式**       | 零拷贝随机访问格式      | [Java 行格式](https://github.com/apache/fory/blob/main/docs/guide/java/row-format.md) | [📖 查看](../guide/java/row-format.md) |
| **Python**       | Python 特定功能和用法   | [Python 指南](https://github.com/apache/fory/blob/main/docs/guide/python/)            | [📖 查看](../guide/python)             |
| **Rust**         | Rust 实现和模式         | [Rust 指南](https://github.com/apache/fory/blob/main/docs/guide/rust/)                | [📖 查看](../guide/rust)               |
| **Scala**        | Scala 集成和最佳实践    | [Scala 指南](https://github.com/apache/fory/blob/main/docs/guide/scala/)              | [📖 查看](../guide/scala)              |
| **GraalVM**      | 原生镜像支持和 AOT 编译 | [GraalVM 指南](https://github.com/apache/fory/blob/main/docs/guide/graalvm_guide.md)  | [📖 查看](../guide/graalvm_guide.md)   |
| **开发**         | 构建和贡献 Fory         | [开发指南](https://github.com/apache/fory/blob/main/docs/guide/DEVELOPMENT.md)        | [📖 查看](../guide/DEVELOPMENT)        |

### 协议规范

| 规范             | 描述               | 源文件                                                                                                                 | 网站                                                    |
| ---------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **跨语言序列化** | 跨语言二进制协议   | [xlang_serialization_spec.md](https://github.com/apache/fory/blob/main/docs/specification/xlang_serialization_spec.md) | [📖 查看](../specification/xlang_serialization_spec.md) |
| **Java 序列化**  | Java 优化协议      | [java_serialization_spec.md](https://github.com/apache/fory/blob/main/docs/specification/java_serialization_spec.md)   | [📖 查看](../specification/java_serialization_spec.md)  |
| **行格式**       | 基于行的二进制格式 | [row_format_spec.md](https://github.com/apache/fory/blob/main/docs/specification/row_format_spec.md)                   | [📖 查看](../specification/row_format_spec.md)          |
| **类型映射**     | 跨语言类型转换     | [xlang_type_mapping.md](https://github.com/apache/fory/blob/main/docs/specification/xlang_type_mapping.md)             | [📖 查看](../specification/xlang_type_mapping.md)       |

## 兼容性

### Schema 兼容性

Apache Fory™ 支持 **Java、Python、Rust 和 Golang** 的类 Schema 向前/向后兼容，支持生产系统中的无缝 Schema 演进，无需跨所有服务协调升级。Fory 提供两种 Schema 兼容性模式：

1. **Schema 一致模式（默认）**：假设序列化和反序列化端之间的类 Schema 相同。此模式提供最小的序列化开销、最小的数据大小和最快的性能：适用于稳定的 Schema 或受控环境。

2. **兼容模式**：支持独立的 Schema 演进，具有向前和向后兼容性。此模式支持字段添加/删除、有限的类型演进和优雅处理 Schema 不匹配。在 Java 中使用 `withCompatibleMode(CompatibleMode.COMPATIBLE)` 启用，在 Python 中使用 `compatible=True`，在 Rust 中使用 `compatible_mode(true)`，在 Go 中使用 `NewFory(true)`。

### 二进制兼容性

**当前状态**：由于协议持续演进，Fory 主要版本之间**不保证**二进制兼容性。但是，次要版本之间（例如 0.13.x）**保证**兼容性。

**建议**：

- 按 Fory 主要版本对序列化数据进行版本控制
- 升级主要版本时规划迁移策略
- 详见[升级指南](../guide/java/migration.md)

**未来**：从 Fory 1.0 版本开始将保证二进制兼容性。

## 安全

### 概述

序列化安全性因协议而异：

- **行格式**：使用预定义 Schema，本质上安全
- **对象图序列化**（Java/Python 原生）：更灵活但需要仔细的安全配置

动态序列化可以反序列化任意类型，这可能会带来风险。例如，反序列化可能会调用 `init` 构造函数或 `equals/hashCode` 方法，如果方法体包含恶意代码，系统将面临风险。

Fory 默认**启用**动态协议的类注册，只允许受信任的已注册类型或内置类型。
**除非您能确保环境安全，否则不要禁用类注册**。

如果禁用此选项，您需要对序列化安全负责。您应该实现并配置自定义的 `ClassChecker` 或 `DeserializationPolicy` 以进行细粒度的安全控制。

要报告 Apache Fory™ 中的安全漏洞，请遵循 [ASF 漏洞报告流程](https://apache.org/security/#reporting-a-vulnerability)。

## 社区与支持

### 获取帮助

- **Slack**：加入我们的 [Slack 工作区](https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw)参与社区讨论
- **Twitter/X**：关注 [@ApacheFory](https://x.com/ApacheFory) 获取更新和公告
- **GitHub Issues**：在 [apache/fory](https://github.com/apache/fory/issues) 报告错误和请求功能
- **邮件列表**：订阅 Apache Fory 邮件列表参与开发讨论

### 贡献

我们欢迎贡献！请阅读我们的[贡献指南](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)开始。

**贡献方式**：

- 🐛 报告错误和问题
- 💡 提出新功能
- 📝 改进文档
- 🔧 提交 Pull Request
- 🧪 添加测试用例
- 📊 分享基准测试

详见[开发指南](../guide/DEVELOPMENT.md)了解构建说明和开发工作流程。
