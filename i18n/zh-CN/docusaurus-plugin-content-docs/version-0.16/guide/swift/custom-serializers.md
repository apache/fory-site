---
title: 自定义序列化器
sidebar_position: 4
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

对于不能或不适合使用 `@ForyObject` 的类型，可以手动实现 `Serializer`。

## 何时使用自定义序列化器

- 需要严格编码兼容性的外部类型
- 更紧凑的专用编码
- 兼容旧载荷的迁移路径
- 高度调优的热点路径序列化

## 实现 `Serializer`

```swift
import Foundation
import Fory

struct UUIDBox: Serializer, Equatable {
    var value: UUID = UUID(uuidString: "00000000-0000-0000-0000-000000000000")!

    static func foryDefault() -> UUIDBox {
        UUIDBox()
    }

    static var staticTypeId: ForyTypeId {
        .ext
    }

    func foryWriteData(_ context: WriteContext, hasGenerics: Bool) throws {
        _ = hasGenerics
        try value.uuidString.foryWriteData(context, hasGenerics: false)
    }

    static func foryReadData(_ context: ReadContext) throws -> UUIDBox {
        let raw = try String.foryReadData(context)
        guard let uuid = UUID(uuidString: raw) else {
            throw ForyError.invalidData("invalid UUID string: \(raw)")
        }
        return UUIDBox(value: uuid)
    }
}
```

## 注册并使用

```swift
let fory = Fory()
fory.register(UUIDBox.self, id: 300)

let input = UUIDBox(value: UUID())
let data = try fory.serialize(input)
let output: UUIDBox = try fory.deserialize(data)

assert(input == output)
```

## 选择 `staticTypeId`

对于手动实现的自定义类型，应选择与实际编码种类一致的 `staticTypeId`。

常见选项：

- `.structType`：普通结构化对象
- `.enumType` / `.typedUnion`：类似枚举的值
- `.ext`：扩展 / 自定义种类
