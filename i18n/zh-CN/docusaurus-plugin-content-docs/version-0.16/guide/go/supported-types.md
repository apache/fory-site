---
title: 支持类型
sidebar_position: 40
id: supported_types
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

Fory Go 支持广泛的 Go 类型序列化。本指南介绍支持的类型以及它们的跨语言映射关系。

## 基础类型

| Go 类型 | Fory TypeId | 编码方式 | 说明 |
| --- | --- | --- | --- |
| `bool` | BOOL (1) | 1 字节 |  |
| `int8` | INT8 (2) | 1 字节，有符号 |  |
| `int16` | INT16 (3) | 2 字节，有符号 | 小端序 |
| `int32` | INT32 (4) | Varint | 变长编码 |
| `int64` | INT64 (6) | Varint | 变长编码 |
| `int` | INT32/INT64 | Varint | 依赖平台位宽（32/64 位） |
| `uint8` / `byte` | UINT8 (9) | 1 字节，无符号 |  |
| `uint16` | UINT16 (10) | 2 字节，无符号 | 小端序 |
| `uint32` | UINT32 (11) | Varuint | 变长编码 |
| `uint64` | UINT64 (13) | Varuint | 变长编码 |
| `float32` | FLOAT32 (17) | 4 字节 | IEEE 754 |
| `float64` | FLOAT64 (18) | 8 字节 | IEEE 754 |
| `string` | STRING (19) | UTF-8 长度前缀 |  |

### 整数编码

Fory 使用变长整数编码（varint）来提升压缩效果：

- 数值越小，占用字节越少
- 负数使用 ZigZag 编码
- 平台的 `int` 在 32 位系统上映射为 `int32`，在 64 位系统上映射为 `int64`

```go
f := fory.New()

// 支持所有常见整数类型
var i8 int8 = 127
var i16 int16 = 32767
var i32 int32 = 2147483647
var i64 int64 = 9223372036854775807

data, _ := f.Serialize(i64) // 使用 varint 编码
```

## 集合类型

### Slice

| Go 类型 | Fory TypeId | 说明 |
| --- | --- | --- |
| `[]bool` | BOOL_ARRAY | 优化编码 |
| `[]int8` | INT8_ARRAY | 优化编码 |
| `[]int16` | INT16_ARRAY | 优化编码 |
| `[]int32` | INT32_ARRAY | 优化编码 |
| `[]int64` | INT64_ARRAY | 优化编码 |
| `[]float32` | FLOAT32_ARRAY | 优化编码 |
| `[]float64` | FLOAT64_ARRAY | 优化编码 |
| `[]string` | LIST | 通用列表编码 |
| `[]T`（任意类型） | LIST (20) | 任意可序列化类型 |
| `[]I`（接口元素） | LIST | 任意接口类型 |

```go
f := fory.New()

// 基础类型 slice（优化编码）
ints := []int32{1, 2, 3, 4, 5}
data, _ := f.Serialize(ints)

// 字符串 slice
strs := []string{"a", "b", "c"}
data, _ = f.Serialize(strs)

// 结构体 slice
users := []User{{ID: 1}, {ID: 2}}
data, _ = f.Serialize(users)

// 动态 slice
dynamic := []any{1, "hello", true}
data, _ = f.Serialize(dynamic)
```

### Map

| Go 类型 | Fory TypeId | 说明 |
| --- | --- | --- |
| `map[string]string` | MAP (22) | 优化编码 |
| `map[string]int64` | MAP | 优化编码 |
| `map[string]int32` | MAP | 优化编码 |
| `map[string]int` | MAP | 优化编码 |
| `map[string]float64` | MAP | 优化编码 |
| `map[string]bool` | MAP | 优化编码 |
| `map[int32]int32` | MAP | 优化编码 |
| `map[int64]int64` | MAP | 优化编码 |
| `map[int]int` | MAP | 优化编码 |
| `map[string]any` | MAP | 动态值 |
| `map[any]any` | MAP | 动态键和值 |

```go
f := fory.New()

// 字符串键 map
m1 := map[string]string{"key": "value"}
m2 := map[string]int64{"count": 42}

// 整数键 map
m3 := map[int32]int32{1: 100, 2: 200}

// 动态 map
m4 := map[string]any{
    "name": "Alice",
    "age":  int64(30),
}
```

### Set

Fory 提供了泛型 `Set[T]` 类型，底层使用 `map[T]struct{}`，不会为 value 带来额外内存开销：

```go
// 创建字符串集合
s := fory.NewSet[string]()
s.Add("a", "b", "c")

// 检查成员
if s.Contains("a") {
    fmt.Println("found")
}

// 序列化
data, _ := f.Serialize(s)
```

## 时间类型

| Go 类型 | Fory TypeId | 说明 |
| --- | --- | --- |
| `time.Time` | TIMESTAMP (34) | 纳秒精度 |
| `time.Duration` | DURATION (33) | 纳秒精度 |

```go
import "time"

f := fory.New()

// 时间戳
t := time.Now()
data, _ := f.Serialize(t)

// Duration
d := 5 * time.Second
data, _ = f.Serialize(d)
```

## 结构体类型

| 类别 | Fory TypeId | 说明 |
| --- | --- | --- |
| Struct | STRUCT (25) | 按 ID 注册，不支持演进 |
| Compatible Struct | COMPATIBLE_STRUCT (26) | 支持 Schema 演进 |
| Named Struct | NAMED_STRUCT (27) | 按名称注册，不支持演进 |
| Named Compatible Struct | NAMED_COMPATIBLE_STRUCT (28) | 按名称注册，支持 Schema 演进 |

### 结构体要求

1. **仅导出字段**：只有首字母大写的字段会被序列化。
2. **字段类型受支持**：字段类型必须包含在本文档列出的支持范围内。
3. **建议注册**：跨语言场景下，结构体应先完成注册。

```go
type User struct {
    ID       int64   // 会被序列化
    Name     string  // 会被序列化
    Age      int32   // 会被序列化
    password string  // 不会被序列化（未导出）
}

f := fory.New()
f.RegisterStruct(User{}, 1)

user := &User{ID: 1, Name: "Alice", Age: 30, password: "secret"}
data, _ := f.Serialize(user)
```

### 嵌套结构体

```go
type Address struct {
    Street  string
    City    string
    Country string
}

type Company struct {
    Name    string
    Address Address
    Founded int32
}

f := fory.New()
f.RegisterStruct(Address{}, 1)
f.RegisterStruct(Company{}, 2)
```

## 指针类型

| Go 类型 | 行为 |
| --- | --- |
| `*T` | 可为 `nil`，启用时可参与引用跟踪 |
| `**T` | 支持多级指针 |

```go
f := fory.New(fory.WithTrackRef(true))

type Node struct {
    Value int32
    Left  *Node
    Right *Node
}

f.RegisterStruct(Node{}, 1)

root := &Node{
    Value: 1,
    Left:  &Node{Value: 2},
    Right: &Node{Value: 3},
}

data, _ := f.Serialize(root)
```

### `nil` 处理

```go
var ptr *User = nil
data, _ := f.Serialize(ptr)

var result *User
f.Deserialize(data, &result)
// result == nil
```

## 接口类型

| Go 类型 | Fory TypeId | 说明 |
| --- | --- | --- |
| `any` | UNION (31) | 多态值 |

```go
f := fory.New()

// 序列化 any
var value any = "hello"
data, _ := f.Serialize(value)

var result any
f.Deserialize(data, &result)
// result == "hello"（string）
```

如果接口中会承载结构体实现，请注册所有可能的具体类型：

```go
type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14159 * c.Radius * c.Radius
}

f := fory.New()
f.RegisterStruct(Circle{}, 1)

var shape Shape = Circle{Radius: 5.0}
data, _ := f.Serialize(shape)
```

## 二进制数据

| Go 类型 | Fory TypeId | 说明 |
| --- | --- | --- |
| `[]byte` | BINARY (37) | 变长字节串 |

```go
f := fory.New()

data := []byte{0x01, 0x02, 0x03, 0x04}
serialized, _ := f.Serialize(data)

var result []byte
f.Deserialize(serialized, &result)
```

## 枚举类型

Go 中通常使用整数类型来表示枚举：

```go
type Status int32

const (
    StatusPending  Status = 0
    StatusActive   Status = 1
    StatusComplete Status = 2
)

f := fory.New()
f.RegisterEnum(Status(0), 1)

status := StatusActive
data, _ := f.Serialize(status)
```

## 跨语言类型映射

| Go 类型 | Java | Python | C++ | Rust |
| --- | --- | --- | --- | --- |
| `bool` | boolean | bool | bool | bool |
| `int8` | byte | int | int8_t | i8 |
| `int16` | short | int | int16_t | i16 |
| `int32` | int | int | int32_t | i32 |
| `int64` | long | int | int64_t | i64 |
| `float32` | float | float | float | f32 |
| `float64` | double | float | double | f64 |
| `string` | String | str | std::string | String |
| `[]T` | `List<T>` | list | `std::vector<T>` | `Vec<T>` |
| `map[K]V` | `Map<K,V>` | dict | `std::unordered_map` | `HashMap<K,V>` |
| `time.Time` | Instant | datetime | - | - |
| `time.Duration` | Duration | timedelta | - | - |

详细映射可参考 [Cross-Language Serialization](cross-language.md)。

## 不支持的类型

以下 Go 类型**不受支持**：

- 通道（`chan T`）
- 函数（`func()`）
- 复数（`complex64`、`complex128`）
- 不安全指针（`unsafe.Pointer`）

尝试序列化这些类型会返回错误。

## 相关主题

- [类型注册](type-registration.md)
- [跨语言序列化](cross-language.md)
- [引用处理](references.md)
