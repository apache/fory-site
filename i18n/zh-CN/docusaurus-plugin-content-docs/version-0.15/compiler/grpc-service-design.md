---
title: gRPC 服务 IDL 设计
sidebar_position: 8
id: grpc_service_design
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

> 中文导读：本文档为 Fory 编译器/协议规范文档的中文译稿。为避免改变规范语义，代码片段、类型名、协议字段名保持英文，说明性文字优先翻译为中文。

# gRPC Service IDL Design

## Thoughts and Constraints

- Fory generates native language types for Fory IDL/proto/fbs, not protobuf/flatbuffers runtime types.
  This makes standard gRPC stubs (which expect protobuf or flatbuffers runtime classes) incompatible
  with Fory-generated types by default.
- We should keep the Fory runtime dependency-free from gRPC. Any gRPC integration must be
  generated code or optional helper files emitted by the compiler.
- We need to support service definitions in Fory IDL, protobuf, and FlatBuffers, and generate gRPC
  stubs for Java/Python/Rust/Go/C++.

The design below uses a "service IR" that can be rendered into gRPC stubs in each language,
with a single serialization strategy (Fory) to keep the system simple and dependency-light.

## Goals

- Add `service` definitions to Fory IDL with protobuf-like syntax.
- Parse protobuf `service` and FlatBuffers `rpc_service` blocks.
- Extend the compiler IR with service/method definitions.
- Generate gRPC stubs for Java/Python/Rust/Go/C++ without adding gRPC runtime deps to Fory.
- Preserve performance: avoid per-call reflection and minimize allocations in codecs.

## Non-Goals

- Implement a gRPC runtime inside Fory.
- Provide full interoperability with standard protobuf/flatbuffers gRPC without explicit opt-in.
- Change core Fory serialization formats or protocol specs.

## IDL Additions

### Fory IDL Service Syntax

Fory IDL service syntax mirrors protobuf:

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc BidiHello (stream HelloRequest) returns (stream HelloReply);
}
```

Notes:

- `stream` is supported on request/response for gRPC streaming.
- Service and method-level `option` blocks are allowed and stored as raw key/value pairs.
- Service methods must reference message types (not enums or unions).

### Protobuf Service Support

Parse `service` and `rpc` definitions (including `stream`) into proto AST nodes, then
translate into the shared service IR. Preserve options for round-tripping and future use.

### FlatBuffers `rpc_service` Support

Parse `rpc_service` blocks into the service IR. FlatBuffers methods are mapped to
unary RPC by default; streaming is a follow-up if FlatBuffers gRPC spec supports it.

## IR Changes

Add new nodes in `compiler/fory_compiler/ir/ast.py`:

```python
@dataclass
class RpcMethod:
    name: str
    request_type: NamedType
    response_type: NamedType
    client_streaming: bool = False
    server_streaming: bool = False
    options: dict = field(default_factory=dict)
    line: int = 0
    column: int = 0
    location: Optional[SourceLocation] = None

@dataclass
class Service:
    name: str
    methods: List[RpcMethod] = field(default_factory=list)
    options: dict = field(default_factory=dict)
    line: int = 0
    column: int = 0
    location: Optional[SourceLocation] = None
```

Extend `Schema` with `services: List[Service]`.

## Frontend Updates

- Fory IDL lexer/parser: add keywords `service`, `rpc`, `returns`, `stream`.
- Proto parser: replace the current "skip service block" logic with full parsing.
- FlatBuffers parser: add `rpc_service` parsing and AST nodes.
- Translators: map format-specific AST into the shared IR.

## Validation Rules

- Service names must be unique per schema.
- Method names must be unique per service.
- Request/response types must resolve to message types (not enums/unions).
- Streaming flags are only allowed on request/response types.
- FlatBuffers: enforce request/response are tables (or document the accepted type set).

## Serialization Strategy (Only Fory)

- gRPC always uses a custom codec that serializes request/response with Fory.
- Works with Fory-generated native types across languages.
- Not wire-compatible with standard protobuf-based gRPC clients.
- No external protoc/flatc invocation and no extra runtime dependencies in Fory.

## Codegen Architecture

### Compiler Options

New CLI options:

- `--grpc`: enable gRPC stub generation.
- `--grpc-backend=<lang-specific>`:
  - Rust: `tonic` (default), future `grpcio`.
  - C++: `grpc++`.
  - Java: `grpc-java`.
  - Go: `grpc-go`.
  - Python: `grpcio`.

### Generator Integration

- Add a `generate_services()` hook to each language generator.
- Emit service stubs into a separate file group (for easy optional compilation).
- If `--grpc` is not set, only emit pure service interfaces (no gRPC deps).

### File Layout (Proposed)

- Java: `*Service.java` for pure interface, `*Grpc.java` for gRPC bindings.
- Python: `*_service.py` for interface, `*_grpc.py` for gRPC bindings.
- Go: `*_service.go` for interface, `*_grpc.go` for gRPC bindings.
- Rust: `service.rs` module and `service_grpc.rs` with gRPC bindings (feature-gated).
- C++: `service.h` and `service.grpc.h/.cc`.

## Language-Specific gRPC Generation (High Level)

- Java: generate `Grpc` class with `MethodDescriptor`s, server binder, and client stubs.
  For `fory` serialization, emit a `Marshaller` using Fory encoders/decoders.
- Python: generate `Servicer` base class and `Stub` class using `grpc` unary/stream APIs.
  For `fory` serialization, pass serializer/deserializer callables.
- Go: generate `ServiceDesc`, server interface, and client wrapper. For `fory`, register
  a custom codec and use it in `grpc.CallOption`.
- Rust: use `tonic` with a custom codec for `fory`. For protobuf mode, emit standard
  `tonic` service traits and clients.
- C++: generate abstract service and stub classes. For `fory`, use gRPC custom
  serialization hooks to map between Fory types and byte streams.

## Compatibility and Interop

- Fory gRPC is cross-language compatible within Fory, but not compatible with
  standard protobuf-based gRPC clients.

## Testing Plan

- Parser tests for Fory IDL/proto/fbs service syntax.
- IR validation tests for method/type resolution and streaming rules.
- Golden codegen tests that verify gRPC output file names and key signatures.
- Cross-language smoke tests (optional): gRPC request/response with `fory` codec.

## Decisions

1. FlatBuffers `rpc_service` supports both table and struct types.
2. gRPC codegen runs only when `--grpc` is enabled.
3. Rust backend uses `tonic`.
4. Ship small, generated helper files instead of a separate `fory-grpc` module.

## Expected Codegen Footprint

The compiler will generate a small, predictable set of service files. The exact line
count scales with the number of RPC methods and whether streaming is used.

### Files per service (per language)

- Java: 2 files (`*Service.java`, `*Grpc.java`)
- Python: 2 files (`*_service.py`, `*_grpc.py`)
- Go: 2 files (`*_service.go`, `*_grpc.go`)
- Rust: 2 files (`service.rs`, `service_grpc.rs`)
- C++: 3 files (`service.h`, `service.grpc.h`, `service.grpc.cc`)

### Rough size estimate

Each service generates:

- One interface/trait file: roughly 10-20 lines per method.
- One gRPC binding file: roughly 25-50 lines per method plus a fixed header (about 80-200 lines).

So a service with `M` methods typically adds:

- Java/Python/Go/Rust: about `~(100-200) + (35-70)*M` lines across 2 files.
- C++: about `~(150-250) + (45-90)*M` lines across 3 files.

These numbers are intentionally conservative; the final output depends on the exact
backend template we implement.
