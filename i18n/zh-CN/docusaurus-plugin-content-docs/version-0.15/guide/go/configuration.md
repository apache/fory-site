---
title: 配置
sidebar_position: 10
id: configuration
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

Fory Go 使用函数式选项模式进行配置。你可以在保持合理默认值的前提下，自定义序列化行为。

## 创建 Fory 实例

### 默认配置

```go
import "github.com/apache/fory/go/fory"

f := fory.New()
```

默认设置：

| Option     | Default | Description                    |
| ---------- | ------- | ------------------------------ |
| TrackRef   | false   | 关闭引用跟踪                   |
| MaxDepth   | 20      | 最大嵌套深度                   |
| IsXlang    | false   | 关闭跨语言模式                 |
| Compatible | false   | 关闭 Schema 演进兼容模式       |

### 通过选项配置

```go
f := fory.New(
    fory.WithTrackRef(true),
    fory.WithCompatible(true),
    fory.WithMaxDepth(10),
)
```

## 配置项

### WithTrackRef

启用引用跟踪，以支持循环引用和共享对象：

```go
f := fory.New(fory.WithTrackRef(true))
```

**开启后：**

- 多次出现的同一对象只会序列化一次
- 可正确处理循环引用
- 字段级 `fory:"ref"` 标签生效
- 会带来对象身份跟踪开销

**关闭（默认）时：**

- 每次对象出现都独立序列化
- 循环引用会导致栈溢出或超出最大深度错误
- 字段级 `fory:"ref"` 标签被忽略
- 对简单数据结构性能更好

**建议启用场景：**

- 数据中存在循环引用
- 同一对象被多处引用
- 需要序列化图结构（如带父指针的树、带环链表）

详见 [引用](references.md)。

### WithCompatible

启用 schema 演进兼容模式：

```go
f := fory.New(fory.WithCompatible(true))
```

**开启后：**

- 会向序列化数据写入类型元信息
- 支持版本间新增/删除字段
- 按字段名或字段 ID 匹配（与顺序无关）
- 因元信息导致输出更大

**关闭（默认）时：**

- 不写字段元信息，序列化更紧凑
- 序列化更快、输出更小
- 字段按排序顺序匹配
- 要求各服务间结构体定义保持一致

详见 [Schema 演进](schema-evolution.md)。

### WithMaxDepth

设置最大嵌套深度，防止栈溢出：

```go
f := fory.New(fory.WithMaxDepth(30))
```

- 默认值：20
- 防护深层递归结构或恶意数据
- 超过限制会返回错误

### WithXlang

启用跨语言序列化模式：

```go
f := fory.New(fory.WithXlang(true))
```

**开启后：**

- 使用跨语言类型系统
- 与 Java、Python、C++、Rust、JavaScript 兼容
- 类型 ID 遵循 xlang 规范

**关闭（默认）时：**

- 使用 Go 原生序列化模式
- 支持更多 Go 原生类型
- 与其他语言实现不兼容

## 线程安全

默认 `Fory` 实例**不是线程安全的**。并发场景请使用线程安全封装：

```go
import "github.com/apache/fory/go/fory/threadsafe"

// Create thread-safe Fory with same options
f := threadsafe.New(
    fory.WithTrackRef(true),
    fory.WithCompatible(true),
)

// Safe for concurrent use from multiple goroutines
go func() {
    data, _ := f.Serialize(value1)
    // data is already copied, safe to use after return
}()
go func() {
    data, _ := f.Serialize(value2)
}()
```

线程安全封装具备：

- 内部使用 `sync.Pool` 高效复用实例
- 返回前自动复制序列化数据
- 与 `fory.New()` 相同的配置选项

### 全局线程安全实例

为了便捷，`threadsafe` 包提供全局函数：

```go
import "github.com/apache/fory/go/fory/threadsafe"

// Uses a global thread-safe instance with default configuration
data, err := threadsafe.Marshal(&myValue)
err = threadsafe.Unmarshal(data, &result)
```

详见 [线程安全](thread-safety.md)。

## 缓冲区管理

### 零拷贝行为

默认 `Fory` 实例会复用内部缓冲区：

```go
f := fory.New()

data1, _ := f.Serialize(value1)
// WARNING: data1 becomes invalid after next Serialize call!
data2, _ := f.Serialize(value2)
// data1 now points to invalid memory

// To keep the data, copy it:
safeCopy := make([]byte, len(data1))
copy(safeCopy, data1)
```

线程安全封装会自动拷贝数据，因此不存在该问题：

```go
f := threadsafe.New()
data1, _ := f.Serialize(value1)
data2, _ := f.Serialize(value2)
// Both data1 and data2 are valid
```

### 手动控制缓冲区

高吞吐场景可手动管理缓冲区：

```go
f := fory.New()
buf := fory.NewByteBuffer(nil)

// Serialize to existing buffer
err := f.SerializeTo(buf, value)

// Get serialized data
data := buf.GetByteSlice(0, buf.WriterIndex())

// Process data...

// Reset for next use
buf.Reset()
```

## 配置示例

### 简单数据（默认配置）

适用于不含循环引用的简单结构体：

```go
f := fory.New()

type Config struct {
    Host string
    Port int32
}

f.RegisterStruct(Config{}, 1)
data, _ := f.Serialize(&Config{Host: "localhost", Port: 8080})
```

### 图结构数据

适用于存在循环引用的数据：

```go
f := fory.New(fory.WithTrackRef(true))

type Node struct {
    Value int32
    Next  *Node `fory:"ref"`
}

f.RegisterStruct(Node{}, 1)
n1 := &Node{Value: 1}
n2 := &Node{Value: 2}
n1.Next = n2
n2.Next = n1  // Circular reference

data, _ := f.Serialize(n1)
```

### Schema 演进

适用于结构可能随时间变化的数据：

```go
// V1: original struct
type UserV1 struct {
    ID   int64
    Name string
}

// V2: added Email field
type UserV2 struct {
    ID    int64
    Name  string
    Email string  // New field
}

// Serialize with V1
f1 := fory.New(fory.WithCompatible(true))
f1.RegisterStruct(UserV1{}, 1)
data, _ := f1.Serialize(&UserV1{ID: 1, Name: "Alice"})

// Deserialize into V2 - Email will have zero value
f2 := fory.New(fory.WithCompatible(true))
f2.RegisterStruct(UserV2{}, 1)
var user UserV2
f2.Deserialize(data, &user)
```

### 高性能并发场景

适用于高吞吐并发处理：

```go
type Request struct {
    ID      int64
    Payload string
}

f := threadsafe.New(
    fory.WithMaxDepth(30),
)
f.RegisterStruct(Request{}, 1)

// Process requests concurrently
for req := range requests {
    go func(r Request) {
        data, _ := f.Serialize(&r)
        sendResponse(data)
    }(req)
}
```

## 最佳实践

1. **复用 Fory 实例**：创建实例有初始化开销，建议创建一次后复用。
2. **并发时使用线程安全封装**：不要在多个 goroutine 间共享默认实例。
3. **按需启用引用跟踪**：引用跟踪会增加开销。
4. **需要长期保存数据时请复制**：默认实例返回的字节切片会在后续调用后失效。
5. **合理设置最大深度**：深层结构可适当调大，但需关注内存占用。
6. **Schema 可能演进时启用兼容模式**：服务版本存在结构差异时建议开启。

## 相关主题

- [基本序列化](basic-serialization.md)
- [引用](references.md)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
