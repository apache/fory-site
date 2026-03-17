---
title: 故障排查
sidebar_position: 110
id: troubleshooting
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

本指南汇总使用 Fory Go 时的常见问题与解决方案。

## 错误类型

Fory Go 使用带错误种类的强类型错误：

```go
type Error struct {
    kind    ErrorKind
    message string
    // 额外上下文字段
}

func (e Error) Kind() ErrorKind { return e.kind }
func (e Error) Error() string   { return e.message }
```

### 错误种类

| Kind | 值 | 说明 |
| --- | --- | --- |
| `ErrKindOK` | 0 | 无错误 |
| `ErrKindBufferOutOfBound` | 1 | 读写越过缓冲区边界 |
| `ErrKindTypeMismatch` | 2 | Type ID 不匹配 |
| `ErrKindUnknownType` | 3 | 遇到未知类型 |
| `ErrKindSerializationFailed` | 4 | 通用序列化失败 |
| `ErrKindDeserializationFailed` | 5 | 通用反序列化失败 |
| `ErrKindMaxDepthExceeded` | 6 | 递归深度超过限制 |
| `ErrKindNilPointer` | 7 | 意外的空指针 |
| `ErrKindInvalidRefId` | 8 | 非法引用 ID |
| `ErrKindHashMismatch` | 9 | 结构体 hash 不匹配 |
| `ErrKindInvalidTag` | 10 | 非法 `fory` 结构体 tag |

## 常见错误与解决方案

### `ErrKindUnknownType`：未知类型

**错误**：`unknown type encountered`

**原因**：序列化或反序列化前未注册类型。

**解决方式**：

```go
f := fory.New()

// 使用前先注册类型
f.RegisterStruct(User{}, 1)

// 之后即可正常序列化
data, _ := f.Serialize(&User{ID: 1})
```

### `ErrKindTypeMismatch`：类型不匹配

**错误**：`type mismatch: expected X, got Y`

**原因**：序列化数据中的类型与接收端期望的类型不一致。

**解决方式**：

1. 使用正确的目标类型：

```go
// 错误：把 User 数据反序列化到 Order
var order Order
f.Deserialize(userData, &order)

// 正确
var user User
f.Deserialize(userData, &user)
```

2. 保证注册信息一致：

```go
// 序列化端
f1 := fory.New()
f1.RegisterStruct(User{}, 1)

// 反序列化端，必须使用相同 ID
f2 := fory.New()
f2.RegisterStruct(User{}, 1)
```

### `ErrKindHashMismatch`：结构体 hash 不匹配

**错误**：`hash X is not consistent with Y for type Z`

**原因**：序列化端和反序列化端使用的结构体定义不一致。

**解决方式**：

1. 开启兼容模式：

```go
f := fory.New(fory.WithCompatible(true))
```

2. 确保结构体定义一致：

```go
// 两端必须使用相同结构体定义
type User struct {
    ID   int64
    Name string
}
```

3. 如果使用代码生成，重新生成产物：

```bash
go generate ./...
```

### `ErrKindMaxDepthExceeded`：超过最大深度

**错误**：`max depth exceeded`

**原因**：数据嵌套层级超过了最大深度限制。

**常见成因**：

- 深层嵌套数据超过默认限制（20）
- 未开启引用跟踪时意外出现循环引用
- **恶意数据**：攻击者可能构造极深嵌套载荷，导致资源耗尽

**解决方式**：

1. 提高最大深度限制（默认值为 20）：

```go
f := fory.New(fory.WithMaxDepth(50))
```

2. 对循环数据启用引用跟踪：

```go
f := fory.New(fory.WithTrackRef(true))
```

3. 检查数据中是否存在意外循环引用。

4. 处理不可信输入时不要盲目调大深度限制，应先校验输入大小与结构。

### `ErrKindBufferOutOfBound`：缓冲区越界

**错误**：`buffer out of bound: offset=X, need=Y, size=Z`

**原因**：读取超出了现有数据长度。

**解决方式**：

1. 确保传输的是完整数据：

```go
// 错误：数据被截断
data := fullData[:100]
f.Deserialize(data, &target)

// 正确：使用完整数据
f.Deserialize(fullData, &target)
```

2. 检查传输过程中是否出现数据损坏。

### `ErrKindInvalidRefId`：非法引用 ID

**错误**：`invalid reference ID`

**原因**：序列化数据中引用了不存在或未知的对象。

**解决方式**：

1. 确保序列化端与反序列化端的引用跟踪配置一致：

```go
f1 := fory.New(fory.WithTrackRef(true))
f2 := fory.New(fory.WithTrackRef(true)) // 必须一致
```

2. 检查数据是否损坏。

### `ErrKindInvalidTag`：非法 struct tag

**错误**：`invalid fory struct tag`

**原因**：结构体 tag 配置非法。

**常见成因**：

1. 非法 tag ID：ID 必须大于等于 `-1`

```go
// 错误：非法负数 ID（-1 以外）
type Bad struct {
    Field int `fory:"id=-5"`
}

// 正确
type Good struct {
    Field int `fory:"id=0"`
}
```

2. 重复 tag ID：同一结构体中的字段 ID 必须唯一

```go
// 错误：ID 冲突
type Bad struct {
    Field1 int `fory:"id=0"`
    Field2 int `fory:"id=0"`
}

// 正确
type Good struct {
    Field1 int `fory:"id=0"`
    Field2 int `fory:"id=1"`
}
```

## 跨语言问题

### 字段顺序不一致

**现象**：能够反序列化，但字段值落到了错误的位置。

**原因**：不同语言的字段排序规则不一致。非兼容模式下，字段会按 snake_case 名称排序。比如 `FirstName` 会先转换为 `first_name` 再参与排序。

**解决方式**：

1. 确保转换后的 snake_case 名称一致：

```go
type User struct {
    FirstName string // Go: FirstName -> first_name
    LastName  string // Go: LastName -> last_name
    // 最终按 snake_case 的字典序排序：first_name, last_name
}
```

2. 使用字段 ID 保证顺序一致。字段 ID（非负整数）会同时参与排序和反序列化匹配：

```go
type User struct {
    FirstName string `fory:"id=0"`
    LastName  string `fory:"id=1"`
}
```

对应字段在所有语言里都应使用相同的字段 ID。

### 名称注册不一致

**现象**：其他语言反序列化时报 `unknown type`。

**解决方式**：保证注册名称完全一致：

```go
// Go
f.RegisterNamedStruct(User{}, "example.User")

// Java，必须完全一致
fory.register(User.class, "example.User");

// Python
fory.register(User, typename="example.User")
```

## 性能问题

### 序列化速度慢

**可能原因**：

1. 对象图太大：减少数据规模或改为增量序列化。
2. 引用跟踪过多：如果不需要，可以关闭。

```go
f := fory.New(fory.WithTrackRef(false))
```

3. 嵌套过深：尽量压平数据结构。

### 内存占用高

**可能原因**：

1. 单次序列化数据过大：改为分块处理。
2. 引用跟踪有额外开销：若不需要可关闭。
3. Buffer 没有被复用：可手动复用缓冲区。

```go
buf := fory.NewByteBuffer(nil)
f.SerializeTo(buf, value)
// 处理数据
buf.Reset() // 为下一次序列化复用
```

### 线程争用

**现象**：并发压力下出现明显变慢。

**解决方式**：

1. 热路径使用每 goroutine 一个实例：

```go
func worker() {
    f := fory.New() // 每个 worker 自己持有实例
    for task := range tasks {
        f.Serialize(task)
    }
}
```

2. 配合线程安全封装做性能分析，观察对象池使用情况。

## 调试技巧

### 启用调试输出

设置环境变量：

```bash
ENABLE_FORY_DEBUG_OUTPUT=1 go test ./...
```

### 检查序列化结果

```go
data, _ := f.Serialize(value)
fmt.Printf("Serialized %d bytes\n", len(data))
fmt.Printf("Header: %x\n", data[:4]) // Magic + flags
```

### 检查类型注册

```go
// 验证类型是否注册成功
f := fory.New()
err := f.RegisterStruct(User{}, 1)
if err != nil {
    fmt.Printf("Registration failed: %v\n", err)
}
```

### 对比结构体 hash

如果遇到 hash mismatch，可以先打印结构体定义做对比：

```go
// 打印结构体字段信息用于调试
t := reflect.TypeOf(User{})
for i := 0; i < t.NumField(); i++ {
    f := t.Field(i)
    fmt.Printf("Field: %s, Type: %s\n", f.Name, f.Type)
}
```

## 测试建议

### 往返测试

```go
func TestRoundTrip(t *testing.T) {
    f := fory.New()
    f.RegisterStruct(User{}, 1)

    original := &User{ID: 1, Name: "Alice"}

    data, err := f.Serialize(original)
    require.NoError(t, err)

    var result User
    err = f.Deserialize(data, &result)
    require.NoError(t, err)

    assert.Equal(t, original.ID, result.ID)
    assert.Equal(t, original.Name, result.Name)
}
```

### 跨语言测试

```bash
cd java/fory-core
FORY_GO_JAVA_CI=1 mvn test -Dtest=org.apache.fory.xlang.GoXlangTest
```

### Schema 演进测试

```go
func TestSchemaEvolution(t *testing.T) {
    f1 := fory.New(fory.WithCompatible(true))
    f1.RegisterStruct(UserV1{}, 1)

    data, _ := f1.Serialize(&UserV1{ID: 1, Name: "Alice"})

    f2 := fory.New(fory.WithCompatible(true))
    f2.RegisterStruct(UserV2{}, 1)

    var result UserV2
    err := f2.Deserialize(data, &result)
    require.NoError(t, err)
}
```

## 获取帮助

如果问题不在本文覆盖范围内：

1. 先查看 [GitHub Issues](https://github.com/apache/fory/issues)。
2. 开启调试输出：`ENABLE_FORY_DEBUG_OUTPUT=1`。
3. 尽量构造最小复现用例。
4. 提交 issue 时附带 Go 版本、Fory 版本和最小复现代码。

## 相关主题

- [配置](configuration.md)
- [跨语言序列化](cross-language.md)
- [Schema 演进](schema-evolution.md)
- [线程安全](thread-safety.md)
