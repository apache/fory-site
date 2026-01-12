---
title: Rust 序列化
sidebar_position: 2
id: rust_serialization
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

## Apache Fory™ Rust

**Apache Fory™** 是一个极速的多语言序列化框架，由 **JIT 编译**和**零拷贝**技术驱动，在保持易用性和安全性的同时提供**超高性能**。

Rust 实现提供了多功能的高性能序列化，具备自动内存管理和编译时类型安全。

## 🚀 为什么选择 Apache Fory™ Rust？

- **🔥 极速性能**：零拷贝反序列化和优化的二进制协议
- **🌍 跨语言**：与 Java、Python、C++、Go、JavaScript 和 Rust 之间无缝序列化/反序列化数据
- **🎯 类型安全**：通过派生宏进行编译时类型检查
- **🔄 循环引用**：使用 `Rc`/`Arc` 和弱指针自动追踪共享和循环引用
- **🧬 多态**：使用 `Box<dyn Trait>`、`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 序列化 trait 对象
- **📦 Schema 演进**：兼容模式支持独立的 schema 变更
- **⚡ 两种模式**：对象图序列化和零拷贝的基于行的格式

## 📦 Crates

| Crate                                                                       | 描述               | 版本                                 |
| --------------------------------------------------------------------------- | ------------------ | ------------------------------------ |
| [`fory`](https://github.com/apache/fory/blob/main/rust/fory)                | 带派生宏的高级 API | https://crates.io/crates/fory        |
| [`fory-core`](https://github.com/apache/fory/blob/main/rust/fory-core/)     | 核心序列化引擎     | https://crates.io/crates/fory-core   |
| [`fory-derive`](https://github.com/apache/fory/blob/main/rust/fory-derive/) | 过程宏             | https://crates.io/crates/fory-derive |

## 🏃 快速开始

添加 Apache Fory™ 到你的 `Cargo.toml`：

```toml
[dependencies]
fory = "0.14"
```

### 基本示例

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
    fory.serialize_to(&user, &mut buf)?;
    // 从指定缓冲区反序列化
    let mut reader = Reader::new(&buf);
    let decoded: User = fory.deserialize_from(&mut reader)?;
    assert_eq!(user, decoded);
    Ok(())
}
```

## 📚 核心特性

### 1. 对象图序列化

Apache Fory™ 提供了复杂对象图的自动序列化，保留对象之间的结构和关系。`#[derive(ForyObject)]` 宏在编译时生成高效的序列化代码，消除运行时开销。

**核心能力：**

- 任意深度的嵌套结构体序列化
- 集合类型（Vec、HashMap、HashSet、BTreeMap）
- 使用 `Option<T>` 的可选字段
- 自动处理基本类型和字符串
- 使用变长整数的高效二进制编码

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use std::collections::HashMap;

#[derive(ForyObject, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
    address: Address,
    hobbies: Vec<String>,
    metadata: HashMap<String, String>,
}

#[derive(ForyObject, Debug, PartialEq)]
struct Address {
    street: String,
    city: String,
    country: String,
}

let mut fory = Fory::default();
fory.register::<Address>(100);
fory.register::<Person>(200);

let person = Person {
    name: "John Doe".to_string(),
    age: 30,
    address: Address {
        street: "123 Main St".to_string(),
        city: "New York".to_string(),
        country: "USA".to_string(),
    },
    hobbies: vec!["reading".to_string(), "coding".to_string()],
    metadata: HashMap::from([
        ("role".to_string(), "developer".to_string()),
    ]),
};

let bytes = fory.serialize(&person);
let decoded: Person = fory.deserialize(&bytes)?;
assert_eq!(person, decoded);
```

### 2. 共享和循环引用

Apache Fory™ 使用 `Rc<T>` 和 `Arc<T>` 自动追踪和保留共享对象的引用标识。当同一个对象被多次引用时，Fory 只序列化一次，并为后续出现的引用使用引用 ID。这确保了：

- **空间效率**：序列化输出中没有数据重复
- **引用标识保留**：反序列化的对象保持相同的共享关系
- **循环引用支持**：使用 `RcWeak<T>` 和 `ArcWeak<T>` 打破循环

#### 使用 Rc/Arc 的共享引用

```rust
use fory::Fory;
use std::rc::Rc;

let fory = Fory::default();

// 创建一个共享值
let shared = Rc::new(String::from("shared_value"));

// 多次引用它
let data = vec![shared.clone(), shared.clone(), shared.clone()];

// 共享值只被序列化一次
let bytes = fory.serialize(&data);
let decoded: Vec<Rc<String>> = fory.deserialize(&bytes)?;

// 验证引用标识被保留
assert_eq!(decoded.len(), 3);
assert_eq!(*decoded[0], "shared_value");

// 所有三个 Rc 指针指向同一个对象
assert!(Rc::ptr_eq(&decoded[0], &decoded[1]));
assert!(Rc::ptr_eq(&decoded[1], &decoded[2]));
```

对于线程安全的共享引用，使用 `Arc<T>`。

#### 使用弱指针的循环引用

````

#### 使用弱指针的循环引用

要序列化像父子关系或双向链表结构这样的循环引用，使用 `RcWeak<T>` 或 `ArcWeak<T>` 来打破循环。这些弱指针被序列化为对其强指针对应物的引用，在不导致内存泄漏或无限递归的情况下保留图结构。

**工作原理：**

- 弱指针序列化为对其目标对象的引用
- 如果强指针已被丢弃，弱指针序列化为 `Null`
- 前向引用（弱指针在目标之前出现）通过回调解析
- 弱指针的所有克隆共享相同的内部 cell 以实现自动更新

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use fory::RcWeak;
use std::rc::Rc;
use std::cell::RefCell;

#[derive(ForyObject, Debug)]
struct Node {
    value: i32,
    parent: RcWeak<RefCell<Node>>,
    children: Vec<Rc<RefCell<Node>>>,
}

let mut fory = Fory::default();
fory.register::<Node>(2000);

// Build a parent-child tree
let parent = Rc::new(RefCell::new(Node {
    value: 1,
    parent: RcWeak::new(),
    children: vec![],
}));

let child1 = Rc::new(RefCell::new(Node {
    value: 2,
    parent: RcWeak::from(&parent),
    children: vec![],
}));

let child2 = Rc::new(RefCell::new(Node {
    value: 3,
    parent: RcWeak::from(&parent),
    children: vec![],
}));

parent.borrow_mut().children.push(child1.clone());
parent.borrow_mut().children.push(child2.clone());

// 序列化和反序列化循环结构
let bytes = fory.serialize(&parent);
let decoded: Rc<RefCell<Node>> = fory.deserialize(&bytes)?;

// 验证循环关系
assert_eq!(decoded.borrow().children.len(), 2);
for child in &decoded.borrow().children {
    let upgraded_parent = child.borrow().parent.upgrade().unwrap();
    assert!(Rc::ptr_eq(&decoded, &upgraded_parent));
}
````

**使用 Arc 的线程安全循环图：**

```rust
use fory::{Fory, Error};
use fory::ForyObject;
use fory::ArcWeak;
use std::sync::{Arc, Mutex};

#[derive(ForyObject)]
struct Node {
    val: i32,
    parent: ArcWeak<Mutex<Node>>,
    children: Vec<Arc<Mutex<Node>>>,
}

let mut fory = Fory::default();
fory.register::<Node>(6000);

let parent = Arc::new(Mutex::new(Node {
    val: 10,
    parent: ArcWeak::new(),
    children: vec![],
}));

let child1 = Arc::new(Mutex::new(Node {
    val: 20,
    parent: ArcWeak::from(&parent),
    children: vec![],
}));

let child2 = Arc::new(Mutex::new(Node {
    val: 30,
    parent: ArcWeak::from(&parent),
    children: vec![],
}));

parent.lock().unwrap().children.push(child1.clone());
parent.lock().unwrap().children.push(child2.clone());

let bytes = fory.serialize(&parent);
let decoded: Arc<Mutex<Node>> = fory.deserialize(&bytes)?;

assert_eq!(decoded.lock().unwrap().children.len(), 2);
for child in &decoded.lock().unwrap().children {
    let upgraded_parent = child.lock().unwrap().parent.upgrade().unwrap();
    assert!(Arc::ptr_eq(&decoded, &upgraded_parent));
}
```

### 3. Trait 对象序列化

Apache Fory™ 通过 trait 对象支持多态序列化，实现动态分发和类型灵活性。这对于插件系统、异构集合和可扩展架构至关重要。

**支持的 trait 对象类型：**

- `Box<dyn Trait>` - 拥有所有权的 trait 对象
- `Rc<dyn Trait>` - 引用计数的 trait 对象
- `Arc<dyn Trait>` - 线程安全的引用计数 trait 对象
- `Vec<Box<dyn Trait>>`、`HashMap<K, Box<dyn Trait>>` - trait 对象集合

#### 基本 Trait 对象序列化

```rust
use fory::{Fory, register_trait_type};
use fory::Serializer;
use fory::ForyObject;

trait Animal: Serializer {
    fn speak(&self) -> String;
    fn name(&self) -> &str;
}

#[derive(ForyObject)]
struct Dog { name: String, breed: String }

impl Animal for Dog {
    fn speak(&self) -> String { "Woof!".to_string() }
    fn name(&self) -> &str { &self.name }
}

#[derive(ForyObject)]
struct Cat { name: String, color: String }

impl Animal for Cat {
    fn speak(&self) -> String { "Meow!".to_string() }
    fn name(&self) -> &str { &self.name }
}

// 注册 trait 实现
register_trait_type!(Animal, Dog, Cat);

#[derive(ForyObject)]
struct Zoo {
    star_animal: Box<dyn Animal>,
}

let mut fory = Fory::default().compatible(true);
fory.register::<Dog>(100);
fory.register::<Cat>(101);
fory.register::<Zoo>(102);

let zoo = Zoo {
    star_animal: Box::new(Dog {
        name: "Buddy".to_string(),
        breed: "Labrador".to_string(),
    }),
};

let bytes = fory.serialize(&zoo);
let decoded: Zoo = fory.deserialize(&bytes)?;

assert_eq!(decoded.star_animal.name(), "Buddy");
assert_eq!(decoded.star_animal.speak(), "Woof!");
```

#### 序列化 `dyn Any` Trait 对象

Apache Fory™ 支持序列化 `Rc<dyn Any>` 和 `Arc<dyn Any>` 以实现运行时类型分发。这在你需要最大灵活性且不想定义自定义 trait 时很有用。

**关键点：**

- 适用于任何实现 `Serializer` 的类型
- 反序列化后需要向下转型以访问具体类型
- 序列化期间保留类型信息
- 适用于插件系统和动态类型处理

```rust
use std::rc::Rc;
use std::any::Any;

let dog_rc: Rc<dyn Animal> = Rc::new(Dog {
    name: "Rex".to_string(),
    breed: "Golden".to_string()
});

// 转换为 Rc<dyn Any> 用于序列化
let dog_any: Rc<dyn Any> = dog_rc.clone();

// 序列化 Any 包装器
let bytes = fory.serialize(&dog_any);
let decoded: Rc<dyn Any> = fory.deserialize(&bytes)?;

// 向下转型回具体类型
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Rex");
```

对于线程安全场景，使用 `Arc<dyn Any>`：

```rust
use std::sync::Arc;
use std::any::Any;

let dog_arc: Arc<dyn Animal> = Arc::new(Dog {
    name: "Buddy".to_string(),
    breed: "Labrador".to_string()
});

// 转换为 Arc<dyn Any>
let dog_any: Arc<dyn Any> = dog_arc.clone();

let bytes = fory.serialize(&dog_any);
let decoded: Arc<dyn Any> = fory.deserialize(&bytes)?;

// 向下转型为具体类型
let unwrapped = decoded.downcast_ref::<Dog>().unwrap();
assert_eq!(unwrapped.name, "Buddy");
```

#### 结构体中基于 Rc/Arc 的 Trait 对象

对于带有 `Rc<dyn Trait>` 或 `Arc<dyn Trait>` 的字段，Fory 自动处理转换：

```rust
use std::sync::Arc;
use std::rc::Rc;
use std::collections::HashMap;

#[derive(ForyObject)]
struct AnimalShelter {
    animals_rc: Vec<Rc<dyn Animal>>,
    animals_arc: Vec<Arc<dyn Animal>>,
    registry: HashMap<String, Arc<dyn Animal>>,
}

let mut fory = Fory::default().compatible(true);
fory.register::<Dog>(100);
fory.register::<Cat>(101);
fory.register::<AnimalShelter>(102);

let shelter = AnimalShelter {
    animals_rc: vec![
        Rc::new(Dog { name: "Rex".to_string(), breed: "Golden".to_string() }),
        Rc::new(Cat { name: "Mittens".to_string(), color: "Gray".to_string() }),
    ],
    animals_arc: vec![
        Arc::new(Dog { name: "Buddy".to_string(), breed: "Labrador".to_string() }),
    ],
    registry: HashMap::from([
        ("pet1".to_string(), Arc::new(Dog {
            name: "Max".to_string(),
            breed: "Shepherd".to_string()
        }) as Arc<dyn Animal>),
    ]),
};

let bytes = fory.serialize(&shelter);
let decoded: AnimalShelter = fory.deserialize(&bytes)?;

assert_eq!(decoded.animals_rc[0].name(), "Rex");
assert_eq!(decoded.animals_arc[0].speak(), "Woof!");
```

#### 独立 Trait 对象序列化

由于 Rust 的孤儿规则，`Rc<dyn Trait>` 和 `Arc<dyn Trait>` 不能直接实现 `Serializer`。对于独立序列化（不在结构体字段内），`register_trait_type!` 宏会生成包装器类型。

**注意：** 如果你不想使用包装器类型，可以改为序列化为 `Rc<dyn Any>` 或 `Arc<dyn Any>`（参见上面的 `dyn Any` 部分）。

`register_trait_type!` 宏生成 `AnimalRc` 和 `AnimalArc` 包装器类型：

```rust
// 对于 Rc<dyn Trait>
let dog_rc: Rc<dyn Animal> = Rc::new(Dog {
    name: "Rex".to_string(),
    breed: "Golden".to_string()
});
let wrapper = AnimalRc::from(dog_rc);

let bytes = fory.serialize(&wrapper);
let decoded: AnimalRc = fory.deserialize(&bytes)?;

// 解包回 Rc<dyn Animal>
let unwrapped: Rc<dyn Animal> = decoded.unwrap();
assert_eq!(unwrapped.name(), "Rex");

// 对于 Arc<dyn Trait>
let dog_arc: Arc<dyn Animal> = Arc::new(Dog {
    name: "Buddy".to_string(),
    breed: "Labrador".to_string()
});
let wrapper = AnimalArc::from(dog_arc);

let bytes = fory.serialize(&wrapper);
let decoded: AnimalArc = fory.deserialize(&bytes)?;

let unwrapped: Arc<dyn Animal> = decoded.unwrap();
assert_eq!(unwrapped.name(), "Buddy");
```

### 4. Schema 演进

Apache Fory™ 在**兼容模式**下支持 schema 演进，允许序列化和反序列化端拥有不同的类型定义。这使得分布式系统中的服务能够独立演进而不破坏兼容性。

**特性：**

- 添加带默认值的新字段
- 移除过时字段（反序列化期间跳过）
- 改变字段可空性（`T` ↔ `Option<T>`）
- 重新排序字段（按名称匹配，而非位置）
- 为缺失字段提供类型安全的默认值回退

**兼容性规则：**

- 字段名必须匹配（区分大小写）
- 不支持类型更改（可空/非可空除外）
- 嵌套结构体类型必须在两端都注册

```rust
use fory::Fory;
use fory::ForyObject;
use std::collections::HashMap;

#[derive(ForyObject, Debug)]
struct PersonV1 {
    name: String,
    age: i32,
    address: String,
}

#[derive(ForyObject, Debug)]
struct PersonV2 {
    name: String,
    age: i32,
    // address removed
    // phone added
    phone: Option<String>,
    metadata: HashMap<String, String>,
}

let mut fory1 = Fory::default().compatible(true);
fory1.register::<PersonV1>(1);

let mut fory2 = Fory::default().compatible(true);
fory2.register::<PersonV2>(1);

let person_v1 = PersonV1 {
    name: "Alice".to_string(),
    age: 30,
    address: "123 Main St".to_string(),
};

// 使用 V1 序列化
let bytes = fory1.serialize(&person_v1);

// 使用 V2 反序列化 - 缺失字段获得默认值
let person_v2: PersonV2 = fory2.deserialize(&bytes)?;
assert_eq!(person_v2.name, "Alice");
assert_eq!(person_v2.age, 30);
assert_eq!(person_v2.phone, None);
```

### 5. 枚举支持

Apache Fory™ 支持三种枚举变体类型，并在兼容模式下完全支持 schema 演进：

**变体类型：**

- **Unit**：C 风格枚举（`Status::Active`）
- **Unnamed**：类元组变体（`Message::Pair(String, i32)`）
- **Named**：类结构体变体（`Event::Click { x: i32, y: i32 }`）

**特性：**

- 高效的 varint 编码变体序数
- Schema 演进支持（添加/删除变体，添加/删除字段）
- 使用 `#[default]` 的默认变体支持
- 自动类型不匹配处理

```rust
use fory::{Fory, ForyObject};

#[derive(Default, ForyObject, Debug, PartialEq)]
enum Value {
    #[default]
    Null,
    Bool(bool),
    Number(f64),
    Text(String),
    Object { name: String, value: i32 },
}

let mut fory = Fory::default();
fory.register::<Value>(1)?;

let value = Value::Object { name: "score".to_string(), value: 100 };
let bytes = fory.serialize(&value)?;
let decoded: Value = fory.deserialize(&bytes)?;
assert_eq!(value, decoded);
```

#### Schema 演进

兼容模式启用强大的 schema 演进，并使用变体类型编码（2 位）：

- `0b0` = Unit，`0b1` = Unnamed，`0b10` = Named

```rust
use fory::{Fory, ForyObject};

// 旧版本
#[derive(ForyObject)]
enum OldEvent {
    Click { x: i32, y: i32 },
    Scroll { delta: f64 },
}

// 新版本 - 添加了字段和变体
#[derive(Default, ForyObject)]
enum NewEvent {
    #[default]
    Unknown,
    Click { x: i32, y: i32, timestamp: u64 },  // 添加了字段
    Scroll { delta: f64 },
    KeyPress(String),  // 新变体
}

let mut fory = Fory::builder().compatible().build();

// 使用旧 schema 序列化
let old_bytes = fory.serialize(&OldEvent::Click { x: 100, y: 200 })?;

// 使用新 schema 反序列化 - timestamp 获得默认值 (0)
let new_event: NewEvent = fory.deserialize(&old_bytes)?;
assert!(matches!(new_event, NewEvent::Click { x: 100, y: 200, timestamp: 0 }));
```

**演进能力：**

- **未知变体** → 回退到默认变体
- **命名变体字段** → 添加/删除字段（缺失字段使用默认值）
- **未命名变体元素** → 添加/删除元素（多余的被跳过，缺失的使用默认值）
- **变体类型不匹配** → 自动使用当前变体的默认值

**最佳实践：**

- 始终使用 `#[default]` 标记默认变体
- 命名变体比未命名变体提供更好的演进能力
- 跨版本通信时使用兼容模式

### 6. 元组支持

Apache Fory™ 原生支持最多 22 个元素的元组，在兼容和非兼容模式下都能高效序列化。

**特性：**

- 自动序列化 1 到 22 个元素的元组
- 异构类型支持（每个元素可以是不同类型）
- 兼容模式下的 schema 演进（处理缺失/额外元素）

**序列化模式：**

1. **非兼容模式**：顺序序列化元素，无集合头，以实现最小开销
2. **兼容模式**：使用带类型元数据的集合协议以支持 schema 演进

```rust
use fory::{Fory, Error};

let mut fory = Fory::default();

// 异构类型的元组
let data: (i32, String, bool, Vec<i32>) = (
    42,
    "hello".to_string(),
    true,
    vec![1, 2, 3],
);

let bytes = fory.serialize(&data)?;
let decoded: (i32, String, bool, Vec<i32>) = fory.deserialize(&bytes)?;
assert_eq!(data, decoded);
```

### 7. 自定义序列化器

对于不能使用 `#[derive(ForyObject)]` 的类型，手动实现 `Serializer` trait。这在以下情况下很有用：

- 来自其他 crate 的外部类型
- 具有特殊序列化要求的类型
- 旧版数据格式兼容性
- 性能关键的自定义编码

```rust
use fory::{Fory, ReadContext, WriteContext, Serializer, ForyDefault, Error};
use std::any::Any;

#[derive(Debug, PartialEq)]
struct CustomType {
    value: i32,
    name: String,
}

impl Serializer for CustomType {
    fn fory_write_data(&self, context: &mut WriteContext, is_field: bool) {
        context.writer.write_i32(self.value);
        context.writer.write_varuint32(self.name.len() as u32);
        context.writer.write_utf8_string(&self.name);
    }

    fn fory_read_data(context: &mut ReadContext, is_field: bool) -> Result<Self, Error> {
        let value = context.reader.read_i32();
        let len = context.reader.read_varuint32() as usize;
        let name = context.reader.read_utf8_string(len);
        Ok(Self { value, name })
    }

    fn fory_type_id_dyn(&self, type_resolver: &TypeResolver) -> u32 {
        Self::fory_get_type_id(type_resolver)
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

impl ForyDefault for CustomType {
    fn fory_default() -> Self {
        Self::default()
    }
}

let mut fory = Fory::default();
fory.register_serializer::<CustomType>(100);

let custom = CustomType {
    value: 42,
    name: "test".to_string(),
};
let bytes = fory.serialize(&custom);
let decoded: CustomType = fory.deserialize(&bytes)?;
assert_eq!(custom, decoded);
```

### 7. 基于行的序列化

Apache Fory™ 提供了一种高性能的**行格式**用于零拷贝反序列化。与传统的对象序列化在内存中重构整个对象不同，行格式实现了**直接从二进制数据随机访问**字段，无需完全反序列化。

**关键优势：**

- **零拷贝访问**：无需分配或复制数据即可读取字段
- **部分反序列化**：只访问你需要的字段
- **内存映射文件**：处理大于 RAM 的数据
- **缓存友好**：顺序内存布局以获得更好的 CPU 缓存利用率
- **惰性求值**：将昂贵的操作延迟到字段访问时

**何时使用行格式：**

- 具有选择性字段访问的分析工作负载
- 只需要字段子集的大型数据集
- 内存受限环境
- 高吞吐量数据管道
- 从内存映射文件或共享内存中读取

**工作原理：**

- 字段在二进制行中编码，基本类型具有固定偏移量
- 可变长度数据（字符串、集合）使用偏移指针存储
- 空值位图追踪哪些字段存在
- 通过递归行编码支持嵌套结构

```rust
use fory::{to_row, from_row};
use fory::ForyRow;
use std::collections::BTreeMap;

#[derive(ForyRow)]
struct UserProfile {
    id: i64,
    username: String,
    email: String,
    scores: Vec<i32>,
    preferences: BTreeMap<String, String>,
    is_active: bool,
}

let profile = UserProfile {
    id: 12345,
    username: "alice".to_string(),
    email: "alice@example.com".to_string(),
    scores: vec![95, 87, 92, 88],
    preferences: BTreeMap::from([
        ("theme".to_string(), "dark".to_string()),
        ("language".to_string(), "en".to_string()),
    ]),
    is_active: true,
};

// 序列化为行格式
let row_data = to_row(&profile);

// 零拷贝反序列化 - 无对象分配！
let row = from_row::<UserProfile>(&row_data);

// 直接从二进制数据访问字段
assert_eq!(row.id(), 12345);
assert_eq!(row.username(), "alice");
assert_eq!(row.email(), "alice@example.com");
assert_eq!(row.is_active(), true);

// 高效访问集合
let scores = row.scores();
assert_eq!(scores.size(), 4);
assert_eq!(scores.get(0), 95);
assert_eq!(scores.get(1), 87);

let prefs = row.preferences();
assert_eq!(prefs.keys().size(), 2);
assert_eq!(prefs.keys().get(0), "language");
assert_eq!(prefs.values().get(0), "en");
```

**性能比较：**

| 操作         | 对象格式           | 行格式               |
| ------------ | ------------------ | -------------------- |
| 完全反序列化 | 分配所有对象       | 零分配               |
| 单字段访问   | 需要完全反序列化   | 直接偏移读取         |
| 内存使用     | 内存中的完整对象图 | 仅访问的字段在内存中 |
| 适用于       | 小对象，完全访问   | 大对象，选择性访问   |

### 8. 线程安全序列化

Apache Fory™ Rust 完全线程安全：`Fory` 同时实现了 `Send` 和 `Sync`，因此一个配置好的实例可以在线程间共享以进行并发工作。内部的读/写上下文池通过线程安全原语进行惰性初始化，让工作线程无需协调即可重用缓冲区。

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

**提示：** 在生成线程之前执行注册（如 `fory.register::<T>(id)`），以便每个工作线程都能看到相同的元数据。一旦配置完成，将实例包装在 `Arc` 中就足以安全地分发序列化和反序列化任务。

## 🔧 支持的类型

### 基本类型

| Rust 类型                 | 描述         |
| ------------------------- | ------------ |
| `bool`                    | 布尔值       |
| `i8`, `i16`, `i32`, `i64` | 有符号整数   |
| `f32`, `f64`              | 浮点数       |
| `String`                  | UTF-8 字符串 |

### 集合

| Rust 类型        | 描述     |
| ---------------- | -------- |
| `Vec<T>`         | 动态数组 |
| `VecDeque<T>`    | 双端队列 |
| `LinkedList<T>`  | 双向链表 |
| `HashMap<K, V>`  | 哈希映射 |
| `BTreeMap<K, V>` | 有序映射 |
| `HashSet<T>`     | 哈希集合 |
| `BTreeSet<T>`    | 有序集合 |
| `BinaryHeap<T>`  | 二叉堆   |
| `Option<T>`      | 可选值   |

### 智能指针

| Rust 类型    | 描述                                   |
| ------------ | -------------------------------------- |
| `Box<T>`     | 堆分配                                 |
| `Rc<T>`      | 引用计数（追踪共享引用）               |
| `Arc<T>`     | 线程安全的引用计数（追踪共享引用）     |
| `RcWeak<T>`  | 指向 `Rc<T>` 的弱引用（打破循环引用）  |
| `ArcWeak<T>` | 指向 `Arc<T>` 的弱引用（打破循环引用） |
| `RefCell<T>` | 内部可变性（运行时借用检查）           |
| `Mutex<T>`   | 线程安全的内部可变性                   |

### 日期和时间

| Rust 类型               | 描述           |
| ----------------------- | -------------- |
| `chrono::NaiveDate`     | 无时区的日期   |
| `chrono::NaiveDateTime` | 无时区的时间戳 |

### 自定义类型

| 宏                      | 描述           |
| ----------------------- | -------------- |
| `#[derive(ForyObject)]` | 对象图序列化   |
| `#[derive(ForyRow)]`    | 基于行的序列化 |

## 🌍 跨语言序列化

Apache Fory™ 支持多种语言之间的无缝数据交换：

```rust
use fory::Fory;

// 启用跨语言模式
let mut fory = Fory::default()
    .compatible(true)
    .xlang(true);

// 使用跨语言一致的 ID 注册类型
fory.register::<MyStruct>(100);

// 或使用基于命名空间的注册
fory.register_by_namespace::<MyStruct>("com.example", "MyStruct");
```

参见 [xlang_type_mapping.md](https://fory.apache.org/docs/specification/xlang_type_mapping) 了解跨语言的类型映射。

## ⚡ 性能

Apache Fory™ Rust 设计追求最大性能：

- **零拷贝反序列化**：行格式实现直接内存访问而无需复制
- **缓冲区预分配**：最小化序列化期间的内存分配
- **紧凑编码**：变长编码以实现空间效率
- **小端序**：针对现代 CPU 架构优化
- **引用去重**：共享对象只序列化一次

运行基准测试：

```bash
cd benchmarks/rust_benchmark
cargo bench
```

## 📖 文档

- **[API 文档](https://docs.rs/fory)** - 完整的 API 参考
- **[协议规范](https://fory.apache.org/docs/specification/fory_xlang_serialization_spec)** - 序列化协议详情
- **[类型映射](https://fory.apache.org/docs/guide/xlang_type_mapping)** - 跨语言类型映射

## 🎯 使用场景

### 对象序列化

- 具有嵌套对象和引用的复杂数据结构
- 微服务中的跨语言通信
- 具有完全类型安全的通用序列化
- 兼容模式的 schema 演进
- 具有循环引用的图状数据结构

### 基于行的序列化

- 高吞吐量数据处理
- 需要快速字段访问的分析工作负载
- 内存受限环境
- 实时数据流应用
- 零拷贝场景

## 🏗️ 架构

Rust 实现由三个主要 crate 组成：

```
fory/                   # 高级 API
├── src/lib.rs         # 公共 API 导出

fory-core/             # 核心序列化引擎
├── src/
│   ├── fory.rs       # 主序列化入口
│   ├── buffer.rs     # 二进制缓冲区管理
│   ├── serializer/   # 特定类型的序列化器
│   ├── resolver/     # 类型解析和元数据
│   ├── meta/         # Meta 字符串压缩
│   ├── row/          # 行格式实现
│   └── types.rs      # 类型定义

fory-derive/           # 过程宏
├── src/
│   ├── object/       # ForyObject 宏
│   └── fory_row.rs  # ForyRow 宏
```

## 🔄 序列化模式

Apache Fory™ 支持两种序列化模式：

### SchemaConsistent 模式（默认）

类型声明必须在对等端之间完全匹配：

```rust
let fory = Fory::default(); // 默认为 SchemaConsistent
```

### Compatible 模式

允许独立的 schema 演进：

```rust
let fory = Fory::default().compatible(true);
```

## ⚙️ 配置

### 最大动态对象嵌套深度

Apache Fory™ 在反序列化期间提供了针对深度嵌套动态对象导致的栈溢出的保护。默认情况下，trait 对象和容器的最大嵌套深度设置为 5 层。

**默认配置：**

```rust
let fory = Fory::default(); // max_dyn_depth = 5
```

**自定义深度限制：**

```rust
let fory = Fory::default().max_dyn_depth(10); // 允许最多 10 层
```

**何时调整：**

- **增加**：用于合法的深度嵌套数据结构
- **减少**：用于更严格的安全要求或浅层数据结构

**受保护的类型：**

- `Box<dyn Any>`、`Rc<dyn Any>`、`Arc<dyn Any>`
- `Box<dyn Trait>`、`Rc<dyn Trait>`、`Arc<dyn Trait>`（trait 对象）
- `RcWeak<T>`、`ArcWeak<T>`
- 集合类型（Vec、HashMap、HashSet）
- 兼容模式下的嵌套结构体类型

注意：静态数据类型（非动态类型）本质上是安全的，不受深度限制，因为它们的结构在编译时已知。

## 🧪 故障排除

- **类型注册表错误**：像 `TypeId ... not found in type_info registry` 这样的错误意味着该类型从未在当前的 `Fory` 实例中注册。确认每个可序列化的结构体或 trait 实现在序列化之前都调用了 `fory.register::<T>(type_id)`，并且在反序列化端重用相同的 ID。
- **快速错误查找**：优先使用 `fory_core::error::Error` 上的静态构造函数（`Error::type_mismatch`、`Error::invalid_data`、`Error::unknown` 等）而不是手动实例化变体。这使诊断保持一致，并使可选的 panic 功能正常工作。
- **错误时 Panic 以获取回溯**：在运行测试或二进制文件时，将 `FORY_PANIC_ON_ERROR=1`（或 `true`）与 `RUST_BACKTRACE=1` 一起切换，以在构造错误的确切位置 panic。之后重置该变量以避免中止面向用户的代码路径。
- **结构体字段跟踪**：在 `#[derive(ForyObject)]` 旁边添加 `#[fory_debug]` 属性，告诉宏为该类型发出钩子调用。一旦使用调试钩子编译，调用 `set_before_write_field_func`、`set_after_write_field_func`、`set_before_read_field_func` 或 `set_after_read_field_func`（来自 `fory-core/src/serializer/struct_.rs`）来插入自定义回调，并在需要恢复默认值时使用 `reset_struct_debug_hooks()`。
- **轻量级日志**：在没有自定义钩子的情况下，启用 `ENABLE_FORY_DEBUG_OUTPUT=1` 来打印由默认钩子函数发出的字段级读/写事件。这在调查对齐或游标不匹配时特别有用。
- **测试时的规范**：一些集成测试期望 `FORY_PANIC_ON_ERROR` 保持未设置。仅在集中调试会话时导出它，并在隔离失败场景时优先使用 `cargo test --features tests -p tests --test <case>`。

## 🛠️ 开发

### 构建

```bash
cd rust
cargo build
```

### 测试

```bash
# 运行所有测试
cargo test --features tests

# 运行特定测试
cargo test -p tests --test test_complex_struct
```

### 代码质量

```bash
# 格式化代码
cargo fmt

# 检查格式
cargo fmt --check

# 运行 linter
cargo clippy --all-targets --all-features -- -D warnings
```

## 🗺️ 路线图

- [x] 基于 rust macro 的静态代码生成
- [x] 行格式序列化
- [x] 跨语言对象图序列化
- [x] 共享和循环引用追踪
- [x] 弱指针支持
- [x] 具有多态性的 trait 对象序列化
- [x] 兼容模式下的 schema 演进
- [x] 字符串编码的 SIMD 优化
- [ ] 共享和循环引用追踪的跨语言支持
- [ ] Trait 对象的跨语言支持
- [ ] 性能优化
- [ ] 更全面的基准测试

## 📄 许可证

根据 Apache License 2.0 授权。详情请参见 [LICENSE](https://github.com/apache/fory/blob/main/LICENSE)。

## 🤝 贡献

我们欢迎贡献！详情请参见我们的[贡献指南](https://github.com/apache/fory/blob/main/CONTRIBUTING.md)。

## 📞 支持

- **文档**：[docs.rs/fory](https://docs.rs/fory)
- **问题**：[GitHub Issues](https://github.com/apache/fory/issues)
- **讨论**：[GitHub Discussions](https://github.com/apache/fory/discussions)
- **Slack**：[Apache Fory Slack](https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A)

---

**Apache Fory™** - 极速的多语言序列化框架。
