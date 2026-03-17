---
title: 自定义序列化器
sidebar_position: 35
id: custom_serializers
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

自定义序列化器允许你精确控制类型的序列化与反序列化过程。这非常适合需要特殊处理、额外优化或跨语言兼容的类型。

## 何时使用自定义序列化器

- **特殊编码格式**：类型需要固定或定制的二进制格式
- **第三方类型**：类型来自外部库，Fory 无法自动处理
- **性能优化**：你能比默认的反射方案实现更高效的编码
- **跨语言兼容**：你需要精确控制二进制布局来保证互操作

## `ExtensionSerializer` 接口

自定义序列化器需要实现 `ExtensionSerializer` 接口：

```go
type ExtensionSerializer interface {
    // WriteData 将值写入缓冲区。
    // 这里只负责写入数据本身，类型信息和引用由 Fory 处理。
    // 使用 ctx.Buffer() 获取 ByteBuffer。
    // 使用 ctx.SetError() 报告错误。
    WriteData(ctx *WriteContext, value reflect.Value)

    // ReadData 从缓冲区读取值并写入到提供的目标中。
    // 这里只负责读取数据本身，类型信息和引用由 Fory 处理。
    // 使用 ctx.Buffer() 获取 ByteBuffer。
    // 使用 ctx.SetError() 报告错误。
    ReadData(ctx *ReadContext, value reflect.Value)
}
```

## 基础示例

下面是一个仅包含整数字段的简单自定义序列化器：

```go
import (
    "reflect"
    "github.com/apache/fory/go/fory"
)

type MyExt struct {
    Id int32
}

type MyExtSerializer struct{}

func (s *MyExtSerializer) WriteData(ctx *fory.WriteContext, value reflect.Value) {
    myExt := value.Interface().(MyExt)
    ctx.Buffer().WriteVarint32(myExt.Id)
}

func (s *MyExtSerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    id := ctx.Buffer().ReadVarint32(ctx.Err())
    value.Set(reflect.ValueOf(MyExt{Id: id}))
}

// 注册自定义序列化器
f := fory.New()
err := f.RegisterExtension(MyExt{}, 100, &MyExtSerializer{})
```

## Context 方法

`WriteContext` 和 `ReadContext` 提供了访问序列化资源的能力：

| 方法 | 说明 |
| --- | --- |
| `Buffer()` | 返回用于读写的 `*ByteBuffer` |
| `Err()` | 返回 `*Error`，用于延迟错误检查 |
| `SetError(err)` | 在上下文中记录错误 |
| `HasError()` | 判断上下文中是否已记录错误 |
| `TypeResolver()` | 返回嵌套类型使用的类型解析器 |
| `RefResolver()` | 返回引用跟踪使用的解析器 |

## ByteBuffer 方法

`ByteBuffer` 提供了一组读取和写入原始类型的方法。

### 写入方法

| 方法 | 说明 |
| --- | --- |
| `WriteBool(v bool)` | 写入布尔值 |
| `WriteInt8(v int8)` | 写入有符号 8 位整数 |
| `WriteInt16(v int16)` | 写入有符号 16 位整数 |
| `WriteInt32(v int32)` | 写入有符号 32 位整数 |
| `WriteInt64(v int64)` | 写入有符号 64 位整数 |
| `WriteFloat32(v float32)` | 写入 32 位浮点数 |
| `WriteFloat64(v float64)` | 写入 64 位浮点数 |
| `WriteVarint32(v int32)` | 写入变长有符号 32 位整数 |
| `WriteVarint64(v int64)` | 写入变长有符号 64 位整数 |
| `WriteBinary(data []byte)` | 写入原始字节 |

### 读取方法

所有读取方法都接收一个 `*Error` 参数，用于延迟错误检查：

| 方法 | 说明 |
| --- | --- |
| `ReadBool(err *Error) bool` | 读取布尔值 |
| `ReadInt8(err *Error) int8` | 读取有符号 8 位整数 |
| `ReadInt16(err *Error) int16` | 读取有符号 16 位整数 |
| `ReadInt32(err *Error) int32` | 读取有符号 32 位整数 |
| `ReadInt64(err *Error) int64` | 读取有符号 64 位整数 |
| `ReadFloat32(err *Error) float32` | 读取 32 位浮点数 |
| `ReadFloat64(err *Error) float64` | 读取 64 位浮点数 |
| `ReadVarint32(err *Error) int32` | 读取变长有符号 32 位整数 |
| `ReadVarint64(err *Error) int64` | 读取变长有符号 64 位整数 |
| `ReadBinary(length int, err *Error) []byte` | 读取指定长度的原始字节 |

## 复杂类型示例

下面展示一个包含多个字段的自定义序列化器：

```go
type Point3D struct {
    X, Y, Z float64
    Label   string
}

type Point3DSerializer struct{}

func (s *Point3DSerializer) WriteData(ctx *fory.WriteContext, value reflect.Value) {
    p := value.Interface().(Point3D)
    buf := ctx.Buffer()
    buf.WriteFloat64(p.X)
    buf.WriteFloat64(p.Y)
    buf.WriteFloat64(p.Z)
    // 字符串写为“长度 + 内容字节”
    labelBytes := []byte(p.Label)
    buf.WriteVarint32(int32(len(labelBytes)))
    buf.WriteBinary(labelBytes)
}

func (s *Point3DSerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    buf := ctx.Buffer()
    err := ctx.Err()
    x := buf.ReadFloat64(err)
    y := buf.ReadFloat64(err)
    z := buf.ReadFloat64(err)
    labelLen := buf.ReadVarint32(err)
    labelBytes := buf.ReadBinary(int(labelLen), err)
    value.Set(reflect.ValueOf(Point3D{
        X:     x,
        Y:     y,
        Z:     z,
        Label: string(labelBytes),
    }))
}

f := fory.New()
f.RegisterExtension(Point3D{}, 101, &Point3DSerializer{})
```

## 处理指针

如果类型中包含指针，需要显式处理 `nil`：

```go
type OptionalValue struct {
    Value *int64
}

type OptionalValueSerializer struct{}

func (s *OptionalValueSerializer) WriteData(ctx *fory.WriteContext, value reflect.Value) {
    ov := value.Interface().(OptionalValue)
    buf := ctx.Buffer()
    if ov.Value == nil {
        buf.WriteBool(false) // nil 标记
    } else {
        buf.WriteBool(true) // 非 nil
        buf.WriteInt64(*ov.Value)
    }
}

func (s *OptionalValueSerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    buf := ctx.Buffer()
    err := ctx.Err()
    hasValue := buf.ReadBool(err)
    if !hasValue {
        value.Set(reflect.ValueOf(OptionalValue{Value: nil}))
        return
    }
    v := buf.ReadInt64(err)
    value.Set(reflect.ValueOf(OptionalValue{Value: &v}))
}
```

## 错误处理

通过 `ctx.SetError()` 报告错误：

```go
func (s *MySerializer) ReadData(ctx *fory.ReadContext, value reflect.Value) {
    buf := ctx.Buffer()
    version := buf.ReadInt8(ctx.Err())
    if ctx.HasError() {
        return
    }
    if version != 1 {
        ctx.SetError(fory.DeserializationErrorf("unsupported version: %d", version))
        return
    }
    // 继续读取后续字段
    value.Set(reflect.ValueOf(result))
}
```

## 注册方式

### 按 ID 注册

这种方式序列化更紧凑，但要求跨语言间协调好 ID：

```go
f.RegisterExtension(MyType{}, 100, &MySerializer{})
```

### 按名称注册

这种方式更灵活，但序列化开销更大，因为类型名会写入数据中：

```go
f.RegisterNamedExtension(MyType{}, "myapp.MyType", &MySerializer{})
```

## 最佳实践

1. 保持格式简单，只序列化真正需要的数据。
2. 小整数优先使用 `WriteVarint32` / `WriteVarint64`。
3. 指针和 slice 等可空值要显式处理。
4. 可以考虑增加版本字节，为将来格式演进留出空间。
5. 始终验证往返正确性，即 `Read(Write(value)) == value`。
6. 读取顺序必须与写入顺序完全一致。
7. 读取阶段要结合 `ctx.HasError()` 做错误检查。
8. 在发送使用自定义序列化器的数据前，确保所有服务都已完成对应注册。

## 测试自定义序列化器

```go
func TestMySerializer(t *testing.T) {
    f := fory.New()
    f.RegisterExtension(MyType{}, 100, &MySerializer{})

    original := MyType{Field: "test"}

    // Serialize
    data, err := f.Serialize(original)
    require.NoError(t, err)

    // Deserialize
    var result MyType
    err = f.Deserialize(data, &result)
    require.NoError(t, err)

    assert.Equal(t, original, result)
}
```

## 相关主题

- [类型注册](type-registration.md)
- [支持类型](supported-types.md)
- [跨语言序列化](cross-language.md)
