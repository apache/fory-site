---
title: 多态序列化
sidebar_position: 5
id: polymorphism
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

Apache Fory™ 通过智能指针（`std::shared_ptr` 与 `std::unique_ptr`）支持多态序列化，为继承体系提供动态分派与类型灵活性。

## 支持的多态类型

- `std::shared_ptr<Base>`：共享所有权，支持多态分派
- `std::unique_ptr<Base>`：独占所有权，支持多态分派
- 集合类型：`std::vector<std::shared_ptr<Base>>`、`std::map<K, std::unique_ptr<Base>>`
- 可选类型：`std::optional<std::shared_ptr<Base>>`

## 基础多态序列化

```cpp
#include "fory/serialization/fory.h"

using namespace fory::serialization;

// 定义带虚函数的基类
struct Animal {
  virtual ~Animal() = default;
  virtual std::string speak() const = 0;
  int32_t age = 0;
};
FORY_STRUCT(Animal, age);

// 定义派生类
struct Dog : Animal {
  std::string speak() const override { return "Woof!"; }
  std::string breed;
};
FORY_STRUCT(Dog, age, breed);

struct Cat : Animal {
  std::string speak() const override { return "Meow!"; }
  std::string color;
};
FORY_STRUCT(Cat, age, color);

// 含多态字段的结构体
struct Zoo {
  std::shared_ptr<Animal> star_animal;
};
FORY_STRUCT(Zoo, star_animal);

int main() {
  auto fory = Fory::builder().track_ref(true).build();

  // 给所有类型注册唯一 type ID
  fory.register_struct<Zoo>(100);
  fory.register_struct<Dog>(101);
  fory.register_struct<Cat>(102);

  Zoo zoo;
  zoo.star_animal = std::make_shared<Dog>();
  zoo.star_animal->age = 3;
  static_cast<Dog*>(zoo.star_animal.get())->breed = "Labrador";

  auto bytes_result = fory.serialize(zoo);
  assert(bytes_result.ok());

  auto decoded_result = fory.deserialize<Zoo>(bytes_result.value());
  assert(decoded_result.ok());

  auto decoded = std::move(decoded_result).value();
  assert(decoded.star_animal->speak() == "Woof!");
  assert(decoded.star_animal->age == 3);

  auto* dog_ptr = dynamic_cast<Dog*>(decoded.star_animal.get());
  assert(dog_ptr != nullptr);
  assert(dog_ptr->breed == "Labrador");
}
```

## 为多态注册类型

多态序列化需要为所有派生类型注册唯一 type ID：

```cpp
fory.register_struct<Derived1>(100);
fory.register_struct<Derived2>(101);
```

推荐使用 type ID 的原因：

- 二进制表示更紧凑
- 类型查找和分派更快
- 与非多态类型的注册方式保持一致

## 自动检测多态

Fory 会通过 `std::is_polymorphic<T>` 自动识别多态类型：

```cpp
struct Base {
  virtual ~Base() = default;  // 有虚析构，因此是多态类型
  int32_t value = 0;
};

struct NonPolymorphic {
  int32_t value = 0;  // 没有虚函数，不是多态类型
};

struct Container1 {
  std::shared_ptr<Base> ptr;  // 自动识别为多态，写类型信息
};

struct Container2 {
  std::shared_ptr<NonPolymorphic> ptr;  // 非多态，不写类型信息
};
```

## 控制动态分派

可以通过 `fory::dynamic<V>` 覆盖自动检测结果：

```cpp
struct Animal {
  virtual ~Animal() = default;
  virtual std::string speak() const = 0;
};

struct Pet {
  // 自动检测：Animal 有虚函数，因此会写类型信息
  std::shared_ptr<Animal> animal1;

  // 强制动态：显式写类型信息
  fory::field<std::shared_ptr<Animal>, 0, fory::dynamic<true>> animal2;

  // 强制静态：不写类型信息
  fory::field<std::shared_ptr<Animal>, 1, fory::dynamic<false>> animal3;
};
FORY_STRUCT(Pet, animal1, animal2, animal3);
```

适合使用 `fory::dynamic<false>` 的场景：

- 你确定运行时类型总是与声明类型一致
- 性能很关键，不需要子类型支持
- 基类只是形式上的抽象，但实际数据是单态的

### 不使用包装器的字段配置

如果不想改字段类型，可以用 `FORY_FIELD_CONFIG`：

```cpp
struct Zoo {
  std::shared_ptr<Animal> star;
  std::shared_ptr<Animal> backup;
  std::shared_ptr<Animal> mascot;
};
FORY_STRUCT(Zoo, star, backup, mascot);

FORY_FIELD_CONFIG(Zoo,
    (star, fory::F(0)),
    (backup, fory::F(1).nullable()),
    (mascot, fory::F(2).dynamic(false))
);
```

`nullable`、`ref` 等字段级选项可参考 [字段配置](field-configuration.md)。

## `std::unique_ptr` 的多态

`std::unique_ptr` 在多态场景下的行为与 `std::shared_ptr` 一致：

```cpp
struct Container {
  std::unique_ptr<Animal> pet;
};
FORY_STRUCT(Container, pet);

auto fory = Fory::builder().track_ref(true).build();
fory.register_struct<Container>(200);
fory.register_struct<Dog>(201);

Container container;
container.pet = std::make_unique<Dog>();
static_cast<Dog*>(container.pet.get())->breed = "Beagle";

auto bytes = fory.serialize(container).value();
auto decoded = fory.deserialize<Container>(bytes).value();

auto* dog = dynamic_cast<Dog*>(decoded.pet.get());
assert(dog != nullptr);
assert(dog->breed == "Beagle");
```

## 多态对象集合

```cpp
#include <vector>
#include <map>

struct AnimalShelter {
  std::vector<std::shared_ptr<Animal>> animals;
  std::map<std::string, std::unique_ptr<Animal>> registry;
};
FORY_STRUCT(AnimalShelter, animals, registry);

auto fory = Fory::builder().track_ref(true).build();
fory.register_struct<AnimalShelter>(100);
fory.register_struct<Dog>(101);
fory.register_struct<Cat>(102);

AnimalShelter shelter;
shelter.animals.push_back(std::make_shared<Dog>());
shelter.animals.push_back(std::make_shared<Cat>());
shelter.registry["pet1"] = std::make_unique<Dog>();

auto bytes = fory.serialize(shelter).value();
auto decoded = fory.deserialize<AnimalShelter>(bytes).value();

assert(dynamic_cast<Dog*>(decoded.animals[0].get()) != nullptr);
assert(dynamic_cast<Cat*>(decoded.animals[1].get()) != nullptr);
assert(dynamic_cast<Dog*>(decoded.registry["pet1"].get()) != nullptr);
```

## 引用跟踪

`std::shared_ptr` 在多态场景下的引用跟踪行为与普通类型一致。更多细节可参考 [支持类型](supported-types.md)。

## 嵌套多态深度限制

为防止极深多态嵌套导致栈溢出，Fory 对动态嵌套深度做了限制：

```cpp
struct Container {
  virtual ~Container() = default;
  int32_t value = 0;
  std::shared_ptr<Container> nested;
};
FORY_STRUCT(Container, value, nested);

// 默认 max_dyn_depth 为 5
auto fory1 = Fory::builder().build();
assert(fory1.config().max_dyn_depth == 5);

// 增大限制以支持更深层级
auto fory2 = Fory::builder().max_dyn_depth(10).build();
fory2.register_struct<Container>(1);

auto level3 = std::make_shared<Container>();
level3->value = 3;

auto level2 = std::make_shared<Container>();
level2->value = 2;
level2->nested = level3;

auto level1 = std::make_shared<Container>();
level1->value = 1;
level1->nested = level2;

auto bytes = fory2.serialize(level1).value();
auto decoded = fory2.deserialize<std::shared_ptr<Container>>(bytes).value();
```

深度超限示例：

```cpp
auto fory_shallow = Fory::builder().max_dyn_depth(2).build();
fory_shallow.register_struct<Container>(1);

auto result = fory_shallow.deserialize<std::shared_ptr<Container>>(bytes);
assert(!result.ok());  // 会因 depth exceeded 失败
```

何时调整：

- **增大 `max_dyn_depth`**：数据确实存在深层合法嵌套
- **减小 `max_dyn_depth`**：更严格的安全要求，或数据结构本身较浅

## 多态字段的可空性

默认情况下，`std::shared_ptr<T>` 和 `std::unique_ptr<T>` 在 Schema 中都被视为**不可空**。如果要允许 `nullptr`，需使用 `fory::field<>` 或 `FORY_FIELD_TAGS`，并显式开启 `fory::nullable`。

```cpp
struct Pet {
  // 默认不可空
  std::shared_ptr<Animal> primary;

  // 显式声明为可空
  fory::field<std::shared_ptr<Animal>, 0, fory::nullable> optional;
};
FORY_STRUCT(Pet, primary, optional);
```

更多细节见 [字段配置](field-configuration.md)。

## 与其他特性的组合

### 多态 + 引用跟踪

```cpp
struct GraphNode {
  virtual ~GraphNode() = default;
  int32_t id = 0;
  std::vector<std::shared_ptr<GraphNode>> neighbors;
};
FORY_STRUCT(GraphNode, id, neighbors);

struct WeightedNode : GraphNode {
  double weight = 0.0;
};
FORY_STRUCT(WeightedNode, id, neighbors, weight);

auto fory = Fory::builder().track_ref(true).build();
fory.register_struct<GraphNode>(100);
fory.register_struct<WeightedNode>(101);

auto node1 = std::make_shared<WeightedNode>();
node1->id = 1;

auto node2 = std::make_shared<WeightedNode>();
node2->id = 2;

node1->neighbors.push_back(node2);
node2->neighbors.push_back(node1);  // 构成环

auto bytes = fory.serialize(node1).value();
auto decoded = fory.deserialize<std::shared_ptr<GraphNode>>(bytes).value();
// 循环引用会被正确处理
```

### 多态 + Schema 演进

多态类型同样可以结合兼容模式：

```cpp
auto fory = Fory::builder()
    .compatible(true)
    .track_ref(true)
    .build();
```

## 最佳实践

1. 为多态类型使用 type ID 注册。
2. 多态对象存在共享或环时启用引用跟踪。
3. 基类必须提供虚析构函数。
4. 在序列化和反序列化前注册所有具体类型。
5. 反序列化后使用 `dynamic_cast` 做向下转型。
6. 根据数据结构深度调整 `max_dyn_depth`。
7. 对可选多态字段使用 `fory::nullable`。

## 错误处理

```cpp
auto bytes_result = fory.serialize(obj);
if (!bytes_result.ok()) {
  std::cerr << "Serialization failed: "
            << bytes_result.error().to_string() << std::endl;
  return;
}

auto decoded_result = fory.deserialize<MyType>(bytes_result.value());
if (!decoded_result.ok()) {
  std::cerr << "Deserialization failed: "
            << decoded_result.error().to_string() << std::endl;
  return;
}
```

常见错误：

- **类型未注册**：为所有具体类型分配唯一 ID 并在使用前注册
- **深度超限**：为深层嵌套结构提高 `max_dyn_depth`
- **Type ID 冲突**：确保每个已注册类型都使用不同 ID

## 性能考量

多态序列化的额外成本主要包括：

- 每个多态对象都要写入类型元信息（通常约 16-32 字节）
- 反序列化时需要动态类型解析
- 运行时分派会引入虚函数调用

优化建议：

1. 运行时类型固定时使用 `fory::dynamic<false>`。
2. 尽量减少嵌套深度，降低元信息与递归成本。
3. 如果可以，把多态对象集中放在集合中，而不是大量分散字段里。
4. 如果不需要真正的多态，可考虑 `std::variant<Dog, Cat>` 等替代方案。

## 相关主题

- [类型注册](type-registration.md)
- [字段配置](field-configuration.md)
- [支持类型](supported-types.md)
- [配置](configuration.md)
- [基础序列化](basic-serialization.md)
