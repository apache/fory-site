---
title: Struct 标签
sidebar_position: 60
id: struct_tags
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

Fory Go 通过 struct tag 自定义字段级序列化行为，从而精细控制每个字段如何序列化。

## 标签语法

Fory struct tag 的通用格式如下：

```go
type MyStruct struct {
    Field Type `fory:"option1,option2=value"`
}
```

多个选项使用逗号（`,`）分隔。

## 可用标签

### 字段 ID

使用 `id=N` 为字段分配数值 ID，以获得更紧凑编码：

```go
type User struct {
    ID   int64  `fory:"id=0"`
    Name string `fory:"id=1"`
    Age  int32  `fory:"id=2"`
}
```

**收益：**

- 序列化体积更小（数值 ID 替代字段名）
- 序列化/反序列化更快
- 跨语言兼容场景下更推荐

**注意：**

- 同一 struct 内 ID 必须唯一
- ID 必须 `>= 0`
- 未指定时使用字段名（payload 更大）

### 忽略字段

使用 `-` 将字段排除在序列化之外：

```go
type User struct {
    ID       int64
    Name     string
    Password string `fory:"-"`  // Not serialized
}
```

`Password` 不会进入序列化结果，反序列化后将保持该类型零值。

### 可空控制

使用 `nullable` 控制是否为指针字段写入 null 标记：

```go
type Record struct {
    // Write null flag for this field (allows nil values)
    OptionalData *Data `fory:"nullable"`

    // Skip null flag (field must not be nil)
    RequiredData *Data `fory:"nullable=false"`
}
```

**注意：**

- 仅适用于指针、slice、map 字段
- `nullable=false` 时，序列化 nil 会报错
- 默认是 `false`（不写 null 标记）

### 引用跟踪

可为 slice、map、或“指向 struct 的指针字段”设置字段级引用跟踪：

```go
type Container struct {
    // Enable reference tracking for this field
    SharedData *Data `fory:"ref"`

    // Disable reference tracking for this field
    SimpleData *Data `fory:"ref=false"`
}
```

**注意：**

- 适用于 slice、map 与“指向 struct 的指针字段”
- 指向原生类型的指针（如 `*int`、`*string`）不能使用该标签
- 默认 `ref=false`（不开启引用跟踪）
- 全局 `WithTrackRef(false)` 时，字段级 ref 标签会被忽略
- 全局 `WithTrackRef(true)` 时，可用 `ref=false` 对单字段禁用

**适用场景：**

- 可能出现共享或循环引用的字段
- 可明确唯一的字段可禁用（性能优化）

### 编码控制

使用 `encoding` 控制数值字段编码方式：

```go
type Metrics struct {
    // Variable-length encoding (default, smaller for small values)
    Count int64 `fory:"encoding=varint"`

    // Fixed-length encoding (consistent size)
    Timestamp int64 `fory:"encoding=fixed"`

    // Tagged encoding (includes type tag)
    Value int64 `fory:"encoding=tagged"`
}
```

**支持编码：**

| 类型     | 可选值                      | 默认值   |
| -------- | --------------------------- | -------- |
| `int32`  | `varint`、`fixed`           | `varint` |
| `uint32` | `varint`、`fixed`           | `varint` |
| `int64`  | `varint`、`fixed`、`tagged` | `varint` |
| `uint64` | `varint`、`fixed`、`tagged` | `varint` |

**何时使用：**

- `varint`：适合小值居多（默认）
- `fixed`：适合接近全值域分布（如时间戳、哈希）
- `tagged`：适合需保留类型信息的场景

**int32/uint32 简写：**

对 int32/uint32 字段可使用 `compress` 作为便捷标签：

```go
type Data struct {
    SmallValue int32  `fory:"compress"`        // Same as encoding=varint (default)
    FixedValue uint32 `fory:"compress=false"`  // Same as encoding=fixed
}
```

## 组合标签

多个标签可使用逗号组合：

```go
type Document struct {
    ID      int64  `fory:"id=0,encoding=fixed"`
    Content string `fory:"id=1"`
    Author  *User  `fory:"id=2,ref"`
}
```

## 与其他标签共存

Fory 标签可与其他 struct tag 并存：

```go
type User struct {
    ID       int64  `json:"id" fory:"id=0"`
    Name     string `json:"name,omitempty" fory:"id=1"`
    Password string `json:"-" fory:"-"`
}
```

各标签命名空间互不影响。

## 字段可见性

仅处理**导出字段**（首字母大写）：

```go
type User struct {
    ID       int64  // Serialized
    Name     string // Serialized
    password string // NOT serialized (unexported, no tag needed)
}
```

未导出字段始终忽略，与是否配置 tag 无关。

## 字段顺序

字段会按稳定顺序序列化，依据：

1. 字段名（snake_case 字典序）
2. 字段类型

这可保证跨语言场景下的字段顺序一致性。

## Struct 哈希

Fory 会基于 struct 字段计算哈希用于版本校验：

- 哈希包含字段名与字段类型
- 哈希会写入序列化数据
- 不匹配会触发 `ErrKindHashMismatch`

结构字段变更会影响哈希：

```go
// These produce different hashes
type V1 struct {
    UserID int64
}

type V2 struct {
    UserId int64  // Different field name = different hash
}
```

## 示例

### API 响应结构

```go
type APIResponse struct {
    Status    int32  `json:"status" fory:"id=0"`
    Message   string `json:"message" fory:"id=1"`
    Data      any    `json:"data" fory:"id=2"`
    Internal  string `json:"-" fory:"-"`  // Ignored in both JSON and Fory
}
```

### 带共享引用的缓存结构

```go
type CacheEntry struct {
    Key       string
    Value     *CachedData `fory:"ref"`      // May be shared
    Metadata  *Metadata   `fory:"ref=false"` // Always unique
    ExpiresAt int64
}
```

### 带循环引用的文档结构

```go
type Document struct {
    ID       int64
    Title    string
    Parent   *Document   `fory:"ref"`  // May reference self or siblings
    Children []*Document `fory:"ref"`
}
```

## 标签解析错误

注册阶段若标签非法会报错：

```go
type BadStruct struct {
    Field int `fory:"invalid=option=format"`
}

f := fory.New()
err := f.RegisterStruct(BadStruct{}, 1)
// Error: ErrKindInvalidTag
```

## 最佳实践

1. **敏感字段使用 `-`**：如密码、令牌、内部状态
2. **共享对象启用 ref**：同一指针可能多次出现时开启
3. **简单唯一字段禁用 ref**：可做性能优化
4. **保持命名一致**：跨语言字段名应保持稳定
5. **记录标签意图**：非显式配置建议补充注释说明

## 常见模式

### 忽略计算字段

```go
type Rectangle struct {
    Width  float64
    Height float64
    Area   float64 `fory:"-"`  // Computed, don't serialize
}

func (r *Rectangle) ComputeArea() {
    r.Area = r.Width * r.Height
}
```

### 带父指针的循环结构

```go
type TreeNode struct {
    Value    string
    Parent   *TreeNode   `fory:"ref"`  // Circular back-reference
    Children []*TreeNode `fory:"ref"`
}
```

### 混合序列化需求

```go
type Session struct {
    ID        string
    UserID    int64
    Token     string    `fory:"-"`           // Security: don't serialize
    User      *User     `fory:"ref"`    // May be shared across sessions
    CreatedAt int64
}
```

## 相关主题

- [引用](references.md)
- [基础序列化](basic-serialization.md)
- [Schema 演进](schema-evolution.md)
