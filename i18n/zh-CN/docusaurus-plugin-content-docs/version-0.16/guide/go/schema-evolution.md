---
title: Schema 演进
sidebar_position: 70
id: schema_evolution
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

Schema 演进允许数据结构变化后仍然能与历史序列化数据兼容。Fory Go 通过兼容模式提供这一能力。

## 启用兼容模式

创建 `Fory` 实例时开启兼容模式：

```go
f := fory.New(fory.WithCompatible(true))
```

## 工作机制

### 不启用兼容模式（默认）

- 使用更紧凑的序列化格式，不写入额外元信息
- 反序列化时会校验结构体 hash
- 任何 Schema 变化都可能触发 `ErrKindHashMismatch`

### 启用兼容模式

- 会将类型元信息写入序列化结果
- 支持新增、删除、重排字段
- 同时支持前向和后向兼容

## 支持的 Schema 变更

### 新增字段

可以新增字段。旧数据反序列化到新结构体时，新字段会得到零值：

```go
// 版本 1
type UserV1 struct {
    ID   int64
    Name string
}

// 版本 2（新增 Email）
type UserV2 struct {
    ID    int64
    Name  string
    Email string // 新字段
}

f := fory.New(fory.WithCompatible(true))
f.RegisterStruct(UserV1{}, 1)

// 用 V1 序列化
userV1 := &UserV1{ID: 1, Name: "Alice"}
data, _ := f.Serialize(userV1)

// 用 V2 反序列化
f2 := fory.New(fory.WithCompatible(true))
f2.RegisterStruct(UserV2{}, 1)

var userV2 UserV2
f2.Deserialize(data, &userV2)
// userV2.Email == ""（零值）
```

### 删除字段

删除字段后，反序列化会自动跳过旧数据中对应的内容：

```go
// 版本 1
type ConfigV1 struct {
    Host    string
    Port    int32
    Timeout int64
    Debug   bool // 之后会被删除
}

// 版本 2（删除 Debug）
type ConfigV2 struct {
    Host    string
    Port    int32
    Timeout int64
    // Debug 字段已删除
}

f := fory.New(fory.WithCompatible(true))
f.RegisterStruct(ConfigV1{}, 1)

// 用 V1 序列化
config := &ConfigV1{Host: "localhost", Port: 8080, Timeout: 30, Debug: true}
data, _ := f.Serialize(config)

// 用 V2 反序列化
f2 := fory.New(fory.WithCompatible(true))
f2.RegisterStruct(ConfigV2{}, 1)

var configV2 ConfigV2
f2.Deserialize(data, &configV2)
// Debug 对应的数据会被跳过
```

### 字段重排

字段顺序可以在版本之间变化：

```go
// 版本 1
type PersonV1 struct {
    FirstName string
    LastName  string
    Age       int32
}

// 版本 2（字段顺序调整）
type PersonV2 struct {
    Age       int32  // 提前
    LastName  string
    FirstName string // 后移
}
```

兼容模式会按字段名匹配，因此这类变化可自动处理。

## 不兼容的变更

即使开启兼容模式，以下变化依然不受支持。

### 字段类型变化

```go
// 不支持
type V1 struct {
    Value int32
}

type V2 struct {
    Value string // 从 int32 改为 string，不兼容
}
```

### 字段重命名

```go
// 不支持，会被视为“删除旧字段 + 新增新字段”
type V1 struct {
    UserName string
}

type V2 struct {
    Username string // 名称不同，不会被当作重命名
}
```

这会被解释为删除 `UserName` 并新增 `Username`，因此旧数据无法自动迁移到新字段。

## 最佳实践

### 1. 持久化数据默认开启兼容模式

```go
// 用于数据库、文件、缓存等持久化场景
f := fory.New(fory.WithCompatible(true))
```

### 2. 为新增字段提供默认值

```go
type ConfigV2 struct {
    Host    string
    Port    int32
    Timeout int64
    Retries int32 // 新字段
}

func NewConfigV2() *ConfigV2 {
    return &ConfigV2{
        Retries: 3, // 默认值
    }
}

// 反序列化后补齐默认值
if config.Retries == 0 {
    config.Retries = 3
}
```

## 跨语言 Schema 演进

Schema 演进同样适用于跨语言场景。

### Go（生产者）

```go
type MessageV1 struct {
    ID      int64
    Content string
}

f := fory.New(fory.WithCompatible(true))
f.RegisterStruct(MessageV1{}, 1)
data, _ := f.Serialize(&MessageV1{ID: 1, Content: "Hello"})
```

### Java（使用更新 Schema 的消费者）

```java
public class Message {
    long id;
    String content;
    String author; // Java 侧新增字段
}

Fory fory = Fory.builder()
    .withXlang(true)
    .withCompatibleMode(true)
    .build();
fory.register(Message.class, 1);
Message msg = fory.deserialize(data, Message.class);
// msg.author 会是 null
```

## 性能考量

兼容模式主要影响序列化后的体积：

| 方面 | Schema 一致模式 | 兼容模式 |
| --- | --- | --- |
| 序列化大小 | 更小 | 更大（会携带元信息，未使用字段 ID 时尤其明显） |
| 速度 | 很快 | 接近一致（元信息处理基本是 memcpy） |
| Schema 灵活性 | 无 | 完整支持 |

注意：使用字段 ID（`fory:"id=N"`）可以显著降低兼容模式下的元信息开销。

建议在以下场景使用兼容模式：

- 持久化存储
- 服务间通信
- 生命周期较长的缓存

以下场景可以继续使用 Schema 一致模式：

- 纯内存内操作
- 同版本之间的通信
- 追求最小序列化体积

## 错误处理

### Hash 不匹配（Schema 一致模式）

```go
f := fory.New() // 兼容模式关闭

// Schema 已变化，但仍用一致模式读取旧数据
err := f.Deserialize(oldData, &newStruct)
// 错误：ErrKindHashMismatch
```

### 未知字段

在兼容模式下，未知字段会被自动跳过。如果你想检测它们：

```go
// 当前 Fory 会自动跳过未知字段
// 暂无显式 API 用于枚举这些字段
```

## 完整示例

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

// V1：初始 Schema
type ProductV1 struct {
    ID    int64
    Name  string
    Price float64
}

// V2：新增字段
type ProductV2 struct {
    ID          int64
    Name        string
    Price       float64
    Description string // 新增
    InStock     bool   // 新增
}

func main() {
    // 用 V1 序列化
    f1 := fory.New(fory.WithCompatible(true))
    f1.RegisterStruct(ProductV1{}, 1)

    product := &ProductV1{ID: 1, Name: "Widget", Price: 9.99}
    data, _ := f1.Serialize(product)
    fmt.Printf("V1 serialized: %d bytes\n", len(data))

    // 用 V2 反序列化
    f2 := fory.New(fory.WithCompatible(true))
    f2.RegisterStruct(ProductV2{}, 1)

    var productV2 ProductV2
    if err := f2.Deserialize(data, &productV2); err != nil {
        panic(err)
    }

    fmt.Printf("ID: %d\n", productV2.ID)
    fmt.Printf("Name: %s\n", productV2.Name)
    fmt.Printf("Price: %.2f\n", productV2.Price)
    fmt.Printf("Description: %q（零值）\n", productV2.Description)
    fmt.Printf("InStock: %v（零值）\n", productV2.InStock)
}
```

## 相关主题

- [配置](configuration.md)
- [跨语言序列化](cross-language.md)
- [故障排查](troubleshooting.md)
