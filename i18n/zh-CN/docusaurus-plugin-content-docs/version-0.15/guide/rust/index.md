---
title: Rust 序列化指南
sidebar_position: 0
id: serialization_index
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

Rust 实现提供多功能的高性能序列化，具有自动内存管理和编译时类型安全。

## 为什么选择 Apache Fory™ Rust？

- **🔥 极速性能**：零拷贝反序列化和优化的二进制协议
- **🌍 跨语言**：在 Java、Python、C++、Go、JavaScript 和 Rust 之间无缝序列化/反序列化数据
- **🎯 类型安全**：使用 derive macro 实现编译时类型检查
- **🔄 循环引用**：使用 `Rc`/`Arc` 和弱指针自动跟踪共享引用和循环引用
- **🧬 多态支持**：使用 `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 序列化 trait 对象
- **📦 Schema 演化**：兼容模式支持独立的 schema 变更
- **⚡ 双格式支持**：对象图序列化和零拷贝行格式

## Crate 列表

| Crate                                                                       | 描述                         | 版本                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| [`fory`](https://github.com/apache/fory/blob/main/rust/fory)                | 带有 derive macro 的高级 API | [![crates.io](https://img.shields.io/crates/v/fory.svg)](https://crates.io/crates/fory)               |
| [`fory-core`](https://github.com/apache/fory/blob/main/rust/fory-core/)     | 核心序列化引擎               | [![crates.io](https://img.shields.io/crates/v/fory-core.svg)](https://crates.io/crates/fory-core)     |
| [`fory-derive`](https://github.com/apache/fory/blob/main/rust/fory-derive/) | 过程宏                       | [![crates.io](https://img.shields.io/crates/v/fory-derive.svg)](https://crates.io/crates/fory-derive) |

## 快速开始

在你的 `Cargo.toml` 中添加 Apache Fory™：

```toml
[dependencies]
fory = "0.14"
```

### 基础示例

```rust
use fory::{Fory, Error, Reader};
use fory::ForyObject;

#[derive(ForyObject, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
    email: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
    fory.register::<User>(1)?;

    let user = User {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };

    // 序列化
    let bytes = fory.serialize(&user)?;
    // 反序列化
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);

    // 序列化到指定缓冲区
    let mut buf: Vec<u8> = vec![];
    fory.serialize_to(&mut buf, &user)?;
    // 从指定缓冲区反序列化
    let mut reader = Reader::new(&buf);
    let decoded: User = fory.deserialize_from(&mut reader)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

## 线程安全

Apache Fory™ Rust 是完全线程安全的：`Fory` 同时实现了 `Send` 和 `Sync`，因此一个配置好的实例可以在多个线程之间共享以进行并发工作。内部的读/写上下文池是使用线程安全原语延迟初始化的，让工作线程可以重用缓冲区而无需协调。

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use std::sync::Arc;
use std::thread;

#[derive(ForyObject, Clone, Copy, Debug, PartialEq)]
struct Item {
    value: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
    fory.register::<Item>(1000)?;

    let fory = Arc::new(fory);
    let handles: Vec<_> = (0..8)
        .map(|i| {
            let shared = Arc::clone(&fory);
            thread::spawn(move || {
                let item = Item { value: i };
                shared.serialize(&item)
            })
        })
        .collect();

    for handle in handles {
        let bytes = handle.join().unwrap()?;
        let item: Item = fory.deserialize(&bytes)?;
        assert!(item.value >= 0);
    }

    Ok(())
}
```

**提示：** 在生成线程之前执行注册操作（例如 `fory.register::<T>(id)`），以便每个工作线程看到相同的元数据。配置完成后，将实例包装在 `Arc` 中就足以安全地分发序列化和反序列化任务。

## 架构

Rust 实现由三个主要 crate 组成：

```
fory/                   # 高级 API
├── src/lib.rs         # 公共 API 导出

fory-core/             # 核心序列化引擎
├── src/
│   ├── fory.rs       # 主序列化入口点
│   ├── buffer.rs     # 二进制缓冲区管理
│   ├── serializer/   # 类型特定序列化器
│   ├── resolver/     # 类型解析和元数据
│   ├── meta/         # 元字符串压缩
│   ├── row/          # 行格式实现
│   └── types.rs      # 类型定义

fory-derive/           # 过程宏
├── src/
│   ├── object/       # ForyObject 宏
│   └── fory_row.rs  # ForyRow 宏
```

## 使用场景

### 对象序列化

- 包含嵌套对象和引用的复杂数据结构
- 微服务中的跨语言通信
- 具有完整类型安全的通用序列化
- 使用兼容模式的 schema 演化
- 具有循环引用的图形数据结构

### 行格式序列化

- 高吞吐量数据处理
- 需要快速字段访问的分析工作负载
- 内存受限环境
- 实时数据流应用
- 零拷贝场景

## 后续步骤

- [配置](configuration.md) - Fory 构建器选项和模式
- [基础序列化](basic-serialization.md) - 对象图序列化
- [引用](references.md) - 共享引用和循环引用
- [多态](polymorphism.md) - Trait 对象序列化
- [跨语言](cross-language.md) - XLANG 模式
- [行格式](row-format.md) - 零拷贝行格式
