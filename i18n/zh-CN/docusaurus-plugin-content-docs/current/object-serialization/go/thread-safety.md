---
title: 线程安全
sidebar_position: 13
id: thread-safety
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

本指南介绍 Fory Go 的并发使用模式，包括线程安全包装器和多 goroutine 环境的最佳实践。

## 默认 Fory 实例

默认 `Fory` 实例**不是线程安全的**：

```go
f := fory.New(fory.WithXlang(true))

// NOT SAFE: Concurrent access from multiple goroutines
go func() {
    f.Serialize(value1)  // Race condition!
}()
go func() {
    f.Serialize(value2)  // Race condition!
}()
```

### 为什么不是线程安全的？

为提高性能，Fory 会复用内部状态：

- 在调用之间清空并复用缓冲区
- 重置引用解析器
- 回收上下文对象

这样可以避免分配，但要求独占访问。

## 线程安全包装器

并发使用时请使用 `threadsafe` 包：

```go
import "github.com/apache/fory/go/fory/threadsafe"

// Create thread-safe Fory
f := threadsafe.New()

// Safe for concurrent use
go func() {
    data, _ := f.Serialize(value1)
}()
go func() {
    data, _ := f.Serialize(value2)
}()
```

包装器按需创建实例，并在 goroutine 之间复用。每次操作独占借用一个实例，并在结束后归还。
即使垃圾回收清除了缓存实例，已注册的类型仍然可用。序列化结果会在返回前复制，调用方可以安全保留。

### API

```go
// Create thread-safe instance
f := threadsafe.New()

// Instance methods
data, err := f.Serialize(value)
err = f.Deserialize(data, &target)

// Generic functions
data, err := threadsafe.Serialize(f, &value)
err = threadsafe.Deserialize(f, data, &target)

// Global convenience functions
data, err := threadsafe.Marshal(&value)
err = threadsafe.Unmarshal(data, &target)
```

## 类型注册

必须在第一次序列化或反序列化之前注册所有类型。第一次操作会永久冻结包装器的注册状态，
即使该操作失败也是如此。之后再尝试注册会返回错误。

```go
f := threadsafe.New()

if err := f.RegisterStruct(User{}, 1); err != nil {
    panic(err)
}
if err := f.RegisterStruct(Order{}, 2); err != nil {
    panic(err)
}

// 所有并发操作都使用这些已注册的类型。
go func() {
    data, err := f.Serialize(&User{ID: 1})
    // 使用 data 并处理 err。
    _, _ = data, err
}()
```

包装器也直接提供 `RegisterStructByName`、`RegisterEnum` 和 `RegisterEnumByName`。
每个已注册的类型都可供所有并发操作使用，并且不会因垃圾回收而丢失注册信息。

如需为每个实例执行自定义初始化，请使用 `NewWithFactory`：

```go
f := threadsafe.NewWithFactory(func() *fory.Fory {
    inner := fory.New()
    if err := inner.RegisterExtension(CustomType{}, 100, newCustomSerializer()); err != nil {
        panic(err)
    }
    return inner
})
```

需要更多实例时，工厂可能被并发调用。每次调用都必须返回配置相同的全新实例，并在返回前完成注册。
有状态的自定义序列化器必须为每个实例分别创建。

## 零拷贝注意事项

### 非线程安全实例

使用默认 Fory 时，返回的字节切片是内部缓冲区的视图：

```go
f := fory.New(fory.WithXlang(true))

data1, _ := f.Serialize(value1)
// data1 is valid

data2, _ := f.Serialize(value2)
// data1 is NOW INVALID (buffer was reused)
```

### 线程安全实例

线程安全包装器会自动复制数据：

```go
f := threadsafe.New()

data1, _ := f.Serialize(value1)
data2, _ := f.Serialize(value2)
// Both data1 and data2 are valid (independent copies)
```

这样更安全，但会产生分配开销。

## 性能对比

| 场景           | 非线程安全 | 线程安全         |
| -------------- | ---------- | ---------------- |
| 单个 goroutine | 最快       | 较慢（池开销）   |
| 多个 goroutine | 不安全     | 安全，扩展性良好 |
| 内存分配       | 最少       | 每次调用复制     |
| 缓冲区复用     | 是         | 每个池实例复用   |

### 基准测试

```go
func BenchmarkNonThreadSafe(b *testing.B) {
    f := fory.New(fory.WithXlang(true))
    f.RegisterStruct(User{}, 1)
    user := &User{ID: 1, Name: "Alice"}

    for i := 0; i < b.N; i++ {
        data, _ := f.Serialize(user)
        _ = data
    }
}

func BenchmarkThreadSafe(b *testing.B) {
    f := threadsafe.New()
    f.RegisterStruct(User{}, 1)
    user := &User{ID: 1, Name: "Alice"}

    for i := 0; i < b.N; i++ {
        data, _ := f.Serialize(user)
        _ = data
    }
}
```

## 使用模式

### 每个 Goroutine 一个实例

goroutine 数量已知时，为获得最高性能：

```go
func worker(id int) {
    // Each worker has its own Fory instance
    f := fory.New(fory.WithXlang(true))
    f.RegisterStruct(User{}, 1)

    for task := range tasks {
        data, _ := f.Serialize(task)
        process(data)
    }
}

// Start workers
for i := 0; i < numWorkers; i++ {
    go worker(i)
}
```

### 共享线程安全实例

goroutine 数量动态变化或希望简化使用时：

```go
// Single shared instance
var f = threadsafe.New()

func init() {
    f.RegisterStruct(User{}, 1)
}

func handleRequest(user *User) []byte {
    // Safe from any goroutine
    data, _ := f.Serialize(user)
    return data
}
```

### HTTP 处理器示例

```go
var fory = threadsafe.New()

func init() {
    fory.RegisterStruct(Response{}, 1)
}

func handler(w http.ResponseWriter, r *http.Request) {
    response := &Response{
        Status: "ok",
        Data:   getData(),
    }

    // Safe: threadsafe.Fory handles concurrency
    data, err := fory.Serialize(response)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    w.Header().Set("Content-Type", "application/octet-stream")
    w.Write(data)
}
```

## 常见错误

### 共享非线程安全实例

```go
// WRONG: Race condition
var f = fory.New(fory.WithXlang(true))

func handler1() {
    f.Serialize(value1)  // Race!
}

func handler2() {
    f.Serialize(value2)  // Race!
}
```

**修复方法**：使用 `threadsafe.New()` 或每个 goroutine 独立的实例。

### 保留缓冲区引用

```go
// WRONG: Buffer invalidated on next call
f := fory.New(fory.WithXlang(true))
data, _ := f.Serialize(value1)
savedData := data  // Just copies the slice header!

f.Serialize(value2)  // Invalidates data and savedData
```

**修复方法**：克隆数据或使用线程安全包装器。

```go
// Correct: Clone the data
data, _ := f.Serialize(value1)
savedData := make([]byte, len(data))
copy(savedData, data)

// Or use thread-safe (auto-copies)
f := threadsafe.New()
data, _ := f.Serialize(value1)  // Already copied
```

### 并发注册类型

```go
// RISKY: Concurrent registration
go func() {
    f.RegisterStruct(TypeA{}, 1)
}()
go func() {
    f.Serialize(value)  // May not see TypeA
}()
```

**修复方法**：在第一次序列化或反序列化之前注册所有类型。

## 最佳实践

1. **启动时注册类型**：在第一次序列化或反序列化之前完成
2. **保留引用时克隆数据**：适用于非线程安全实例
3. **热路径每个工作线程使用独立实例**：消除池竞争
4. **优化前先分析性能**：线程安全开销可能可以忽略

## 相关主题

- [配置](configuration.md)
- [基本序列化](basic-serialization.md)
- [故障排查](troubleshooting.md)
