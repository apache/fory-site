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

当前生成的 Python companion 面向同步 `grpcio` API。请使用普通 `def` servicer 方法、
`grpc.server(...)`、标准 `grpc.Channel` 实例，并用 Python iterator/generator 处理 streaming RPC。
生成的 stub 可以接收应用自行配置的任意 channel。Compiler 不会生成 `grpc.aio` stub 或 service
base，因此不要把生成 servicer 方法实现成 `async def`，除非你在生成 companion 外自行封装 adapter。

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

该 schema 会生成：

| 文件                   | 用途                              |
| ---------------------- | --------------------------------- |
| `demo_greeter.py`      | Fory dataclass 和注册辅助逻辑     |
| `demo_greeter_grpc.py` | `grpcio` stub、servicer base 和注册函数 |

Module 名称来自 Fory package，点号会替换成下划线；没有 package 的 schema 使用 `generated.py` 和
`generated_grpc.py`。

## 实现 Server

```python
from concurrent import futures

import grpc

import demo_greeter
import demo_greeter_grpc


class Greeter(demo_greeter_grpc.GreeterServicer):
    def say_hello(self, request, context):
        return demo_greeter.HelloReply(reply=f"Hello, {request.name}")


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=8))
    demo_greeter_grpc.add_servicer(Greeter(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
```

## 创建 Client

```python
import grpc

import demo_greeter
import demo_greeter_grpc


def main():
    credentials = grpc.ssl_channel_credentials()
    with grpc.secure_channel("api.example.com:443", credentials) as channel:
        stub = demo_greeter_grpc.GreeterStub(channel)
        reply = stub.say_hello(demo_greeter.HelloRequest(name="Fory"))
        print(reply.reply)


if __name__ == "__main__":
    main()
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

生成 Python companion 遵循 `grpcio` 的 iterator/generator 约定：

| IDL shape                                 | Servicer 方法形态                         | Stub 方法形态             |
| ----------------------------------------- | ----------------------------------------- | ------------------------- |
| `rpc A (Req) returns (Res)`               | 返回一个 response 对象                    | 返回一个 response 对象    |
| `rpc A (Req) returns (stream Res)`        | yield 多个 response 对象                  | 返回 response iterator    |
| `rpc A (stream Req) returns (Res)`        | 消费 request iterator 并返回一个 response | 接收 request iterator     |
| `rpc A (stream Req) returns (stream Res)` | 消费 request iterator 并 yield response   | 接收并返回 iterator       |

Servicer 方法使用 snake_case 名称；生成 descriptor 会保留 IDL 中的 service 和 method 名称作为
gRPC path。每个 message frame 都通过 Fory serializer/deserializer 编码。

Server 可以直接使用 Python iterator：

```python
class Greeter(demo_greeter_grpc.GreeterServicer):
    def lots_of_replies(self, request, context):
        yield demo_greeter.HelloReply(reply=f"Hello, {request.name}")
        yield demo_greeter.HelloReply(reply=f"Welcome, {request.name}")

    def lots_of_greetings(self, request_iterator, context):
        names = [request.name for request in request_iterator]
        return demo_greeter.HelloReply(reply=", ".join(names))

    def chat(self, request_iterator, context):
        for request in request_iterator:
            yield demo_greeter.HelloReply(reply=f"Hello, {request.name}")
```

生成的 client 使用标准 `grpcio` streaming 调用形态：

```python
credentials = grpc.ssl_channel_credentials()
with grpc.secure_channel("api.example.com:443", credentials) as channel:
    stub = demo_greeter_grpc.GreeterStub(channel)

    for reply in stub.lots_of_replies(
        demo_greeter.HelloRequest(name="Fory")
    ):
        print(reply.reply)

    def greeting_requests():
        yield demo_greeter.HelloRequest(name="Ada")
        yield demo_greeter.HelloRequest(name="Grace")

    summary = stub.lots_of_greetings(greeting_requests())
    print(summary.reply)

    def chat_requests():
        yield demo_greeter.HelloRequest(name="Fory")
        yield demo_greeter.HelloRequest(name="RPC")

    for reply in stub.chat(chat_requests()):
        print(reply.reply)
```

## 运维语义

生成的 service companion 只提供 Fory serialization callback。运维行为仍遵循标准 `grpcio`：

- Deadline 和取消
- TLS 和认证 credential
- Client/server interceptor
- Status code、details 和 metadata
- Channel/server 生命周期
- 同步 server 的线程池大小

## 故障排查

### 缺少 `grpc`

安装 `grpcio`：

```bash
pip install grpcio
```

### `UNIMPLEMENTED`

确认生成的 servicer 已注册到 server，并且 client 与 server 来自相同 package、service 和 method 名称。

### Protobuf Client 无法解码

Fory gRPC 使用 Fory 二进制协议 payload，不是 protobuf wire-format message。两端应使用同一份
schema 生成的 Fory gRPC companion。
