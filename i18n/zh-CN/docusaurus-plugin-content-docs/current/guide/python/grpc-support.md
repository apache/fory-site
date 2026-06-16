---
title: gRPC 支持
sidebar_position: 9
id: grpc_support
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

Fory 可以为包含 service 定义的 schema 生成 Python gRPC companion module。生成代码使用
`grpcio` 负责传输，request 和 response 对象使用 `pyfory` 序列化。

当两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望使用 gRPC
传输语义与 Fory payload 编码时，可以使用这种模式。如果客户端或工具必须直接消费 protobuf
message bytes，请使用标准 protobuf gRPC 代码生成。

## 添加依赖

```bash
pip install pyfory grpcio
```

Fory Python package 不会把 gRPC 作为硬依赖；只有编译或运行生成 gRPC companion 的应用需要安装
`grpcio`。

## 定义 Service

```protobuf
package demo.greeter;

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string reply = 1;
}

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
```

生成 Python model 和 gRPC companion：

```bash
foryc service.fdl --python_out=./generated/python --grpc
```

生成结果通常包含 model module 和 `<module>_grpc.py` companion。Companion 会导入生成的
`to_bytes`/`from_bytes` 辅助逻辑，并把它们接入 `grpcio` serializer/deserializer。

## 实现 Server

```python
from concurrent import futures
import grpc

from generated.python.service import HelloReply
from generated.python import service_grpc


class Greeter(service_grpc.GreeterServicer):
    def SayHello(self, request, context):
        return HelloReply(reply=f"Hello, {request.name}")


server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
service_grpc.add_GreeterServicer_to_server(Greeter(), server)
server.add_insecure_port("[::]:50051")
server.start()
server.wait_for_termination()
```

## 创建 Client

```python
import grpc

from generated.python.service import HelloRequest
from generated.python import service_grpc

with grpc.insecure_channel("localhost:50051") as channel:
    stub = service_grpc.GreeterStub(channel)
    reply = stub.SayHello(HelloRequest(name="Fory"))
    print(reply.reply)
```

Channel、credential、deadline、metadata、interceptor、retry 和 server lifecycle 都保持 `grpcio`
行为。

## Streaming RPC

Fory service 可以使用 unary、server-streaming、client-streaming 和 bidirectional streaming：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成 Python companion 使用 `grpcio` 的 iterator/generator 约定处理 streaming。每个 message
frame 都通过 Fory serializer/deserializer 编码。

## 故障排查

### 缺少 `grpc`

安装 `grpcio`：

```bash
pip install grpcio
```

### Protobuf Client 无法解码

Fory gRPC 使用 Fory 二进制协议 payload，不是 protobuf wire-format message。两端应使用同一份
schema 生成的 Fory gRPC companion。
