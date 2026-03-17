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

:::warning 实验性特性
代码生成在 Fory Go 中仍属于**实验性**能力。未来版本中，API 和行为都可能发生变化。对于大多数场景，基于反射的路径仍然是更稳定、也更推荐的方案。
:::

Fory Go 为性能敏感路径提供可选的 AOT 代码生成能力，可以消除反射开销，并提升编译期类型安全。

## 为什么使用代码生成

| 维度 | 基于反射 | 代码生成 |
| --- | --- | --- |
| 接入成本 | 零配置 | 需要 `go generate` |
| 性能 | 较好 | 更好（无反射） |
| 类型安全 | 运行时 | 编译期 |
| 维护成本 | 自动 | 需要重新生成 |

适合使用代码生成的场景：

- 需要极致性能
- 希望在编译期获得更强的类型校验
- 热路径对延迟非常敏感

适合继续使用反射的场景：

- 更看重简单接入
- 类型经常变化
- 需要动态类型能力
- 不希望增加代码生成链路

## 安装

安装 `fory` 代码生成器：

```bash
go install github.com/apache/fory/go/fory/cmd/fory@latest

GO111MODULE=on go get -u github.com/apache/fory/go/fory/cmd/fory
```

确保 `$GOBIN` 或 `$GOPATH/bin` 已加入 `PATH`。

## 基本用法

### 步骤 1：标注结构体

在需要生成序列化器的结构体上方添加 `//fory:generate` 注释：

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

### 步骤 2：添加 `go generate` 指令

为文件或包添加 `go:generate` 指令：

```go
//go:generate fory -file models.go
```

如果希望对整个包生成：

```go
//go:generate fory -pkg .
```

### 步骤 3：运行代码生成

```bash
go generate ./...
```

执行后会生成 `models_fory_gen.go`，其中包含对应的序列化器实现。

## 生成代码的结构

生成器通常会产出以下内容。

### 类型快照

用于在编译期检测结构体定义是否已变更：

```go
// 生成时的 User 类型快照
type _User_expected struct {
    ID   int64
    Name string
}

// 编译期校验：如果 User 结构已变化，这里会报错
var _ = func(x User) { _ = _User_expected(x) }
```

### 序列化器实现

使用强类型方法直接读写字段：

```go
type User_ForyGenSerializer struct{}

func (User_ForyGenSerializer) WriteTyped(f *fory.Fory, buf *fory.ByteBuffer, v *User) error {
    buf.WriteInt64(v.ID)
    fory.WriteString(buf, v.Name)
    return nil
}

func (User_ForyGenSerializer) ReadTyped(f *fory.Fory, buf *fory.ByteBuffer, v *User) error {
    v.ID = buf.ReadInt64()
    v.Name = fory.ReadString(buf)
    return nil
}
```

### 自动注册

生成代码会在 `init()` 中自动注册序列化器：

```go
func init() {
    fory.RegisterGenSerializer(User{}, User_ForyGenSerializer{})
}
```

## 命令行选项

### 按文件生成

```bash
fory -file models.go
```

### 按包生成

```bash
fory -pkg ./models
```

### 显式指定类型（旧用法）

```bash
fory -pkg ./models -type "User,Order"
```

### 强制重新生成

```bash
fory --force -file models.go
```

## 何时需要重新生成

出现以下任一变化时，都应重新生成：

- 字段新增、删除或重命名
- 字段类型变化
- 结构体 tag 变化
- 新增带 `//fory:generate` 的结构体

### 自动检测

Fory 内置了编译期保护：

```go
// 如果结构体定义变了，这里会在编译时报错
var _ = func(x User) { _ = _User_expected(x) }
```

如果忘了重新生成，构建会给出明确错误信息。

### 自动重试

当通过 `go generate` 调用时，生成器会在发现产物过期后自动重试：

1. 先通过编译期保护检测到错误
2. 删除陈旧的生成文件
3. 重新生成最新代码

## 支持的类型

代码生成当前支持：

- 所有基础类型（`bool`、`int*`、`uint*`、`float*`、`string`）
- 基础类型和结构体的 slice
- 键值类型受支持的 map
- 嵌套结构体（嵌套结构体本身也需要生成）
- 指向结构体的指针

### 嵌套结构体

所有嵌套结构体也必须带上 `//fory:generate`：

```go
//fory:generate
type Address struct {
    City    string
    Country string
}

//fory:generate
type Person struct {
    Name    string
    Address Address // Address 也必须生成
}
```

## CI/CD 集成

### 提交生成代码

**更适合类库项目**：

```bash
go generate ./...
git add *_fory_gen.go
git commit -m "Regenerate Fory serializers"
```

优点：使用方无需安装生成器即可构建，且构建结果更可复现。  
缺点：diff 会更大，而且需要记得在结构体变更后重新生成。

### 在流水线中生成

**更适合应用项目**：

```yaml
steps:
  - run: go install github.com/apache/fory/go/fory/cmd/fory@latest
  - run: go generate ./...
  - run: go build ./...
```

## 使用生成代码

生成代码会自动接入运行时，无需额外改业务代码：

```go
f := fory.New()

// 如果存在生成序列化器，Fory 会自动使用
user := &User{ID: 1, Name: "Alice"}
data, _ := f.Serialize(user)

var result User
f.Deserialize(data, &result)
```

不需要手动注册，生成代码会在 `init()` 中自动完成。

## 混用生成与非生成类型

两种方式可以混用：

```go
//fory:generate
type HotPathStruct struct {
    // 热路径结构体，适合使用代码生成
}

type ColdPathStruct struct {
    // 未标注，继续走反射路径
}
```

## 限制

### 实验性状态

- API 仍可能变化
- 还没有覆盖全部边界情况
- 可能仍存在未发现的问题

### 暂不支持

- 接口字段（动态类型）
- 无指针的递归类型
- 私有（未导出）字段
- 自定义序列化器

### 反射回退

如果找不到生成序列化器，Fory 会自动回退到反射路径：

```go
// 如果没有找到 User_ForyGenSerializer，就会走反射
f.Serialize(&User{})
```

## 故障排查

### `"fory: command not found"` 报错

确认生成器二进制已在 `PATH` 中：

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

### 结构体变化后编译报错

重新生成：

```bash
go generate ./...
```

必要时也可以强制生成：

```bash
fory --force -file yourfile.go
```

### 生成代码不同步

编译期保护通常会给出类似错误：

```text
cannot use x (variable of type User) as type _User_expected in argument
```

执行 `go generate` 后即可修复。

## 示例项目结构

```text
myproject/
├── models/
│   ├── models.go           # 结构体定义
│   ├── models_fory_gen.go  # 生成代码
│   └── generate.go         # go:generate 指令
├── main.go
└── go.mod
```

**`models/generate.go` 示例**：

```go
package models

//go:generate fory -pkg .
```

**`models/models.go` 示例**：

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

不是。即使完全不使用代码生成，基于反射的序列化也能正常工作。

### 生成代码能跨 Go 版本工作吗？

可以。生成产物就是普通 Go 代码，不依赖特定版本特性。

### 生成类型和非生成类型可以混用吗？

可以。只要生成序列化器存在，Fory 就会自动优先使用。

### 如何更新生成代码？

在结构体变化后执行 `go generate ./...`。

### 生成文件应该提交到仓库吗？

类库项目建议提交；应用项目两种做法都可以。

## 相关主题

- [基础序列化](basic-serialization.md)
- [配置](configuration.md)
- [故障排查](troubleshooting.md)
