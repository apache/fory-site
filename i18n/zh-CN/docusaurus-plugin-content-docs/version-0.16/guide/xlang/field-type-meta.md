---
title: 字段类型元信息
sidebar_position: 46
id: field_type_meta
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

字段类型元信息用于控制结构体字段在序列化时是否写入类型信息。这对支持多态很关键，因为运行时真实类型可能与声明类型不同。

## 概述

当序列化结构体字段时，Fory 需要判断是否写入类型元信息：

- **静态类型**：直接使用声明类型对应的序列化器，不写类型信息
- **动态类型**：额外写入类型信息，以支持运行时子类型

## 何时需要类型元信息

以下场景需要写入类型元信息：

1. **接口 / 抽象字段**：声明类型是抽象的，必须记录实际具体类型
2. **多态字段**：运行时对象可能是声明类型的子类
3. **跨语言兼容**：接收方需要知道具体类型才能正确反序列化

以下场景通常不需要写类型元信息：

1. **final / 具体类型**：声明类型不可再派生
2. **基础类型**：编译期已知，类型固定
3. **性能优化**：你确定运行时类型总是与声明类型一致

## 各语言配置方式

### Java

Java 需要显式配置，因为具体类如果没有 `final`，理论上都可能被继承。

使用 `@ForyField` 注解中的 `dynamic` 参数：

```java
import org.apache.fory.annotation.ForyField;
import org.apache.fory.annotation.ForyField.Dynamic;

public class Container {
    // AUTO（默认）：接口 / 抽象类型写类型信息，具体类型不写
    @ForyField(id = 0)
    private Shape shape;

    // FALSE：永远不写类型信息，直接按声明类型处理
    @ForyField(id = 1, dynamic = Dynamic.FALSE)
    private Circle circle;

    // TRUE：总是写类型信息，支持运行时子类型
    @ForyField(id = 2, dynamic = Dynamic.TRUE)
    private Shape concreteShape;
}
```

`dynamic` 的取值语义：

| 值 | 行为 |
| --- | --- |
| `AUTO` | 接口 / 抽象类型自动视为动态，具体类型默认静态 |
| `FALSE` | 永不写类型信息，始终使用声明类型序列化器 |
| `TRUE` | 总是写类型信息，以支持运行时子类型 |

适用场景：

- `AUTO`：默认选择，适用于大多数情况
- `FALSE`：明确知道真实类型固定，希望减少开销
- `TRUE`：字段声明为具体类型，但运行时仍可能承载子类

### C++

C++ 使用 `fory::dynamic<V>` 模板标签，或 builder 风格的 `.dynamic(bool)` 方法：

**使用 `fory::field<>` 模板：**

```cpp
#include "fory/serialization/fory.h"

// 带纯虚函数的抽象基类
struct Animal {
    virtual ~Animal() = default;
    virtual std::string speak() const = 0;
};

struct Zoo {
    // 自动检测：Animal 是多态类型，因此会写类型信息
    fory::field<std::shared_ptr<Animal>, 0, fory::nullable> animal;

    // 强制关闭动态类型：即使 Animal 可多态，也不写类型信息
    fory::field<std::shared_ptr<Animal>, 1, fory::nullable, fory::dynamic<false>> fixed_animal;

    // 强制开启动态类型：即使声明类型本身不是多态类型，也写类型信息
    fory::field<std::shared_ptr<Data>, 2, fory::dynamic<true>> polymorphic_data;
};
FORY_STRUCT(Zoo, animal, fixed_animal, polymorphic_data);
```

**使用 `FORY_FIELD_CONFIG` 宏：**

```cpp
struct Zoo {
    std::shared_ptr<Animal> animal;
    std::shared_ptr<Animal> fixed_animal;
    std::shared_ptr<Data> polymorphic_data;
};

FORY_STRUCT(Zoo, animal, fixed_animal, polymorphic_data);

FORY_FIELD_CONFIG(Zoo,
    (animal, fory::F(0).nullable()),
    (fixed_animal, fory::F(1).nullable().dynamic(false)),
    (polymorphic_data, fory::F(2).dynamic(true))
);
```

默认行为：Fory 会通过 `std::is_polymorphic<T>` 自动识别多态类型。带纯虚函数的类型默认就会被视为动态类型。

### Go 与 Rust

Go 和 Rust **不需要**额外显式配置动态类型，因为它们的类型系统已经能够表达多态字段：

- **Go**：接口类型天然就是动态分派
- **Rust**：trait object（`dyn Trait`）在类型系统中是显式的

```go
// Go：接口字段会自动写入类型信息
type Container struct {
    Shape  Shape
    Circle Circle
}
```

```rust
// Rust：trait object 会自动写入类型信息
struct Container {
    shape: Box<dyn Shape>,
    circle: Circle,
}
```

### Python

Python 使用 `pyfory.field()` 的 `dynamic` 参数：

```python
from dataclasses import dataclass
from abc import ABC, abstractmethod
import pyfory

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

@dataclass
class Circle(Shape):
    radius: float = 0.0

    def area(self) -> float:
        return 3.14159 * self.radius * self.radius

@dataclass
class Container:
    # 抽象类型：dynamic 恒为 True
    shape: Shape = pyfory.field(id=0)

    # 具体类型，显式要求写入类型信息
    circle: Circle = pyfory.field(id=1, dynamic=True)

    # 具体类型，显式禁止写入类型信息
    fixed_circle: Circle = pyfory.field(id=2, dynamic=False)
```

Python 端默认行为：

| 模式 | 抽象类 | 具体对象类型 | 数值 / 字符串 / 时间类型 |
| --- | --- | --- | --- |
| Native mode | `True` | `True` | `False` |
| Xlang mode | `True` | `False` | `False` |

- 抽象类总是 `dynamic=True`
- Native mode 下，大多数对象类型默认写类型信息
- Xlang mode 下，具体类型默认不写类型信息

## 默认行为

| 语言 | 接口 / 抽象类型 | 具体类型 |
| --- | --- | --- |
| Java | 动态（写类型） | 静态（不写类型） |
| C++ | 动态（虚函数） | 静态 |
| Go | 动态（接口） | 静态（结构体） |
| Rust | 动态（`dyn Trait`） | 静态 |
| Python | 动态（对象） | 动态 / 依模式而定 |

## 性能考量

写入类型元信息会带来额外开销：

- **空间**：序列化结果中会多出类型描述字节
- **时间**：序列化和反序列化都需要做类型解析

在以下场景可考虑使用 `dynamic = FALSE`（Java）或 `dynamic(false)`（C++）：

- 你非常确定运行时类型与声明类型完全一致
- 性能很关键，而且不需要子类型支持
- 字段类型事实上已经是 final / 不再派生

## 跨语言兼容性

做跨语言序列化时，建议遵循以下原则：

1. 各语言使用一致的类型注册 ID。
2. 若不确定接收端是否需要运行时类型信息，优先显式开启动态类型。
3. 在接口文档中明确说明哪些字段可能承载子类型。

## 示例：多态容器

### Java

```java
public interface Animal {
    String speak();
}

public class Dog implements Animal {
    private String name;

    @Override
    public String speak() { return "Woof!"; }
}

public class Cat implements Animal {
    private String name;

    @Override
    public String speak() { return "Meow!"; }
}

public class Zoo {
    // Animal 是接口，因此会写入类型信息
    @ForyField(id = 0)
    private Animal animal;

    // 对具体类型强制写入类型信息
    @ForyField(id = 1, dynamic = Dynamic.TRUE)
    private Dog maybeMixedBreed;
}
```

### C++

```cpp
class Animal {
public:
    virtual std::string speak() const = 0;
    virtual ~Animal() = default;
};

class Dog : public Animal {
public:
    std::string name;
    std::string speak() const override { return "Woof!"; }
};

struct Zoo {
    std::shared_ptr<Animal> animal;
    std::shared_ptr<Dog> maybe_mixed_breed;
};

FORY_STRUCT(Zoo, animal, maybe_mixed_breed);

FORY_FIELD_CONFIG(Zoo,
    (animal, fory::F(0).nullable()),
    (maybe_mixed_breed, fory::F(1).dynamic(true))
);
```

## 相关主题

- [Field Nullability](field-nullability.md) - 控制字段 null 处理
- [Field Reference Tracking](field-reference-tracking.md) - 管理共享引用与循环引用
- [Type Mapping](../../specification/xlang_type_mapping.md) - 跨语言类型兼容性
