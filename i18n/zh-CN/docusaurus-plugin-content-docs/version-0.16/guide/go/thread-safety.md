---
title: 线程安全
sidebar_position: 100
id: thread_safety
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

本指南介绍 Fory Go 的并发使用模式，包括线程安全封装以及多 goroutine 场景下的最佳实践。

## 默认 Fory 实例

默认的 `Fory` 实例**不是线程安全的**：

```go
f := fory.New()

// 错误示例：多个 goroutine 并发访问
go func() {
    f.Serialize(value1) // 会发生竞态
}()
go func() {
    f.Serialize(value2) // 会发生竞态
}()
```

### 为什么不是线程安全？

为了性能，Fory 会复用内部状态：

- 调用之间会清空并复用缓冲区
- 会重置引用解析器
- 会回收并复用上下文对象

这样可以减少分配，但要求实例在同一时刻只能被一个调用独占使用。

## 线程安全封装

并发使用时，请改用 `threadsafe` 包：

```go
import "github.com/apache/fory/go/fory/threadsafe"

// 创建线程安全的 Fory
f := threadsafe.New()

// 可以安全地并发调用
go func() {
    data, _ := f.Serialize(value1)
}()
go func() {
    data, _ := f.Serialize(value2)
}()
```

### 工作机制

线程安全封装内部使用 `sync.Pool`：

1. **Acquire**：从池中取出一个 `Fory` 实例
2. **Use**：执行序列化或反序列化
3. **Copy**：复制结果数据，因为底层缓冲区会被复用
4. **Release**：将实例归还到池中

```go
// 简化后的实现
func (f *Fory) Serialize(v any) ([]byte, error) {
    fory := f.pool.Get().(*fory.Fory)
    defer f.pool.Put(fory)

    data, err := fory.Serialize(v)
    if err != nil {
        return nil, err
    }

    // 必须复制，否则底层 buffer 后续会被复用
    result := make([]byte, len(data))
    copy(result, data)
    return result, nil
}
```

### API

```go
// 创建线程安全实例
f := threadsafe.New()

// 实例方法
data, err := f.Serialize(value)
err = f.Deserialize(data, &target)

// 泛型辅助函数
data, err = threadsafe.Serialize(f, &value)
err = threadsafe.Deserialize(f, data, &target)

// 全局便捷函数
data, err = threadsafe.Marshal(&value)
err = threadsafe.Unmarshal(data, &target)
```

## 类型注册

类型注册应在并发使用前完成：

```go
f := threadsafe.New()

// 在并发访问之前先注册所有类型
f.RegisterStruct(User{}, 1)
f.RegisterStruct(Order{}, 2)

// 之后再并发使用
go func() {
    f.Serialize(&User{ID: 1})
}()
```

### 线程安全的注册

线程安全封装会对注册过程做同步保护：

```go
// 安全：注册操作内部已同步
f := threadsafe.New()
f.RegisterStruct(User{}, 1)
```

但从性能和可预测性出发，仍然建议在应用启动阶段一次性注册完所有类型，再开始并发读写。

## Zero-Copy 注意事项

### 非线程安全实例

默认 `Fory` 返回的字节切片只是内部缓冲区的视图：

```go
f := fory.New()

data1, _ := f.Serialize(value1)
// 此时 data1 有效

data2, _ := f.Serialize(value2)
// 现在 data1 已失效，因为底层 buffer 被复用了
```

### 线程安全实例

线程安全封装会自动复制返回数据：

```go
f := threadsafe.New()

data1, _ := f.Serialize(value1)
data2, _ := f.Serialize(value2)
// data1 和 data2 都仍然有效，它们是独立副本
```

这更安全，但会带来额外分配成本。

## 性能对比

| 场景 | 非线程安全实例 | 线程安全实例 |
| --- | --- | --- |
| 单 goroutine | 最快 | 较慢（有对象池开销） |
| 多 goroutine | 不安全 | 安全，扩展性较好 |
| 内存分配 | 最少 | 每次调用都会复制 |
| Buffer 复用 | 是 | 每个池内实例单独复用 |

### 基准测试

```go
func BenchmarkNonThreadSafe(b *testing.B) {
    f := fory.New()
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

## 常见模式

### 每个 goroutine 一个实例

如果 goroutine 数量已知、且追求极致性能，可以给每个 worker 一个独立实例：

```go
func worker(id int) {
    // 每个 worker 拥有自己的 Fory 实例
    f := fory.New()
    f.RegisterStruct(User{}, 1)

    for task := range tasks {
        data, _ := f.Serialize(task)
        process(data)
    }
}

// 启动 worker
for i := 0; i < numWorkers; i++ {
    go worker(i)
}
```

### 共享线程安全实例

如果 goroutine 数量动态变化，或更看重简洁性，可以共享一个线程安全实例：

```go
// 单个共享实例
var f = threadsafe.New()

func init() {
    f.RegisterStruct(User{}, 1)
}

func handleRequest(user *User) []byte {
    // 任意 goroutine 中都可安全调用
    data, _ := f.Serialize(user)
    return data
}
```

### HTTP Handler 示例

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

    // 安全：threadsafe.Fory 会处理并发访问
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
// 错误：会触发竞态
var f = fory.New()

func handler1() {
    f.Serialize(value1)
}

func handler2() {
    f.Serialize(value2)
}
```

修复方式：改用 `threadsafe.New()`，或者为每个 goroutine 准备独立实例。

### 持有内部缓冲区的引用

```go
// 错误：下一次调用后 buffer 就会失效
f := fory.New()
data, _ := f.Serialize(value1)
savedData := data // 这里只复制了 slice header

f.Serialize(value2) // 会让 data 和 savedData 同时失效
```

修复方式：手动复制数据，或者改用线程安全封装。

```go
// 正确：显式复制数据
data, _ := f.Serialize(value1)
savedData := make([]byte, len(data))
copy(savedData, data)

// 或者使用线程安全封装（自动复制）
f := threadsafe.New()
data, _ := f.Serialize(value1)
```

### 并发注册类型

```go
// 风险较高：注册与业务调用并发进行
go func() {
    f.RegisterStruct(TypeA{}, 1)
}()
go func() {
    f.Serialize(value) // 可能还看不到 TypeA
}()
```

修复方式：在并发使用之前完成全部类型注册。

## 最佳实践

1. 在应用启动时完成全部类型注册，再进入并发阶段。
2. 如果使用非线程安全实例且需要长期保留结果，务必手动复制返回字节。
3. 热路径可以考虑每个 worker 一个实例，避免对象池争用。
4. 先做性能分析，再决定是否需要从线程安全封装切换到更激进的方案。

## 相关主题

- [配置](configuration.md)
- [基础序列化](basic-serialization.md)
- [故障排查](troubleshooting.md)
