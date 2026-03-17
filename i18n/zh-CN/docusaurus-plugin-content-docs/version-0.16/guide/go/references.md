---
title: 引用处理
sidebar_position: 50
id: references
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

Fory Go 支持引用跟踪，可处理循环引用与共享对象。这对图结构、带父指针的树、存在环的链表等复杂对象图尤其重要。

## 启用引用跟踪

引用跟踪默认关闭。创建 `Fory` 实例时显式启用：

```go
f := fory.New(fory.WithTrackRef(true))
```

注意：只有全局开启 `WithTrackRef(true)` 之后，字段级 `ref` 标记才会生效。默认的 `WithTrackRef(false)` 会忽略所有字段级引用标记。

## 引用跟踪如何工作

### 不启用引用跟踪（默认）

关闭时，每个对象都会被独立序列化：

```go
f := fory.New() // 默认关闭 TrackRef

shared := &Data{Value: 42}
container := &Container{A: shared, B: shared}

data, _ := f.Serialize(container)
// shared 会被序列化两次，不做去重
```

### 启用引用跟踪

开启后，Fory 会按对象身份记录已经写出的对象：

```go
f := fory.New(fory.WithTrackRef(true))

shared := &Data{Value: 42}
container := &Container{A: shared, B: shared}

data, _ := f.Serialize(container)
// shared 只会写出一次，第二次出现时写入引用
```

## 引用标记

Fory 在序列化时通过标记值表达引用状态：

| 标记 | 值 | 含义 |
| --- | --- | --- |
| `NullFlag` | -3 | `nil` / null 值 |
| `RefFlag` | -2 | 指向已序列化对象的引用 |
| `NotNullValueFlag` | -1 | 非空值，后续紧跟实际数据 |
| `RefValueFlag` | 0 | 引用值标记 |

## 支持引用跟踪的类型

只有部分类型支持引用跟踪。在 xlang 模式下，以下类型可以参与引用跟踪：

| 类型 | 支持引用跟踪 | 说明 |
| --- | --- | --- |
| `*struct`（结构体指针） | 是 | 通过 `fory:"ref"` 开启 |
| `any`（接口） | 是 | 自动支持 |
| `[]T`（slice） | 是 | 通过 `fory:"ref"` 开启 |
| `map[K]V` | 是 | 通过 `fory:"ref"` 开启 |
| `*int`、`*string` 等 | 否 | 基础类型指针不支持 |
| 基础类型 | 否 | 值类型 |
| `time.Time`、`time.Duration` | 否 | 值类型 |
| 数组（`[N]T`） | 否 | 值类型 |

## 字段级引用控制

即使全局设置了 `WithTrackRef(true)`，字段默认仍然不做引用跟踪。可以通过结构体 tag 为特定字段启用：

```go
type Container struct {
    // 为该字段启用引用跟踪
    SharedData *Data `fory:"ref"`

    // 显式关闭引用跟踪，与默认行为一致
    SimpleData *Data `fory:"ref=false"`
}
```

要点如下：

- 字段级 tag 只有在全局开启 `WithTrackRef(true)` 时才会生效。
- 全局关闭时，所有字段级 `ref` 标记都会被忽略。
- 该能力适用于 slice、map 和结构体指针字段。
- 基础类型指针（如 `*int`、`*string`）不能使用该标记。
- 默认是 `ref=false`，也就是字段不做引用跟踪。

更多细节可参考 [Struct Tags](struct-tags.md)。

## 循环引用

处理循环数据结构时必须启用引用跟踪。

### 环形链表

```go
type Node struct {
    Value int32
    Next  *Node `fory:"ref"`
}

f := fory.New(fory.WithTrackRef(true))
f.RegisterStruct(Node{}, 1)

// 创建带环链表
n1 := &Node{Value: 1}
n2 := &Node{Value: 2}
n3 := &Node{Value: 3}
n1.Next = n2
n2.Next = n3
n3.Next = n1 // 回到 n1，形成循环引用

data, _ := f.Serialize(n1)

var result Node
f.Deserialize(data, &result)
// 循环结构会被保留
// result.Next.Next.Next == &result
```

### 父子树结构

```go
type TreeNode struct {
    Value    string
    Parent   *TreeNode   `fory:"ref"`
    Children []*TreeNode `fory:"ref"`
}

f := fory.New(fory.WithTrackRef(true))
f.RegisterStruct(TreeNode{}, 1)

root := &TreeNode{Value: "root"}
child1 := &TreeNode{Value: "child1", Parent: root}
child2 := &TreeNode{Value: "child2", Parent: root}
root.Children = []*TreeNode{child1, child2}

data, _ := f.Serialize(root)

var result TreeNode
f.Deserialize(data, &result)
// result.Children[0].Parent == &result
```

### 图结构

```go
type GraphNode struct {
    ID        int32
    Neighbors []*GraphNode `fory:"ref"`
}

f := fory.New(fory.WithTrackRef(true))
f.RegisterStruct(GraphNode{}, 1)

// 构造图
a := &GraphNode{ID: 1}
b := &GraphNode{ID: 2}
c := &GraphNode{ID: 3}

// 双向连接
a.Neighbors = []*GraphNode{b, c}
b.Neighbors = []*GraphNode{a, c}
c.Neighbors = []*GraphNode{a, b}

data, _ := f.Serialize(a)

var result GraphNode
f.Deserialize(data, &result)
```

## 共享对象去重

引用跟踪还可以对共享对象做去重：

```go
type Config struct {
    Setting string
}

type Application struct {
    MainConfig     *Config `fory:"ref"`
    BackupConfig   *Config `fory:"ref"`
    FallbackConfig *Config `fory:"ref"`
}

f := fory.New(fory.WithTrackRef(true))
f.RegisterStruct(Config{}, 1)
f.RegisterStruct(Application{}, 2)

// 共享配置对象
config := &Config{Setting: "value"}

// 多个字段引用同一个对象
app := &Application{
    MainConfig:     config,
    BackupConfig:   config,
    FallbackConfig: config,
}

data, _ := f.Serialize(app)
// config 只会被写出一次，其余位置写入引用

var result Application
f.Deserialize(data, &result)
// result.MainConfig == result.BackupConfig == result.FallbackConfig
```

## 性能考量

### 额外开销

引用跟踪会带来额外成本：

- 需要额外内存记录已见对象（通常是哈希表）
- 序列化时需要做对象查找
- 需要多写一些引用标记和引用 ID

### 何时开启

以下场景建议开启：

- 数据中存在循环引用
- 同一个对象会被多次引用
- 要序列化图结构
- 需要保留对象身份

以下场景建议关闭：

- 数据天然是树形结构，没有环
- 每个对象只出现一次
- 极端关注性能
- 不关心对象身份，只关心值

### 内存占用

引用跟踪内部会维护一个正在序列化对象的映射：

```go
// 内部引用跟踪结构
type RefResolver struct {
    writtenObjects map[refKey]int32 // 指针 -> 引用 ID
    readObjects    []reflect.Value  // 引用 ID -> 对象
}
```

当对象图很大时，这部分状态会增加内存使用。

## 错误处理

### 未启用引用跟踪

如果数据结构包含环，但没有启用引用跟踪，通常会触发栈溢出或最大深度错误：

```go
f := fory.New() // 未启用引用跟踪

n1 := &Node{Value: 1}
n1.Next = n1 // 自引用

data, err := f.Serialize(n1)
// 错误：max depth exceeded（或栈溢出）
```

### 非法引用 ID

反序列化阶段若遇到无效引用 ID，会返回错误：

```go
// 错误类型：ErrKindInvalidRefId
```

这通常说明序列化数据里出现了指向不存在对象的引用。

## 完整示例

```go
package main

import (
    "fmt"
    "github.com/apache/fory/go/fory"
)

type Person struct {
    Name       string
    Friends    []*Person `fory:"ref"`
    BestFriend *Person   `fory:"ref"`
}

func main() {
    f := fory.New(fory.WithTrackRef(true))
    f.RegisterStruct(Person{}, 1)

    // 构造互相引用的好友关系
    alice := &Person{Name: "Alice"}
    bob := &Person{Name: "Bob"}
    charlie := &Person{Name: "Charlie"}

    alice.Friends = []*Person{bob, charlie}
    alice.BestFriend = bob

    bob.Friends = []*Person{alice, charlie}
    bob.BestFriend = alice // 互为最好的朋友

    charlie.Friends = []*Person{alice, bob}

    // 序列化
    data, err := f.Serialize(alice)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Serialized %d bytes\n", len(data))

    // 反序列化
    var result Person
    if err := f.Deserialize(data, &result); err != nil {
        panic(err)
    }

    // 验证循环引用被保留
    fmt.Printf("Alice's best friend: %s\n", result.BestFriend.Name)
    fmt.Printf("Bob's best friend: %s\n", result.BestFriend.BestFriend.Name)
    // 输出：Alice（循环引用被保留）
}
```

## 相关主题

- [配置](configuration.md)
- [结构体标签](struct-tags.md)
- [跨语言序列化](cross-language.md)
