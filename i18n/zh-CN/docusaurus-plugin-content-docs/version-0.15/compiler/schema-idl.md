---
title: Schema IDL 语法
sidebar_position: 2
id: syntax
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

本文档给出 Fory IDL 的语法与语义参考，覆盖文件结构、类型系统、字段规则、选项与类型注册策略。

编译器使用方式与构建集成请参见 [Compiler Guide](compiler-guide.md)。
protobuf/FlatBuffers 前端映射请参见 [Protocol Buffers IDL Support](protobuf-idl.md) 与 [FlatBuffers IDL Support](flatbuffers-idl.md)。

## 文件结构

一个 Fory IDL 文件通常包含：

1. 可选 `package` 声明
2. 可选文件级 `option`
3. 可选 `import` 语句
4. 类型定义（`enum`、`message`、`union`）

```protobuf
// Optional package declaration
package com.example.models;

// Optional file-level options
option java_package = "com.example.models";

// Import statements
import "common/types.fdl";

// Type definitions
enum Color [id=100] { ... }
message User [id=101] { ... }
message Order [id=102] { ... }
union Event [id=103] { ... }
```

## 注释

支持单行注释与块注释：

```protobuf
// This is a single-line comment

/*
 * This is a block comment
 * that spans multiple lines
 */

message Example {
    string name = 1;  // Inline comment
}
```

## Package 声明

`package` 定义文件中所有类型的命名空间。

```protobuf
package com.example.models;
```

也可以配置 alias（用于自动类型 ID 计算）：

```protobuf
package com.example.models alias models_v1;
```

规则：

- 可选但推荐
- 必须位于任何类型定义之前
- 每个文件最多一个 `package`
- 用于命名空间注册
- `alias` 会参与 auto-ID 哈希

语言映射：

| 语言   | package 用法                        |
| ------ | ----------------------------------- |
| Java   | Java package                        |
| Python | 模块名（`.` 转 `_`）                |
| Go     | 包名（通常取最后一段）              |
| Rust   | 模块名（`.` 转 `_`）                |
| C++    | 命名空间（`.` 转 `::`）             |

## 文件级选项

文件级选项用于控制语言定制代码生成。

### 语法

```protobuf
option option_name = value;
```

### Java Package 选项

通过 `java_package` 覆盖 Java 输出包名：

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";

message Payment {
    string id = 1;
}
```

效果：

- Java 文件输出到 `com/mycorp/payment/v1/`
- Java `package` 声明使用该值
- 跨语言类型注册仍以 Fory package（如 `payment`）为准

### Go Package 选项

通过 `go_package` 指定 Go import path 与包名：

```protobuf
package payment;
option go_package = "github.com/mycorp/apis/gen/payment/v1;paymentv1";

message Payment {
    string id = 1;
}
```

格式：`"import/path;package_name"` 或仅 `"import/path"`（包名取最后一段）。

### Java Outer Classname 选项

将多个类型包装到一个外层类：

```protobuf
package payment;
option java_outer_classname = "DescriptorProtos";

enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
}

message Payment {
    string id = 1;
    Status status = 2;
}
```

默认会生成单文件，枚举与消息作为静态内部类型。

### Java Multiple Files 选项

控制 Java 是否拆分多文件：

```protobuf
package payment;
option java_outer_classname = "PaymentProtos";
option java_multiple_files = true;

message Payment {
    string id = 1;
}

message Receipt {
    string id = 1;
}
```

行为：

| `java_outer_classname` | `java_multiple_files` | 结果                                       |
| ---------------------- | --------------------- | ------------------------------------------ |
| 未设置                 | 任意                  | 每个类型一个文件                            |
| 已设置                 | `false`（默认）       | 单文件 + 内部类                             |
| 已设置                 | `true`                | 强制拆分为多文件                            |

### 多个选项组合

```protobuf
package payment;
option java_package = "com.mycorp.payment.v1";
option go_package = "github.com/mycorp/apis/gen/payment/v1;paymentv1";
option deprecated = true;
```

### Protobuf 扩展语法说明

在 `.fdl` 中请使用 Fory 原生语法（如 `[id=100]`、`ref`、`optional`、`nullable=true`）。
`(fory).xxx` 形式仅用于 `.proto`（protobuf 前端）。

### 选项优先级

语言包路径优先级：

1. 命令行覆盖（最高）
2. 语言选项（`java_package`、`go_package`）
3. Fory IDL `package`（兜底）

### 跨语言类型注册

默认情况下，注册名由 `package + type name`（或类型 ID）确定。建议长期保持 `package` 稳定，以避免跨版本注册不一致。

## Import 语句

### 基本语法

```protobuf
import "common/types.fdl";
```

### 多个导入

```protobuf
import "common/types.fdl";
import "domain/user.fdl";
import "domain/order.fdl";
```

### 路径解析

import 解析顺序：

1. 导入者文件所在目录
2. 命令行 `-I/--proto_path/--import_path` 指定目录（按给定顺序）

### 完整示例

```protobuf
// src/main.fdl
package app;

import "common.fdl";
import "models/user.fdl";

message Main {
    common.Meta meta = 1;
    models.User user = 2;
}
```

### 不支持的 import 写法

- URL 形式（如 `https://...`）
- 绝对路径依赖（不推荐，会破坏可移植性）

### import 错误

典型错误：

- 文件不存在
- 搜索路径未包含依赖目录
- 同名文件冲突导致解析到错误版本

## Enum 定义

### 基本语法

```protobuf
enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
    DISABLED = 2;
}
```

### 显式类型 ID

```protobuf
enum Status [id=101] {
    UNKNOWN = 0;
    ACTIVE = 1;
    DISABLED = 2;
}
```

### 预留值

```protobuf
enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
    reserved 2, 3;
    reserved 10 to 20;
}
```

### enum 类型选项

常见：`id`、`alias`、`deprecated`。

### 语言映射

- Java：`enum`
- Python：`IntEnum`
- Go：`type + const`
- Rust：`repr(i32)` 枚举
- C++：`enum class`

### 枚举前缀处理

针对 protobuf 风格 `TYPE_NAME_VALUE`，生成器通常会按语言习惯去除冗余前缀，使 API 更自然。

## Message 定义

### 基本语法

```protobuf
message User {
    string name = 1;
    int32 age = 2;
}
```

### 显式类型 ID

```protobuf
message User [id=100] {
    string name = 1;
    int32 age = 2;
}
```

### 无显式类型 ID

未声明 `[id=...]` 时，编译器可按配置自动生成类型 ID，或使用 namespace/name 注册。

### 语言映射

- Java：类 / record（按选项）
- Python：dataclass
- Go：struct
- Rust：struct
- C++：class/struct + 宏元信息

### 预留字段

```protobuf
message User {
    string name = 1;
    reserved 2, 3;
    reserved 10 to 20;
}
```

### message 类型选项

常见选项：`id`、`alias`、`evolving`、`deprecated`、`namespace`、`use_record_for_java`。

## 嵌套类型

### 嵌套 message

```protobuf
message Person {
    message PhoneNumber {
        string number = 1;
    }
    PhoneNumber phone = 1;
}
```

### 嵌套 enum

```protobuf
message Person {
    enum PhoneType {
        MOBILE = 0;
        HOME = 1;
    }
    PhoneType type = 1;
}
```

### 限定类型名

可使用完整限定名引用嵌套类型，例如 `Person.PhoneNumber`。

### 深层嵌套类型

支持多层嵌套，但建议控制层级，避免可读性下降。

### 各语言生成形态

| 语言   | 嵌套类型形态                  |
| ------ | ----------------------------- |
| Java   | `Outer.Inner`                |
| Python | `Outer.Inner`                |
| Rust   | `outer::Inner`               |
| C++    | `Outer::Inner`               |
| Go     | `Outer_Inner`（默认）        |

### 嵌套规则

- 嵌套类型名在其父作用域内必须唯一
- 可被同文件后续类型引用
- 可通过 import + 限定名跨文件引用

## Union 定义

### 基本语法

```protobuf
union Animal {
    Dog dog = 1;
    Cat cat = 2;
}
```

### 在 message 中使用 union

```protobuf
message Person {
    Animal pet = 1;
}
```

### 规则

- case 字段号必须唯一
- case 类型通常为消息类型或可序列化复合类型
- 各语言会生成带 case 判别和访问器的 union 表达

## 字段定义

### 基本语法

```protobuf
string name = 1;
```

### 带修饰符语法

```protobuf
optional string nickname = 2;
ref Node parent = 3;
list<int32> scores = 4;
```

### 字段修饰符

#### `optional`

声明字段可为空（null/None）：

```protobuf
message User {
    optional string email = 1;
}
```

建议在跨语言场景显式使用，以避免默认值差异。

#### `ref`

开启引用跟踪，用于共享对象与循环结构：

```protobuf
message Node {
    string name = 1;
    ref Node parent = 2;
    list<ref Node> children = 3;
}
```

当运行时全局 ref tracking 开启时，字段级 `ref` 才会生效。

#### `list`

列表字段（`repeated` 为等价别名）：

```protobuf
message Group {
    list<string> tags = 1;
}
```

### 组合修饰符

可组合使用：

```protobuf
message Graph {
    optional ref Node root = 1;
    list<ref Node> nodes = 2;
}
```

## 字段号

字段号规则：

- 同一 message 内必须唯一
- 必须为正整数
- 不应复用已删除字段号（建议使用 `reserved`）
- 建议预留编号区间以便演进

## Type System {#type-system}

Fory IDL 类型系统包括基础类型、命名类型和集合类型。

### Primitive Types

| 类型族        | 示例                                      |
| ------------- | ----------------------------------------- |
| 布尔          | `bool`                                    |
| 整数          | `int8/int16/int32/int64`、`uint*`         |
| 浮点          | `float32`、`float64`                      |
| 字符串        | `string`                                  |
| 字节数组      | `bytes`                                   |
| 时间          | `date`、`timestamp`、`duration`           |
| 动态类型      | `any`                                     |

#### Boolean

`bool` 表示布尔值。

#### Integer Types

支持有符号/无符号与不同位宽。跨语言场景建议明确编码策略并保持字段语义稳定。

#### Integer Encoding Variants

常见编码：

- `varint`：小值更省空间
- `fixed`：固定长度，性能稳定
- `tagged`：混合编码（特定类型可用）

#### Floating-Point Types

- `float32`
- `float64`

#### String Type

`string` 使用 UTF-8 文本语义。

#### Bytes Type

`bytes` 用于原始二进制载荷。

#### Temporal Types

##### Date

`date` 表示日期（不含时区时间部分）。

##### Timestamp

`timestamp` 表示时间点（跨语言应统一时间语义与精度预期）。

#### Any

`any` 允许存储动态类型值。使用 `any` 时建议配合清晰的业务约束，避免滥用导致模型不稳定。

### Named Types

命名类型包括：

- `enum`
- `message`
- `union`

支持跨文件 import 和限定名引用。

### Collection Types

#### List (`list`)

```protobuf
list<T>
```

等价别名：`repeated T`。

#### Map

```protobuf
map<K, V>
```

约束：

- `K` 一般应为可稳定比较的标量类型
- `V` 可为任意支持类型

### Type Compatibility Matrix

跨语言建议：

- 使用各语言都稳定支持的公共子集
- 尽量避免平台相关宽度/语义差异
- 对整数编码与可空语义显式声明

### Best Practices

1. 优先使用显式字段号与稳定命名
2. 需要可空就显式 `optional`
3. 存在共享/循环关系时使用 `ref`
4. 降低 `any` 使用范围，优先强类型建模
5. 预留字段号与枚举值区间

## Type IDs

类型 ID 用于跨语言快速注册与解码匹配。

### 显式类型 ID

```protobuf
message User [id=100] {
    string name = 1;
}
```

### 无显式类型 ID

未显式声明时可：

- 自动生成数值 ID（默认配置）
- 禁用自动 ID，改用 namespace/type-name 注册

### 实践说明

- 类型 ID 在协议层面应视为稳定标识
- 一经发布，不建议更改
- 建议按域规划 ID 段（如 100-199 用户域）

### ID 分配策略

- 核心高频模型优先分配固定 ID
- 团队统一管理 ID 区间与分配规范
- 在 CI 中增加 ID 冲突检查

## 完整示例

```protobuf
package demo.order;

option java_package = "com.example.demo.order";
option go_package = "github.com/example/demo/gen/order;order";

import "demo/common.fdl";

enum Status [id=200] {
    UNKNOWN = 0;
    CREATED = 1;
    PAID = 2;
    SHIPPED = 3;
}

message Item [id=201] {
    string sku = 1;
    int32 quantity = 2;
}

message User [id=202] {
    string id = 1;
    string name = 2;
    optional string email = 3;
}

union Animal [id=203] {
    Dog dog = 1;
    Cat cat = 2;
}

message Dog [id=204] {
    string name = 1;
}

message Cat [id=205] {
    string name = 1;
}

message Order [id=206] {
    string id = 1;
    ref User buyer = 2;
    list<Item> items = 3;
    Status status = 4;
    map<string, string> metadata = 5;
    optional Animal pet = 6;
}
```

## 语法摘要

以下为简化文法（便于快速查阅，具体以编译器实现为准）：

```ebnf
file            = [packageDecl] {optionDecl} {importDecl} {typeDecl} ;

packageDecl     = "package" qualifiedName ["alias" identifier] ";" ;
optionDecl      = "option" identifier "=" optionValue ";" ;
importDecl      = "import" stringLiteral ";" ;

typeDecl        = enumDecl | messageDecl | unionDecl ;

enumDecl        = "enum" identifier [typeOptions] "{" {enumField | reservedDecl} "}" ;
enumField       = identifier "=" intLiteral ";" ;

messageDecl     = "message" identifier [typeOptions] "{" {fieldDecl | nestedTypeDecl | reservedDecl} "}" ;
unionDecl       = "union" identifier [typeOptions] "{" {unionCaseDecl} "}" ;

fieldDecl       = [fieldModifier] typeRef identifier "=" intLiteral [fieldOptions] ";" ;
unionCaseDecl   = typeRef identifier "=" intLiteral [fieldOptions] ";" ;

fieldModifier   = "optional" | "ref" | "list" ;

typeRef         = primitiveType | qualifiedName | listType | mapType ;
listType        = "list" "<" typeRef ">" ;
mapType         = "map" "<" typeRef "," typeRef ">" ;

typeOptions     = "[" optionPair {"," optionPair} "]" ;
fieldOptions    = "[" optionPair {"," optionPair} "]" ;
optionPair      = identifier "=" optionValue ;

reservedDecl    = "reserved" reservedItem {"," reservedItem} ";" ;
reservedItem    = intLiteral | intLiteral "to" intLiteral | stringLiteral ;
```

实现建议：如需严谨验证，请以编译器语法解析器和测试用例为准。
