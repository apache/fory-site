---
title: 生成代码
sidebar_position: 5
id: generated_code
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

本文档说明各目标语言的代码生成结果与结构。

Fory IDL 生成的类型遵循宿主语言习惯，可直接作为领域对象使用。生成代码同时包含 `to/from bytes` 辅助方法和类型注册辅助逻辑。

## 参考 Schema

下面示例基于两个真实 schema：

1. `addressbook.fdl`（显式类型 ID）
2. `auto_id.fdl`（未显式声明类型 ID）

### `addressbook.fdl`（节选）

```protobuf
package addressbook;

option go_package = "github.com/myorg/myrepo/gen/addressbook;addressbook";

message Person [id=100] {
    string name = 1;
    int32 id = 2;

    enum PhoneType [id=101] {
        PHONE_TYPE_MOBILE = 0;
        PHONE_TYPE_HOME = 1;
        PHONE_TYPE_WORK = 2;
    }

    message PhoneNumber [id=102] {
        string number = 1;
        PhoneType phone_type = 2;
    }

    list<PhoneNumber> phones = 7;
    Animal pet = 8;
}

message Dog [id=104] {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat [id=105] {
    string name = 1;
    int32 lives = 2;
}

union Animal [id=106] {
    Dog dog = 1;
    Cat cat = 2;
}

message AddressBook [id=103] {
    list<Person> people = 1;
    map<string, Person> people_by_name = 2;
}
```

### `auto_id.fdl`（节选）

```protobuf
package auto_id;

enum Status {
    UNKNOWN = 0;
    OK = 1;
}

message Envelope {
    string id = 1;

    message Payload {
        int32 value = 1;
    }

    union Detail {
        Payload payload = 1;
        string note = 2;
    }

    Payload payload = 2;
    Detail detail = 3;
    Status status = 4;
}

union Wrapper {
    Envelope envelope = 1;
    string raw = 2;
}
```

## Java

### 输出布局

对于 `package addressbook`，Java 输出通常位于：

- `<java_out>/addressbook/`
- 类型文件：`AddressBook.java`、`Person.java`、`Dog.java`、`Cat.java`、`Animal.java`
- 注册辅助类：`AddressbookForyRegistration.java`

### 类型生成

message 会生成带 `@ForyField`、默认构造器、getter/setter 以及字节辅助方法的 Java 类：

```java
public class Person {
    public static enum PhoneType {
        MOBILE,
        HOME,
        WORK;
    }

    public static class PhoneNumber {
        @ForyField(id = 1)
        private String number;

        @ForyField(id = 2)
        private PhoneType phoneType;

        public byte[] toBytes() { ... }
        public static PhoneNumber fromBytes(byte[] bytes) { ... }
    }

    @ForyField(id = 1)
    private String name;

    @ForyField(id = 8)
    private Animal pet;

    public byte[] toBytes() { ... }
    public static Person fromBytes(byte[] bytes) { ... }
}
```

union 会生成继承 `org.apache.fory.type.union.Union` 的类：

```java
public final class Animal extends Union {
    public enum AnimalCase {
        DOG(1),
        CAT(2);
        public final int id;
        AnimalCase(int id) { this.id = id; }
    }

    public static Animal ofDog(Dog v) { ... }
    public AnimalCase getAnimalCase() { ... }
    public int getAnimalCaseId() { ... }

    public boolean hasDog() { ... }
    public Dog getDog() { ... }
    public void setDog(Dog v) { ... }
}
```

### 注册

生成的注册辅助方法：

```java
public static void register(Fory fory) {
    org.apache.fory.resolver.TypeResolver resolver = fory.getTypeResolver();
    resolver.registerUnion(Animal.class, 106L, new org.apache.fory.serializer.UnionSerializer(fory, Animal.class));
    resolver.register(Person.class, 100L);
    resolver.register(Person.PhoneType.class, 101L);
    resolver.register(Person.PhoneNumber.class, 102L);
    resolver.register(Dog.class, 104L);
    resolver.register(Cat.class, 105L);
    resolver.register(AddressBook.class, 103L);
}
```

对于未显式 `[id=...]` 的 schema，注册代码会使用计算得到的数值 ID（例如 `auto_id.fdl`）：

```java
resolver.register(Status.class, 1124725126L);
resolver.registerUnion(Wrapper.class, 1471345060L, new org.apache.fory.serializer.UnionSerializer(fory, Wrapper.class));
resolver.register(Envelope.class, 3022445236L);
resolver.registerUnion(Envelope.Detail.class, 1609214087L, new org.apache.fory.serializer.UnionSerializer(fory, Envelope.Detail.class));
resolver.register(Envelope.Payload.class, 2862577837L);
```

若设置 `option enable_auto_type_id = false;`，则按命名空间与类型名注册：

```java
resolver.register(Config.class, "myapp.models", "Config");
resolver.registerUnion(
    Holder.class,
    "myapp.models",
    "Holder",
    new org.apache.fory.serializer.UnionSerializer(fory, Holder.class));
```

### 使用示例

```java
Person person = new Person();
person.setName("Alice");
person.setPet(Animal.ofDog(new Dog()));

byte[] data = person.toBytes();
Person restored = Person.fromBytes(data);
```

## Python

### 输出布局

Python 每个 schema 文件生成一个模块，例如：

- `<python_out>/addressbook.py`

### 类型生成

union 生成 case 枚举与 `Union` 子类，并提供类型化辅助方法：

```python
class AnimalCase(Enum):
    DOG = 1
    CAT = 2

class Animal(Union):
    @classmethod
    def dog(cls, v: Dog) -> "Animal": ...

    def case(self) -> AnimalCase: ...
    def case_id(self) -> int: ...

    def is_dog(self) -> bool: ...
    def dog_value(self) -> Dog: ...
    def set_dog(self, v: Dog) -> None: ...
```

message 生成 `@pyfory.dataclass` 类型，嵌套类型保持嵌套：

```python
@pyfory.dataclass
class Person:
    class PhoneType(IntEnum):
        MOBILE = 0
        HOME = 1
        WORK = 2

    @pyfory.dataclass
    class PhoneNumber:
        number: str = pyfory.field(id=1, default="")
        phone_type: Person.PhoneType = pyfory.field(id=2, default=None)

    name: str = pyfory.field(id=1, default="")
    phones: List[Person.PhoneNumber] = pyfory.field(id=7, default_factory=list)
    pet: Animal = pyfory.field(id=8, default=None)

    def to_bytes(self) -> bytes: ...
    @classmethod
    def from_bytes(cls, data: bytes) -> "Person": ...
```

### 注册

生成注册函数：

```python
def register_addressbook_types(fory: pyfory.Fory):
    fory.register_union(Animal, type_id=106, serializer=AnimalSerializer(fory))
    fory.register_type(Person, type_id=100)
    fory.register_type(Person.PhoneType, type_id=101)
    fory.register_type(Person.PhoneNumber, type_id=102)
    fory.register_type(Dog, type_id=104)
    fory.register_type(Cat, type_id=105)
    fory.register_type(AddressBook, type_id=103)
```

未显式 `[id=...]` 时，注册代码使用计算得到的数值 ID：

```python
fory.register_type(Status, type_id=1124725126)
fory.register_union(Wrapper, type_id=1471345060, serializer=WrapperSerializer(fory))
fory.register_type(Envelope, type_id=3022445236)
fory.register_union(Envelope.Detail, type_id=1609214087, serializer=Envelope.DetailSerializer(fory))
fory.register_type(Envelope.Payload, type_id=2862577837)
```

若设置 `option enable_auto_type_id = false;`：

```python
fory.register_type(Config, namespace="myapp.models", typename="Config")
fory.register_union(
    Holder,
    namespace="myapp.models",
    typename="Holder",
    serializer=HolderSerializer(fory),
)
```

### 使用示例

```python
person = Person(name="Alice", pet=Animal.dog(Dog(name="Rex", bark_volume=10)))

data = person.to_bytes()
restored = Person.from_bytes(data)
```

## Rust

### 输出布局

Rust 每个 schema 生成一个模块文件，例如：

- `<rust_out>/addressbook.rs`

### 类型生成

union 映射为 Rust enum，并用 `#[fory(id = ...)]` 声明 case ID：

```rust
#[derive(ForyObject, Debug, Clone, PartialEq)]
pub enum Animal {
    #[fory(id = 1)]
    Dog(Dog),
    #[fory(id = 2)]
    Cat(Cat),
}
```

嵌套类型生成嵌套 module：

```rust
pub mod person {
    #[derive(ForyObject, Debug, Clone, PartialEq, Default)]
    #[repr(i32)]
    pub enum PhoneType {
        #[default]
        Mobile = 0,
        Home = 1,
        Work = 2,
    }

    #[derive(ForyObject, Debug, Clone, PartialEq, Default)]
    pub struct PhoneNumber {
        #[fory(id = 1)]
        pub number: String,
        #[fory(id = 2)]
        pub phone_type: PhoneType,
    }
}
```

message 会 `derive(ForyObject)` 并生成 `to_bytes`/`from_bytes`：

```rust
#[derive(ForyObject, Debug, Clone, PartialEq, Default)]
pub struct Person {
    #[fory(id = 1)]
    pub name: String,
    #[fory(id = 7)]
    pub phones: Vec<person::PhoneNumber>,
    #[fory(id = 8, type_id = "union")]
    pub pet: Animal,
}
```

### 注册

生成注册函数：

```rust
pub fn register_types(fory: &mut Fory) -> Result<(), fory::Error> {
    fory.register_union::<Animal>(106)?;
    fory.register::<person::PhoneType>(101)?;
    fory.register::<person::PhoneNumber>(102)?;
    fory.register::<Person>(100)?;
    fory.register::<Dog>(104)?;
    fory.register::<Cat>(105)?;
    fory.register::<AddressBook>(103)?;
    Ok(())
}
```

未显式 `[id=...]` 时，注册代码使用计算得到的数值 ID：

```rust
fory.register::<Status>(1124725126)?;
fory.register_union::<Wrapper>(1471345060)?;
fory.register::<Envelope>(3022445236)?;
fory.register_union::<envelope::Detail>(1609214087)?;
fory.register::<envelope::Payload>(2862577837)?;
```

若设置 `option enable_auto_type_id = false;`：

```rust
fory.register_by_namespace::<Config>("myapp.models", "Config")?;
fory.register_union_by_namespace::<Holder>("myapp.models", "Holder")?;
```

### 使用示例

```rust
let person = Person {
    name: "Alice".into(),
    pet: Animal::Dog(Dog::default()),
    ..Default::default()
};

let bytes = person.to_bytes()?;
let restored = Person::from_bytes(&bytes)?;
```

## C++

### 输出布局

C++ 每个 schema 文件生成一个头文件，例如：

- `<cpp_out>/addressbook.h`

### 类型生成

message 会生成 `final` 类，并包含类型化访问器与字节辅助方法：

```cpp
class Person final {
 public:
  class PhoneNumber final {
   public:
    const std::string& number() const;
    std::string* mutable_number();
    template <class Arg, class... Args>
    void set_number(Arg&& arg, Args&&... args);

    fory::Result<std::vector<uint8_t>, fory::Error> to_bytes() const;
    static fory::Result<PhoneNumber, fory::Error> from_bytes(const std::vector<uint8_t>& data);
  };

  const std::string& name() const;
  std::string* mutable_name();
  template <class Arg, class... Args>
  void set_name(Arg&& arg, Args&&... args);

  const Animal& pet() const;
  Animal* mutable_pet();
};
```

可选 message 字段会生成 `has_xxx`、`mutable_xxx`、`clear_xxx` API：

```cpp
class Envelope final {
 public:
  bool has_payload() const { return payload_ != nullptr; }
  const Envelope::Payload& payload() const { return *payload_; }
  Envelope::Payload* mutable_payload() {
    if (!payload_) {
      payload_ = std::make_unique<Envelope::Payload>();
    }
    return payload_.get();
  }
  void clear_payload() { payload_.reset(); }

 private:
  std::unique_ptr<Envelope::Payload> payload_;
};
```

union 会生成基于 `std::variant` 的封装：

```cpp
class Animal final {
 public:
  enum class AnimalCase : uint32_t {
    DOG = 1,
    CAT = 2,
  };

  static Animal dog(Dog v);
  static Animal cat(Cat v);

  AnimalCase animal_case() const noexcept;
  uint32_t animal_case_id() const noexcept;

  bool is_dog() const noexcept;
  const Dog* as_dog() const noexcept;
  Dog* as_dog() noexcept;
  const Dog& dog() const;
  Dog& dog();

  template <class Visitor>
  decltype(auto) visit(Visitor&& vis) const;

 private:
  std::variant<Dog, Cat> value_;
};
```

生成头文件还会包含 `FORY_UNION`、`FORY_FIELD_CONFIG`、`FORY_ENUM`、`FORY_STRUCT` 等序列化元信息宏。

### 注册

生成注册函数：

```cpp
inline void register_types(fory::serialization::BaseFory& fory) {
    fory.register_union<Animal>(106);
    fory.register_enum<Person::PhoneType>(101);
    fory.register_struct<Person::PhoneNumber>(102);
    fory.register_struct<Person>(100);
    fory.register_struct<Dog>(104);
    fory.register_struct<Cat>(105);
    fory.register_struct<AddressBook>(103);
}
```

未显式 `[id=...]` 时，注册代码使用计算得到的数值 ID：

```cpp
fory.register_enum<Status>(1124725126);
fory.register_union<Wrapper>(1471345060);
fory.register_struct<Envelope>(3022445236);
fory.register_union<Envelope::Detail>(1609214087);
fory.register_struct<Envelope::Payload>(2862577837);
```

若设置 `option enable_auto_type_id = false;`：

```cpp
fory.register_struct<Config>("myapp.models", "Config");
fory.register_union<Holder>("myapp.models", "Holder");
```

### 使用示例

```cpp
addressbook::Person person;
person.set_name("Alice");
*person.mutable_pet() = addressbook::Animal::dog(addressbook::Dog{});

auto bytes = person.to_bytes();
auto restored = addressbook::Person::from_bytes(bytes.value());
```

## Go

### 输出布局

Go 输出路径受 schema 选项与 `--go_out` 共同影响。

对于 `addressbook.fdl`，若配置了 `go_package`，生成结果会遵循对应 import path/package（位于 `--go_out` 根目录下）。

若未配置 `go_package`，则使用 `--go_out` 指定目录，并按 package 规则生成文件名与包名。

### 类型生成

嵌套类型默认使用下划线命名（`Person_PhoneType`、`Person_PhoneNumber`）：

```go
type Person_PhoneType int32

const (
    Person_PhoneTypeMobile Person_PhoneType = 0
    Person_PhoneTypeHome   Person_PhoneType = 1
    Person_PhoneTypeWork   Person_PhoneType = 2
)

type Person_PhoneNumber struct {
    Number    string           `fory:"id=1"`
    PhoneType Person_PhoneType `fory:"id=2"`
}
```

message 会生成带 `fory` tag 的 struct 与字节辅助方法：

```go
type Person struct {
    Name   string               `fory:"id=1"`
    Id     int32                `fory:"id=2,compress=true"`
    Phones []Person_PhoneNumber `fory:"id=7"`
    Pet    Animal               `fory:"id=8"`
}

func (m *Person) ToBytes() ([]byte, error) { ... }
func (m *Person) FromBytes(data []byte) error { ... }
```

union 会生成 case struct，并提供构造器/访问器/visitor API：

```go
type AnimalCase uint32

type Animal struct {
    case_ AnimalCase
    value any
}

func DogAnimal(v *Dog) Animal { ... }
func CatAnimal(v *Cat) Animal { ... }

func (u Animal) Case() AnimalCase { ... }
func (u Animal) AsDog() (*Dog, bool) { ... }
func (u Animal) Visit(visitor AnimalVisitor) error { ... }
```

### 注册

生成注册函数：

```go
func RegisterTypes(f *fory.Fory) error {
    if err := f.RegisterUnion(Animal{}, 106, fory.NewUnionSerializer(...)); err != nil {
        return err
    }
    if err := f.RegisterEnum(Person_PhoneType(0), 101); err != nil {
        return err
    }
    if err := f.RegisterStruct(Person_PhoneNumber{}, 102); err != nil {
        return err
    }
    if err := f.RegisterStruct(Person{}, 100); err != nil {
        return err
    }
    return nil
}
```

未显式 `[id=...]` 时，注册代码使用计算得到的数值 ID：

```go
if err := f.RegisterEnum(Status(0), 1124725126); err != nil { ... }
if err := f.RegisterUnion(Wrapper{}, 1471345060, fory.NewUnionSerializer(...)); err != nil { ... }
if err := f.RegisterStruct(Envelope{}, 3022445236); err != nil { ... }
if err := f.RegisterUnion(Envelope_Detail{}, 1609214087, fory.NewUnionSerializer(...)); err != nil { ... }
if err := f.RegisterStruct(Envelope_Payload{}, 2862577837); err != nil { ... }
```

若设置 `option enable_auto_type_id = false;`：

```go
if err := f.RegisterNamedStruct(Config{}, "myapp.models.Config"); err != nil { ... }
if err := f.RegisterNamedUnion(Holder{}, "myapp.models.Holder", fory.NewUnionSerializer(...)); err != nil { ... }
```

`go_nested_type_style` 可控制嵌套类型命名风格：

```protobuf
option go_nested_type_style = "camelcase";
```

### 使用示例

```go
person := &Person{
    Name: "Alice",
    Pet:  DogAnimal(&Dog{Name: "Rex"}),
}

data, err := person.ToBytes()
if err != nil {
    panic(err)
}
var restored Person
if err := restored.FromBytes(data); err != nil {
    panic(err)
}
```

## 跨语言说明

### 类型 ID 行为

- 显式 `[id=...]` 会直接用于生成注册代码。
- 未声明类型 ID 时，生成代码会使用计算得到的数值 ID（参见 `auto_id.*` 输出）。
- 若设置 `option enable_auto_type_id = false;`，则生成代码改为使用 namespace/type-name 注册 API，而非数值 ID。

### 嵌套类型形态

| 语言   | 嵌套类型形式                 |
| ------ | ---------------------------- |
| Java   | `Person.PhoneNumber`         |
| Python | `Person.PhoneNumber`         |
| Rust   | `person::PhoneNumber`        |
| C++    | `Person::PhoneNumber`        |
| Go     | `Person_PhoneNumber`（默认） |

### 字节辅助方法命名

| 语言   | 辅助方法名称              |
| ------ | ------------------------- |
| Java   | `toBytes` / `fromBytes`   |
| Python | `to_bytes` / `from_bytes` |
| Rust   | `to_bytes` / `from_bytes` |
| C++    | `to_bytes` / `from_bytes` |
| Go     | `ToBytes` / `FromBytes`   |
