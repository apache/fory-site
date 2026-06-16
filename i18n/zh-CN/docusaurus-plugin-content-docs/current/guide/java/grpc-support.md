---
title: gRPC 支持
sidebar_position: 10
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

Fory 可以为包含 service 定义的 schema 生成 Java gRPC service companion。生成的 service code
使用普通 grpc-java channel、server、deadline、status code、interceptor 和 transport security，
但 request/response 对象使用 Fory 序列化，而不是 protobuf。

当两端都由同一份 Fory IDL、protobuf IDL 或 FlatBuffers IDL 生成，并且你希望使用 gRPC
传输语义与 Fory payload 编码时，可以使用这种模式。如果 API 必须被通用 protobuf client、
reflection 工具或期望 protobuf message bytes 的组件消费，请使用标准 protobuf gRPC 代码生成。

Scala 生成的 grpc-java companion 见 [Scala gRPC 支持](../scala/grpc-support.md)。Kotlin
coroutine stub 和 service base 见 [Kotlin gRPC 支持](../kotlin/grpc-support.md)。

## 添加依赖

生成的 Java service 文件编译时需要 grpc-java。Fory Java artifact 不会把 gRPC 作为硬依赖，
因此请在应用中添加 grpc-java 依赖：

```xml
<dependency>
  <groupId>io.grpc</groupId>
  <artifactId>grpc-api</artifactId>
  <version>${grpc.version}</version>
</dependency>
<dependency>
  <groupId>io.grpc</groupId>
  <artifactId>grpc-stub</artifactId>
  <version>${grpc.version}</version>
</dependency>
<dependency>
  <groupId>io.grpc</groupId>
  <artifactId>grpc-netty-shaded</artifactId>
  <version>${grpc.version}</version>
</dependency>
```

Gradle 示例：

```kotlin
dependencies {
  implementation("org.apache.fory:fory-core:$foryVersion")
  implementation("io.grpc:grpc-api:$grpcVersion")
  implementation("io.grpc:grpc-stub:$grpcVersion")
  implementation("io.grpc:grpc-netty-shaded:$grpcVersion")
}
```

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

使用 `--grpc` 生成 Java model 和 gRPC companion：

```bash
foryc service.fdl --java_out=./generated/java --grpc
```

生成结果包含 model 类型、schema module 和 grpc-java service companion。生成的 method descriptor
使用 Fory-backed `MethodDescriptor.Marshaller`，因此不会调用 protobuf parser。

## 实现 Server

实现生成的 service base，并注册到标准 grpc-java `Server`：

```java
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.stub.StreamObserver;

final class GreeterService extends GreeterGrpc.GreeterImplBase {
  @Override
  public void sayHello(
      HelloRequest request,
      StreamObserver<HelloReply> responseObserver) {
    responseObserver.onNext(new HelloReply("Hello, " + request.name()));
    responseObserver.onCompleted();
  }
}

Server server = ServerBuilder
    .forPort(50051)
    .addService(new GreeterService())
    .build()
    .start();
```

生成代码负责注册和序列化 request/response 类型，service 实现不需要手动创建 Fory 实例。

## 创建 Client

使用普通 grpc-java channel 和生成 stub：

```java
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 50051)
    .usePlaintext()
    .build();

GreeterGrpc.GreeterBlockingStub stub = GreeterGrpc.newBlockingStub(channel);
HelloReply reply = stub.sayHello(new HelloRequest("Fory"));
```

Channel lifecycle、deadline、credential、metadata、load balancing、retry 和 interceptor 都保持
grpc-java 行为。

## Streaming RPC

Fory service 可以使用 gRPC 的所有 streaming shape：

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc Chat (stream HelloRequest) returns (stream HelloReply);
}
```

生成 Java service 方法遵循 grpc-java 约定：

- Unary 方法使用 request 参数和 response `StreamObserver`。
- Server-streaming 方法向 response observer 多次 `onNext`。
- Client-streaming 与 bidirectional streaming 返回 request `StreamObserver`。
- Blocking stub 暴露 grpc-java 支持的 blocking API。

## 故障排查

### 缺少 `io.grpc` 或 Guava 类

添加上面的 grpc-java 依赖。生成的 Fory service 文件导入 grpc-java API，但 Fory Java artifact
不会自动依赖 gRPC。

### Protobuf Client 无法解码

Fory gRPC companion 不使用 protobuf wire encoding。请使用 Fory 生成的 client 调用 Fory 生成的
service，或提供单独的 protobuf endpoint。
