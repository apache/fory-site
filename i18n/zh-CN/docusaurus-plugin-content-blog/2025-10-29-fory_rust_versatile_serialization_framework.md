---
slug: fory_rust_versatile_serialization_framework
title: "重磅发布：Apache Fory™ Rust，面向现代开发的全能序列化框架"
authors: [chaokunyang]
tags: [fory, rust]
---

**TL;DR**：Apache Fory Rust 让跨语言序列化同时拥有顶级性能与顺滑开发体验。它以 Rust 的安全模型为基础，通过零拷贝、自动引用管理和自适应 schema 演进，处理循环引用、trait 对象、多语言互通等棘手场景而无需额外样板代码。

- 🐙 GitHub: https://github.com/apache/fory
- 📦 Crate: https://crates.io/crates/fory

![Apache Fory Logo](https://fory.apache.org/img/navbar-logo.png)

---

## 序列化的三难选择

后台工程师迟早会撞上这堵墙：系统里充满嵌套结构、循环引用、运行时多态，你却只能在以下三种糟糕方案里挑一个：

1. **速度快却脆弱**：手写二进制协议，一遇到 schema 变动就整体崩塌
2. **灵活却迟钝**：JSON、Protocol Buffers 性能动辄慢一个数量级
3. **功能全却掣肘**：现成框架不理解你语言里的高级抽象

Apache Fory Rust 把这个难题彻底推翻：不需要 IDL、不用同步 schema，也无需牺牲吞吐量，就能把复杂对象牢牢握在手里。

## Apache Fory Rust 的独到之处

### 1. **真正的跨语言互操作**

Fory Rust 与 Java、Python、C++、Go 等官方实现走的是同一套二进制协议。Rust 里写入、Python 里读出，二进制直接通用，无需生成代码，也不存在版本错配。

```rust
// Rust: Serialize
let user = User {
    name: "Alice".to_string(),
    age: 30,
    metadata: HashMap::from([("role", "admin")]),
};
let bytes = fory.serialize(&user);

// Python: Deserialize (same binary format!)
user = fory.deserialize(bytes)  # Just works!
```

跨语言序列化因此变成产品级的可靠能力，而非勉强达成的工程妥协。

### 2. **共享与循环引用一网打尽**

多数序列化库遇到循环引用就报错。Fory 会在编解码阶段自动追踪引用关系，既保留共享对象，也保持指针身份。

**Shared Reference：**

```rust
use fory::Fory;
use std::rc::Rc;

let fory = Fory::default();

// Create a shared value
let shared = Rc::new(String::from("shared_value"));

// Reference it multiple times
let data = vec![shared.clone(), shared.clone(), shared.clone()];

// The shared value is serialized only once
let bytes = fory.serialize(&data);
let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;

// Verify reference identity is preserved
assert_eq!(decoded.len(), 3);
assert_eq!(*decoded[0], "shared_value");

// All three Rc pointers point to the same object
assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
assert!(Rc::ptr_eq(&decoded[1], &decoded[2]));
```

**Circular Reference：**

```rust
use fory::{ForyObject, RcWeak};

#[derive(ForyObject)]
struct Node {
    value: i32,
    parent: RcWeak<RefCell<Node>>,     // Weak pointer breaks cycles
    children: Vec<Rc<RefCell<Node>>>,  // Strong references tracked
}

// Build a parent-child tree with circular references
let parent = Rc::new(RefCell::new(Node { ... }));
let child = Rc::new(RefCell::new(Node {
    parent: RcWeak::from(&parent),  // Points back to parent
    ...
}));
parent.borrow_mut().children.push(child.clone());

// Serialization handles the cycle automatically
let bytes = fory.serialize(&parent);
let decoded: Rc<RefCell<Node>> = fory.deserialize(&bytes)?;

// Reference relationships preserved!
assert!(Rc::ptr_eq(&decoded, &decoded.borrow().children[0].borrow().parent.upgrade().unwrap()));
```

图数据库、ORM、复杂领域模型都因此受益，工程团队再也不用为保留指针身份写边角逻辑。

### 3. **Trait 对象序列化终于不再折腾**

Rust 的抽象力来自 trait，但 `Box<dyn Trait>` 序列化一直被视为难题。Fory 内建类型注册机制，处理起来轻松自然。

```rust
use fory::{ForyObject, Serializer, register_trait_type};

trait Animal: Serializer {
    fn speak(&self) -> String;
}

#[derive(ForyObject)]
struct Dog { name: String, breed: String }

#[derive(ForyObject)]
struct Cat { name: String, color: String }

// Register implementations
register_trait_type!(Animal, Dog, Cat);

// Serialize heterogeneous collections
let animals: Vec<Box<dyn Animal>> = vec![
    Box::new(Dog { ... }),
    Box::new(Cat { ... }),
];

let bytes = fory.serialize(&animals);
let decoded: Vec<Box<dyn Animal>> = fory.deserialize(&bytes)?;

// Polymorphism preserved!
decoded[0].speak();  // "Woof!"
decoded[1].speak();  // "Meow!"
```

**无需注册，直接使用 `dyn Any` 的写法：**

```rust
use std::rc::Rc;
use std::any::Any;

// No trait definition or registration needed
let dog: Rc<dyn Any> = Rc::new(Dog { name: "Rex".to_string(), breed: "Labrador".to_string() });
let cat: Rc<dyn Any> = Rc::new(Cat { name: "Whiskers".to_string(), color: "Orange".to_string() });

let bytes = fory.serialize(&dog);
let decoded: Rc<dyn Any> = fory.deserialize(&bytes)?;

// Downcast to concrete type
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Rex");
```

支持面向 `Box`、`Rc`、`Arc` 的 trait 对象，以及 `Rc<dyn Any>` / `Arc<dyn Any>` 等运行时多态场景，为插件系统、异构集合和可扩展架构打开新的空间。

### 4. **Schema 演进无需同步发布**

微服务独立迭代时，最怕 schema 不一致。Fory 的 **Compatible 模式** 允许你放心升级字段，老版本数据依旧读得出来。

```rust
use fory::{Fory, ForyObject};

// Service A: Version 1
#[derive(ForyObject)]
struct User {
    name: String,
    age: i32,
    address: String,
}

let mut fory_v1 = Fory::default().compatible(true);
fory_v1.register::<User>(1);

// Service B: Version 2 (evolved independently)
#[derive(ForyObject)]
struct User {
    name: String,
    age: i32,
    // address removed
    phone: Option<String>,     // New field
    metadata: HashMap<String, String>,  // Another new field
}

let mut fory_v2 = Fory::default().compatible(true);
fory_v2.register::<User>(1);

// V1 data deserializes into V2 structure
let v1_bytes = fory_v1.serialize(&user_v1);
let user_v2: User = fory_v2.deserialize(&v1_bytes)?;
// Missing fields get default values automatically
```

**兼容策略概览：**

- ✅ 新增字段会被自动赋默认值
- ✅ 删除字段时旧数据会被跳过
- ✅ 字段顺序可随意调整，按名称对齐
- ✅ 可空性 (`T` ↔ `Option<T>`) 可互换
- ❌ 字段类型不可直接改动（可空性除外）

零停机上新、跨团队协同和多语言部署都能依赖这一机制。

## 技术基石

### 协议设计

Fory 的二进制协议兼顾吞吐与灵活度：

```
| fory header | reference meta | type meta | value data |
```

四项关键设计：

1. **紧凑编码**：可变长整数、精简类型 ID、位级标志位
2. **引用追踪**：共享对象只写一次，此后以引用替代
3. **元信息压缩**：meta-sharing 模式下对类型描述做 gzip 压缩
4. **小端布局**：适配现代 CPU 的缓存与对齐策略

### 编译期代码生成

Fory 通过过程宏在编译期生成序列化逻辑，避开运行时反射开销。

```rust
use fory::ForyObject;

#[derive(ForyObject)]
struct Person {
    name: String,
    age: i32,
    address: Address,
}

// Macro generates:
// - fory_write_data() for serialization
// - fory_read_data() for deserialization
// - fory_reserved_space() for buffer pre-allocation
// - fory_get_type_id() for type registration
```

因此：

- ⚡ 没有运行时分派或反射
- 🛡️ 类型不匹配在编译期即会被捕获
- 📦 只生成实际用到的序列化代码
- 🔍 IDE 推导体验完整保留

### 组件划分

整个 Rust 实现由三个 crate 组成，职责分明：

```
fory/            # 高阶 API
  └─ 常用封装与 derive 重导出

fory-core/       # 核心序列化内核
  ├─ fory.rs         # 入口模块
  ├─ buffer.rs       # 零拷贝缓冲区
  ├─ serializer/     # 针对类型的序列化器
  ├─ resolver/       # 类型注册与派发
  ├─ meta/           # 元信息压缩
  └─ row/            # Row format 实现

fory-derive/     # 过程宏集合
  ├─ object/         # ForyObject derive 宏
  └─ fory_row.rs     # ForyRow derive 宏
```

模块化设计让团队能够放心演进性能和功能，而无需担心耦合。

## 基准：真实业务下的吞吐

<img src="/img/benchmarks/rust/ecommerce_data.png" width="90%"/>
<img src="/img/benchmarks/rust/system_data.png" width="90%"/>

| 数据类型       | 数据规模 | 操作类型  | Fory TPS   | JSON TPS   | Protobuf TPS | 最快 |
| -------------- | -------- | --------- | ---------- | ---------- | ------------ | ---- |
| company        | small    | serialize | 10,063,906 | 761,673    | 896,620      | fory |
| company        | medium   | serialize | 412,507    | 33,835     | 37,590       | fory |
| company        | large    | serialize | 9,183      | 793        | 880          | fory |
| ecommerce_data | small    | serialize | 2,350,729  | 206,262    | 256,970      | fory |
| ecommerce_data | medium   | serialize | 59,977     | 4,699      | 5,242        | fory |
| ecommerce_data | large    | serialize | 3,727      | 266        | 295          | fory |
| person         | small    | serialize | 13,632,522 | 1,345,189  | 1,475,035    | fory |
| person         | medium   | serialize | 3,839,656  | 337,610    | 369,031      | fory |
| person         | large    | serialize | 907,853    | 79,631     | 91,408       | fory |
| simple_list    | small    | serialize | 27,726,945 | 4,874,957  | 4,643,172    | fory |
| simple_list    | medium   | serialize | 4,770,765  | 401,558    | 397,551      | fory |
| simple_list    | large    | serialize | 606,061    | 41,061     | 44,565       | fory |
| simple_map     | small    | serialize | 22,862,369 | 3,888,025  | 2,695,999    | fory |
| simple_map     | medium   | serialize | 2,128,973  | 204,319    | 193,132      | fory |
| simple_map     | large    | serialize | 177,847    | 18,419     | 18,668       | fory |
| simple_struct  | small    | serialize | 35,729,598 | 10,167,045 | 8,633,342    | fory |
| simple_struct  | medium   | serialize | 34,988,279 | 9,737,098  | 6,433,350    | fory |
| simple_struct  | large    | serialize | 31,801,558 | 4,545,041  | 7,420,049    | fory |
| system_data    | small    | serialize | 5,382,131  | 468,033    | 569,930      | fory |
| system_data    | medium   | serialize | 174,240    | 11,896     | 14,753       | fory |
| system_data    | large    | serialize | 10,671     | 876        | 1,040        | fory |

可以通过 https://github.com/apache/fory/tree/v0.16.0/benchmarks/rust 查看更多 Rust Benchmark 代码和数据。

## 适用与不适用的场景

### ✅ 最佳落地案例

1. **多语言微服务体系**
   - 团队间使用不同语言
   - 无 schema 文件的跨语言通信
   - 独立升级却要保持兼容

2. **高吞吐数据流水线**
   - 每秒处理数百万条记录
   - 内存紧张，可借助 row format
   - 分析场景需要按字段解码

3. **结构复杂的领域模型**
   - 父子引用、图结构、循环依赖
   - trait 对象、多态层次丰富
   - 共享引用必须原样保留

4. **低延迟系统**
   - 序列化开销要求低于 1ms
   - 借助内存映射文件
   - 强调零拷贝读写

### ⚠️ 可以考虑其他方案的情况

1. **调试必须可读**：直接使用 JSON/YAML
2. **长期存档**：面向数据湖的 Parquet 更合适
3. **数据结构极其简单**：`serde` + `bincode` 成本最低

## 五分钟快速上手

### 安装依赖

在 `Cargo.toml` 中加入：

```toml
[dependencies]
fory = "0.13"
```

### 首个对象的读写

```rust
use fory::{Fory, Error, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct User {
    name: String,
    age: i32,
    email: String,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::default();
    fory.register::<User>(1);  // Register with unique ID
    let user = User {
        name: "Alice".to_string(),
        age: 30,
        email: "alice@example.com".to_string(),
    };
    // Serialize
    let bytes = fory.serialize(&user);
    // Deserialize
    let decoded: User = fory.deserialize(&bytes)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

### 跨语言互通配置

```rust
use fory::Fory;

// Enable cross-language mode
let mut fory = Fory::default().compatible(true).xlang(true);

// Register with id/namespace for cross-language compatibility
fory.register_by_namespace::<User>(1);
// fory.register_by_namespace::<User>("example", "User");

let bytes = fory.serialize(&user);
// This can now be deserialized in Java, Python, Go, etc.
```

请确保所有语言实现都以一致的 ID 或名称注册类型：

- **使用 ID**（`fory.register::<User>(1)`）：编码最紧凑、吞吐最好，但需要跨团队协调 ID
- **使用名称**（`fory.register_by_name::<User>("example.User")`）：更易管理、冲突风险低，代价是编码稍大

## 支持的类型族群

Fory Rust 支持体系涵盖：

**原生类型**：`bool`、`i8`、`i16`、`i32`、`i64`、`f32`、`f64`、`String`

**集合容器**：`Vec<T>`、`HashMap<K,V>`、`BTreeMap<K,V>`、`HashSet<T>`、`Option<T>`

**智能指针**：`Box<T>`、`Rc<T>`、`Arc<T>`、`RcWeak<T>`、`ArcWeak<T>`、`RefCell<T>`、`Mutex<T>`

**日期时间**：`chrono::NaiveDate`、`chrono::NaiveDateTime`

**自定义类型**：对象图使用 `ForyObject`，行式存储使用 `ForyRow`

**Trait 对象**：`Box<dyn T>`、`Rc<dyn T>`、`Arc<dyn T>`、`Rc<dyn Any>`、`Arc<dyn Any>`

## 路线图：现在与未来

Fory Rust 已经稳定可用于生产，同时仍保持高速演进。

### ✅ v0.13 已完成

- ✅ 过程宏驱动的静态代码生成
- ✅ 零拷贝 row format 编解码
- ✅ 跨语言对象图序列化
- ✅ 自动追踪共享与循环引用
- ✅ `RcWeak`、`ArcWeak` 等弱指针支持
- ✅ `Box` / `Rc` / `Arc` trait 对象序列化
- ✅ Compatible 模式支持 schema 演进

### 🚧 研发中

- [ ] **跨语言引用序列化**：`Rc/Arc` 跨语言互通
- [ ] **Row format 局部更新**：原地更新部分字段

### 🎯 社区期待

欢迎加入并贡献：

- **性能优化**：深挖热点路径
- **文档补完**：案例、指南、教学
- **测试覆盖**：基准、性质、边界场景

## 生产级别的考量

### 线程安全模式

完成所有类型注册后，`Fory` 即具备线程安全特性。此时用 `Arc` 包装、分发到多个线程，既能并发序列化，也能并发解码。

```rust
use fory::Fory;
use std::{sync::Arc, thread};

let mut fory = Fory::default();
fory.register::<Item>(1)?;
let fory = Arc::new(fory); // `Fory` is Send + Sync once registration is done

let item = Item::default();
let handles: Vec<_> = (0..4)
    .map(|_| {
        let fory = Arc::clone(&fory);
        let input = item.clone();
        thread::spawn(move || {
            let bytes = fory.serialize(&input);
            let decoded: Item = fory.deserialize(&bytes).expect("valid data");
            (bytes, decoded)
        })
    })
    .collect();

for handle in handles {
    let (bytes, decoded) = handle.join().expect("thread finished");
    // work with `bytes` / `decoded`
}
```

### 错误处理方式

所有可失败操作都返回 `Result<T, Error>`，与 Rust 生态保持一致。

```rust
use fory::Error;

match fory.deserialize::<User>(&bytes) {
    Ok(user) => process_user(user),
    Err(Error::TypeMismatch) => log::error!("Schema mismatch"),
    Err(Error::BufferTooShort) => log::error!("Incomplete data"),
    Err(e) => log::error!("Deserialization failed: {}", e),
}
```

## 文档与资源

- Apache Fory Rust 指南：[📖 查看](https://fory.apache.org/docs/docs/guide/rust_serialization)
- Apache Fory Rust API：[📖 查看](https://docs.rs/fory/latest/fory/)
- Apache Fory Xlang 协议规范：[📖 查看](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec/)

## 社区与共建

Apache Fory 隶属于 **Apache 软件基金会**，社区活跃并持续壮大：

- **GitHub**：[apache/fory](https://github.com/apache/fory)
- **文档站**：[fory.apache.org](https://fory.apache.org)
- **Slack**：[加入社区](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)
- **Issue Tracker**：[GitHub Issues](https://github.com/apache/fory/issues)

### 如何参与贡献

1. **代码**：实现路线图上的功能点
2. **文档**：补充教程、示例与实践
3. **测试**：完善基准、模糊与集成测试
4. **反馈**：提交 Bug、需求或使用经验

详见 [CONTRIBUTING.md](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)。

### 许可证

项目使用 **Apache License 2.0**，允许商业应用、修改和再发行。

## 收官

Apache Fory Rust 把性能、灵活度和开发者体验重新排列组合：

- **性能与灵活性并行**，不再二选一
- **复杂样板自动化**，derive 宏替你完成繁琐实现
- **天然支持多态与引用**，跨语言协作不再吃力

如果你正在构建微服务、高速数据管线或实时系统，Fory Rust 值得马上试用。

**立即体验：**

```bash
cargo add fory
```

**加入社区：**

```bash
git clone https://github.com/apache/fory.git
cd fory/rust
cargo test --features tests
```

**分享经验：**

- 写一篇实践文章
- 在 Rust Meetup 做场分享
- 提交与你业务相关的基准数据
