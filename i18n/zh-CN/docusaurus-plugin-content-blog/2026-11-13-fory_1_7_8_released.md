---
slug: fory_1_7_8_release
title: Fory v1.7.8 发布
description: "Fory 1.7.8 支持逐个读写 JSON token、按需检测重复属性，以及在 Rust 中序列化指向字符串和切片的智能指针。"
authors: [chaokunyang]
tags: [fory, java, json, rust]
---

Apache Fory 1.7.8 源码包已在[下载页面](/zh-CN/download/)发布。本版为自带序列化器的框架提供了两个 Java JSON 接口，并扩展了 Rust 可以序列化的类型。

## Java JSON

框架可以调用 `ForyJson.readUtf8` 和 `writeUtf8`，直接读写一个完整的 JSON 值。例如，下面的代码将整数编码为 UTF-8 JSON，再读回整数：

```java
ForyJson json = ForyJson.builder().build();
byte[] bytes = json.writeUtf8(writer -> writer.writeInt(7));
int id = json.readUtf8(bytes, 0, bytes.length, reader -> reader.readInt());
```

读取器和写入器仅在回调执行期间有效。对象和数组的处理示例见[逐个读写 token](/zh-CN/docs/json/integration#token-level-reading-and-writing)。

读取 JSON 对象时，可以开启 `failOnDuplicateProperties(true)` 检测重复的已知属性。例如，目标类型声明了 `id` 属性时，开启此选项会拒绝 `{"id":1,"id":2}`。默认保留最后一个值。使用 `@JsonDuplicateProperties` 可单独指定某个类的行为。详见[重复属性](/zh-CN/docs/json/object-mapping#duplicate-properties)。

## Rust 智能指针

Rust 模型现可使用指向 `str` 和 `[T]` 的智能指针，例如用 `Arc<str>` 共享字符串，用 `Box<[u8]>` 持有字节切片。原生模式和跨语言模式均支持这些类型。启用引用跟踪后，反序列化得到的共享指针和弱指针可以指向同一块内存。字段注解和示例见 [Rust 序列化指南](/zh-CN/docs/object-serialization/rust/basic-serialization/)。

## 其他改动

- 如果两个字段会生成相同的 Python 属性名（例如 `userName` 和 `user_name`），Schema 编译器会报告错误。
- Java 复制 `java.sql.Timestamp` 时会保留不足一毫秒的精度。
- [源码 SBOM](https://downloads.apache.org/fory/apache-fory-1.7.8-src.tar.gz.cdx.json) 列出了从源码包中的依赖清单和锁文件识别出的组件。

[自 1.7.7 以来的完整变更](https://github.com/apache/fory/compare/v1.7.7...6f67e5b4978f909d614b990482063e332019f015)
