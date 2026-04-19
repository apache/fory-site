---
title: 代码生成
sidebar_position: 90
id: codegen
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

:::warning Experimental Feature
代码生成是 Fory Go 中的**实验性**特性。其 API 和行为可能会在后续版本中发生变化。标准运行时路径仍是大多数场景下稳定且推荐的做法。
:::

Fory Go 为性能关键路径提供可选的 AOT 代码生成。它会提前生成专用序列化器，并增加编译期 shape 校验。

## 为什么使用代码生成？

| 方面     | 标准路径         | 代码生成               |
| -------- | ---------------- | ---------------------- |
| 接入成本 | 零配置           | 需要 `go generate`     |
| 性能     | 已经很优秀       | 热路径上更快           |
| 类型安全 | 运行时校验       | 编译期校验             |
| 维护成本 | 自动完成         | 需要重新生成           |

**适合使用代码生成的场景：**

- 需要极致性能
- 很看重编译期类型安全
- 热路径对性能非常敏感

**适合继续使用标准路径的场景：**

- 更偏好简单接入
- 类型经常变化
- 需要动态类型
- 不希望引入代码生成复杂度

## 安装

安装 `fory` 生成器二进制：

```bash
go install github.com/apache/fory/go/fory/cmd/fory@latest

GO111MODULE=on go get -u github.com/apache/fory/go/fory/cmd/fory
```

确保 `$GOBIN` 或 `$GOPATH/bin` 已加入 `PATH`。

## 基本用法

### 步骤 1：标注结构体

在结构体上方添加 `//fory:generate` 注释：

```go
package models

//fory:generate
type User struct {
    ID   int64  `json:"id"`
    Name string `json:"name"`
}

//fory:generate
type Order struct {
    ID       int64
    Customer string
    Total    float64
}
```

### 步骤 2：添加 Go Generate 指令

添加 `go:generate` 指令（每个文件或每个包一次即可）：

```go
//go:generate fory -file models.go
```

或者针对整个包：

```go
//go:generate fory -pkg .
```

### 步骤 3：执行代码生成

```bash
go generate ./...
```

这会生成包含序列化器代码的 `models_fory_gen.go` 文件。

## 生成代码的结构

生成器会输出以下内容：

### 类型快照

用于检测结构体变化的编译期检查：

```go
// Snapshot of User's underlying type at generation time
type _User_expected struct {
    ID   int64
    Name string
}

// Compile-time check: fails if User no longer matches
var _ = func(x User) { _ = _User_expected(x) }
```

### 序列化器实现

强类型的序列化方法：

```go
type User_ForyGenSerializer struct{}

func NewSerializerFor_User() fory.Serializer {
    return &User_ForyGenSerializer{}
}

func (User_ForyGenSerializer) WriteTyped(ctx *fory.WriteContext, v *User) error {
    buf := ctx.Buffer()
    buf.WriteInt64(v.ID)
    ctx.WriteString(v.Name)
    return nil
}

func (User_ForyGenSerializer) ReadTyped(ctx *fory.ReadContext, v *User) error {
    err := ctx.Err()
    buf := ctx.Buffer()
    v.ID = buf.ReadInt64(err)
    v.Name = ctx.ReadString()
    if ctx.HasError() {
        return ctx.TakeError()
    }
    return nil
}
```

### 自动注册

序列化器会在 `init()` 中注册：

```go
func init() {
    fory.RegisterSerializerFactory((*User)(nil), NewSerializerFor_User)
}
```

## 命令行选项

### 按文件生成

为某个文件生成：

```bash
fory -file models.go
```

### 按包生成

为整个包生成：

```bash
fory -pkg ./models
```

### 显式指定类型（旧用法）

显式指定类型：

```bash
fory -pkg ./models -type "User,Order"
```

### 强制重新生成

即使看起来已经是最新，也强制重新生成：

```bash
fory --force -file models.go
```

## 何时需要重新生成

出现以下任意变化时，都应重新生成：

- 字段新增、删除或重命名
- 字段类型变化
- 结构体 tag 变化
- 新增带 `//fory:generate` 的结构体

### 自动检测

Fory 内置了编译期守卫：

```go
// If struct changed, this fails to compile
var _ = func(x User) { _ = _User_expected(x) }
```

如果忘记重新生成，构建会失败，并给出明确提示。

### 自动重试

当通过 `go generate` 调用时，生成器会检测陈旧代码并自动重试：

1. 发现守卫触发的编译错误
2. 删除旧的生成文件
3. 重新生成最新代码

## 支持的类型

代码生成支持：

- 所有原始类型（`bool`、`int*`、`uint*`、`float*`、`string`）
- 原始类型和结构体的 slice
- 键和值类型受支持的 map
- 嵌套结构体（这些结构体也必须生成）
- 指向结构体的指针

### 嵌套结构体

所有嵌套结构体也必须带有 `//fory:generate`：

```go
//fory:generate
type Address struct {
    City    string
    Country string
}

//fory:generate
type Person struct {
    Name    string
    Address Address  // Address must also be generated
}
```

## CI/CD 集成

### 提交生成代码

**推荐用于库项目：**

```bash
go generate ./...
git add *_fory_gen.go
git commit -m "Regenerate Fory serializers"
```

**优点**：使用者无需安装生成器即可构建；构建更可复现  
**缺点**：diff 更大；需要记得重新生成

### 在流水线中生成

**推荐用于应用项目：**

```yaml
steps:
  - run: go install github.com/apache/fory/go/fory/cmd/fory@latest
  - run: go generate ./...
  - run: go build ./...
```

## 与生成代码配合使用

生成代码可以透明接入：

```go
f := fory.New()

// Fory automatically uses generated serializer if available
user := &User{ID: 1, Name: "Alice"}
data, _ := f.Serialize(user)

var result User
f.Deserialize(data, &result)
```

无需修改业务代码，注册会在 `init()` 中自动完成。

## 混用生成与非生成方式

你可以混合使用两种方式：

```go
//fory:generate
type HotPathStruct struct {
    // Performance-critical, use codegen
}

type ColdPathStruct struct {
    // Not annotated, uses the standard runtime serializer
}
```

## 限制

### 实验性状态

- API 可能变化
- 尚未覆盖所有边界场景
- 可能仍有未发现的缺陷

### 暂不支持

- 接口字段（动态类型）
- 无指针的递归类型
- 私有（未导出）字段
- 自定义序列化器

### 标准路径回退

如果生成的序列化器不可用，Fory 会自动回退到标准序列化路径：

```go
// If User_ForyGenSerializer is not linked in, Fory uses the standard path
f.Serialize(&User{})
```

## 故障排查

### `"fory: command not found"`

确保二进制已经加入 `PATH`：

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

### 结构体变更后出现编译错误

重新生成：

```bash
go generate ./...
```

或强制重新生成：

```bash
fory --force -file yourfile.go
```

### 生成代码不同步

编译期守卫会捕获这种情况：

```
cannot use x (variable of type User) as type _User_expected in argument
```

运行 `go generate` 即可修复。

## 示例项目结构

```
myproject/
├── models/
│   ├── models.go           # Struct definitions
│   ├── models_fory_gen.go  # Generated code
│   └── generate.go         # go:generate directive
├── main.go
└── go.mod
```

**models/generate.go**：

```go
package models

//go:generate fory -pkg .
```

**models/models.go**：

```go
package models

//fory:generate
type User struct {
    ID   int64
    Name string
}
```

## FAQ

### 代码生成是必须的吗？

不是。标准序列化路径在不使用代码生成时也能正常工作。

### 生成代码能跨 Go 版本使用吗？

可以。生成代码就是普通 Go 代码，不依赖某个特定版本的语言特性。

### 可以混用生成和非生成类型吗？

可以。只要生成的序列化器可用，Fory 会自动优先使用它。

### 如何更新生成代码？

结构体变更后运行 `go generate ./...`。

### 应该提交生成文件吗？

对于库项目：建议提交。对于应用项目：两种做法都可以。

## 相关主题

- [基础序列化](basic-serialization.md)
- [配置](configuration.md)
- [故障排查](troubleshooting.md)
