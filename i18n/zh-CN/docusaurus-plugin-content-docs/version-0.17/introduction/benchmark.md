---
id: benchmark
title: 性能测试
sidebar_position: 3
---

> **说明**：不同的序列化框架在不同场景下各有优势。性能测试结果仅供参考。
> 对于你的具体使用场景，请使用合适的配置和工作负载自行进行基准测试。

## Java 性能测试

Java 性能测试部分使用 `docs/benchmarks/java` 中的当前基准套件，对 Fory 与常见 Java 序列化框架进行对比。

**序列化吞吐**：

![Java 序列化吞吐](../benchmarks/java/java_repo_serialization_throughput.png)

**反序列化吞吐**：

![Java 反序列化吞吐](../benchmarks/java/java_repo_deserialization_throughput.png)

**零拷贝序列化吞吐**：

<img width="90%" alt="" src="/img/benchmarks/zerocopy/zero_copy_bench_serialize_BUFFER_to_array_tps.png" />

**零拷贝反序列化吞吐**：

<img width="90%" alt="" src="/img/benchmarks/zerocopy/zero_copy_bench_deserialize_BUFFER_from_array_tps.png" />

**重要说明**：Fory 的运行时代码生成依赖充分预热后才能进行准确的性能测量。

更多性能测试说明、原始数据和完整 Java benchmark README 请参见 [Java Benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks/java)。

## Python 性能测试

Fory Python 在对象和列表两类工作负载下，相比 `pickle` 和 Protobuf 展现出较强的性能表现。

![Python 吞吐图](../benchmarks/python/throughput.png)

性能测试配置、原始结果以及复现方式请参见 [Python 性能测试报告](../benchmarks/python/README.md)。

## Rust 性能测试

Fory Rust 相比其他 Rust 序列化框架展现出有竞争力的性能。

<img src="/img/benchmarks/rust/company.png" width="90%"/>

<img src="/img/benchmarks/rust/ecommerce_data.png" width="90%"/>

<img src="/img/benchmarks/rust/system_data.png" width="90%"/>

注意：结果取决于硬件、数据集和实现版本。关于如何自行运行性能测试，请参见 Rust 指南：https://github.com/apache/fory/blob/main/benchmarks/rust_benchmark/README.md

## C++ 性能测试

Fory C++ 相比 Protobuf C++ 序列化框架展现出有竞争力的性能。

<img src="/img/benchmarks/cpp/throughput.png" width="90%"/>

## Go 性能测试

Fory Go 在单对象和列表两类工作负载下，相比 Protobuf 和 Msgpack 展现出较强的性能表现。

<img src="/img/blog/fory_0_16_0_release/go_benchmark_combined.png" width="90%"/>

注意：结果取决于硬件、数据集和实现版本。详细信息请参见 Go 性能测试报告：https://fory.apache.org/docs/benchmarks/go/

## C\# 性能测试

Fory C\# 在强类型对象的序列化和反序列化工作负载下，相比 Protobuf 和 Msgpack 展现出较强的性能表现。

<img src="/img/blog/fory_0_16_0_release/csharp_benchmark_combined.png" width="90%"/>

注意：结果取决于硬件和运行时版本。详细信息请参见 C\# 性能测试报告：https://fory.apache.org/docs/benchmarks/csharp/

## Swift 性能测试

Fory Swift 在标量对象和列表两类工作负载下，相比 Protobuf 和 Msgpack 展现出较强的性能表现。

<img src="/img/blog/fory_0_16_0_release/swift_benchmark_combined.png" width="90%"/>

注意：结果取决于硬件和运行时版本。详细信息请参见 Swift 性能测试报告：https://fory.apache.org/docs/benchmarks/swift/

## JavaScript 性能测试

Fory JavaScript 在具有代表性的 Node.js 工作负载下，相比 Protocol Buffers 与 JSON 展现出较强性能表现。

<img src="../benchmarks/javascript/throughput.png" width="90%"/>

注意：结果取决于硬件、数据集和运行时版本。详细信息请参见 [JavaScript 性能测试报告](../benchmarks/javascript/README.md)。

## Dart 性能测试

Fory Dart 在具有代表性的对象和列表工作负载下，相比 Protocol Buffers 展现出较强性能表现。

<img src="../benchmarks/dart/throughput.png" width="90%"/>

注意：结果取决于硬件、数据集和运行时版本。详细信息请参见 [Dart 性能测试报告](../benchmarks/dart/README.md)。
