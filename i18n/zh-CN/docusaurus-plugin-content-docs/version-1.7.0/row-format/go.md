---
title: Go Standard Row Format
sidebar_position: 7
id: go
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

`github.com/apache/fory/go/fory/row` 实现与 Java、C++、Python 和 Rust 共享的 Standard Row Format，
提供结构体编码、字段随机访问和跨语言 Schema 编码。

Row Format 适用于可信的内存数据，例如选择性字段读取、内存映射数据和跨语言分析数据管道。
只读取可信来源、由 Fory Row writer 按相同 Schema 生成的数据；该格式不提供对象序列化针对不可信输入的防护。

## 基本用法 {#basic-usage}

```go
package main

import (
    "fmt"

    "github.com/apache/fory/go/fory/row"
)

type UserProfile struct {
    Id       int64
    Username string
    Email    *string
    Scores   []int32
}

func main() {
    encoder, err := row.NewEncoder[UserProfile]()
    if err != nil {
        panic(err)
    }
    email := "alice@example.com"
    profile := UserProfile{
        Id: 12345, Username: "alice", Email: &email, Scores: []int32{95, 87},
    }
    data, err := encoder.ToRow(&profile)
    if err != nil {
        panic(err)
    }
    schema := encoder.Schema()
    view := row.NewRow(schema, data)
    fmt.Println(view.String(schema.FieldIndex("username"))) // alice
    fmt.Println(view.Array(schema.FieldIndex("scores")).Int32(1)) // 87
    fmt.Println(view.IsNullAt(schema.FieldIndex("email"))) // false

    decoded, err := encoder.FromRow(data)
    if err != nil {
        panic(err)
    }
    fmt.Println(decoded.Username) // alice
}
```

创建 encoder 的成本高于复用实例。每种结构体类型应创建一次并复用，但不要在多个 goroutine 中
无保护地共享同一个 encoder。

## 裸 Row 与带帧消息 {#rows-and-framed-messages}

`ToRow` 和 `FromRow` 处理裸 Row 字节，与其他语言的 `toRow` 和 `BinaryRow.pointTo` 对应。
`Encode` 和 `Decode` 额外使用 Java、Python Row encoder 的帧格式：八字节小端 Schema hash，随后是 Row。

```go
framed, err := encoder.Encode(&profile)
decoded, err := encoder.Decode(framed)
```

hash 只包含递归字段类型 ID。它可以检测字段类型变化，但不能检测字段重命名、可空性变化或相同类型字段
的重排。如果双方需要完整校验 Schema，应交换 Schema 字节。

`Decode` 和 `FromRow` 对截断或不一致的数据返回错误。解码后的值不引用输入字节，因此之后可以复用输入缓冲区。

## 零拷贝读取 {#zero-copy-reading}

`row.NewRow(schema, data)` 创建 Row 视图。`Struct`、`Array` 和 `Map` 返回嵌套字节视图，
`Binary` 返回输入的子切片。这些视图只在底层字节有效且不被修改时有效。
`String` 会复制数据，避免 Go 字符串随输入缓冲区变化。

固定宽度 getter 对 null 返回零值，需要区分 null 和零时使用 `IsNullAt`。
变长 getter 对 null 返回 `nil` 或空字符串。越界索引和格式错误的数据可能导致原始视图访问 panic；
需要错误返回时使用 encoder 的解码方法。

## 可空性 {#nullability}

指针字段可空：`nil` 写入 null 位，并在解码时恢复为 `nil`。切片、Map 和 `[]byte` 同样可空，
并且区分 nil 与空容器。

字符串、嵌套值结构体、`fory.Date`、`time.Time` 和 `time.Duration` 在 Schema 中可空，
但对应的 Go 值不能持有 nil，因此解码 null 会返回错误。需要保留 null 时，使用 `*string`、
`*time.Time` 或 `*Inner` 等指针类型。

Map 值可空，键不可空。`[]*int32` 元素和 `map[string]*int32` 值可以承载 null，
`[]int32` 和 `map[string]int32` 不可以。

## 字段顺序与名称 {#field-order-and-names}

字段按 lowerCamel 名称排序，并以 snake_case 命名，例如 `UserName` 对应 `user_name`。
该规则与 Java 的 Schema 推导一致。不导出的字段会被跳过。
`fory:"-"`、`fory:"ignore"` 和 `fory:"ignore=true"` 会跳过字段；其他 tag 选项被接受但不影响 Row Format。
更改字段名或类型时，必须协调所有读写方的 Schema。

## 支持的类型 {#supported-types}

| Go 类型                                   | Standard Row 编码     | 可空 |
| ----------------------------------------- | --------------------- | ---- |
| `bool`、`int8`、`int16`、`int32`、`int64` | 固定宽度标量          | 否   |
| `int`                                     | int64                 | 否   |
| `float32`、`float64`                      | IEEE 754 浮点数       | 否   |
| `fory.Date`                               | 自纪元起的天数 date32 | 是   |
| `time.Time`                               | 自纪元起的微秒数      | 是   |
| `time.Duration`                           | 微秒数                | 是   |
| `string`                                  | UTF-8 字节            | 是   |
| `[]byte`                                  | int8 Standard array   | 是   |
| 受支持元素类型的 `[]T`                    | Standard array        | 是   |
| `map[K]V`                                 | Standard map          | 是   |
| 嵌套结构体                                | 嵌套 Standard Row     | 是   |
| 受支持的非切片、非 Map 类型的 `*T`        | 与 `T` 相同           | 是   |

`[]byte` 与 Java `byte[]` 一样按 int8 列表编码。binary 类型仅可通过手动构建的 Schema、
`RowWriter.WriteBytes` 和 `Row.Binary` 使用。

字符串必须是有效 UTF-8。时间戳微秒数必须能由 int64 表示。
Map 键可以是标量、字符串或由这些类型递归组成的值结构体。
`time.Time`、`time.Duration` 和指针不能用作键，也不能出现在键结构体的有效字段中。
Duration 编码截断到微秒；如果应用需要以时间为键，请使用单位明确的 int64。

不支持无符号整数、固定长度数组、嵌套指针、切片或 Map 的指针、接口、channel、函数、递归类型、
`float16` 和 `decimal`。

## Schema 交换 {#schema-exchange}

`SchemaToBytes` 和 `SchemaFromBytes` 使用与 Java `SchemaEncoder`、Python
`Schema.to_bytes` 和 `from_bytes` 一致的编码。`ComputeSchemaHash` 计算 `Encode` 使用的类型结构 hash。

```go
schemaBytes, err := row.SchemaToBytes(encoder.Schema())
schema, err := row.SchemaFromBytes(schemaBytes)
fmt.Println(schema.Equal(encoder.Schema())) // true
```

Java bean 与 Go 结构体需要对应字段和一致的可空性。与 Java 装箱类型对应时使用 Go 指针，
与 Java 基本类型对应时使用 Go 值。

## 手动写入 Row {#writing-rows-by-hand}

使用 `RowWriter`、`ArrayWriter` 和 `MapWriter` 可以按手动构建的 Schema 写入，不需要 Go 结构体。
嵌套值写入共享缓冲区后，通过 `SetOffsetAndSize` 关联到父字段。

```go
schema := row.NewSchema([]row.Field{
    row.NewField("id", row.Int64Type{}, false),
    row.NewField("tags", row.List(row.StringType{}), true),
})
writer := row.NewRowWriter(schema)
writer.Reset()
writer.WriteInt64(0, 7)
tags := row.NewArrayWriter(row.List(row.StringType{}).Elem, writer.Buffer())
start := writer.Buffer().WriterIndex()
if err := tags.Reset(2); err != nil {
    panic(err)
}
if err := tags.WriteString(0, "go"); err != nil {
    panic(err)
}
tags.SetNullAt(1)
if err := writer.SetOffsetAndSize(1, start, writer.Buffer().WriterIndex()-start); err != nil {
    panic(err)
}
data := writer.ToBytes()
```

每次写 Row 前调用 `Reset`；为新的顶层 Row 复用 writer 时，先将缓冲区的写位置设为零。
`ToBytes` 返回的字节只在下一次修改缓冲区之前有效。

## 线程安全 {#thread-safety}

encoder 和 writer 不支持无保护的并发调用。每个 goroutine 使用独立实例，或用互斥锁保护。
Row、数组和 Map 视图可以被多个 goroutine 同时读取，前提是底层字节不被修改。

## 相关文档 {#related-topics}

- [基础序列化](../object-serialization/go/basic-serialization.md)
- [Standard Row Format](index.md#standard-row)
- [Row Format 规范](../specification/row_format_spec.md)
