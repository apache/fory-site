---
id: benchmark
title: 性能测试
sidebar_position: 2
---

不同的序列化框架适用于不同的场景，此处的性能测试结果仅供参考。

如果您需要针对特定场景进行性能测试，请确保所有序列化框架都针对该场景进行了适当配置。

动态序列化框架支持多态和引用，与静态序列化框架相比会有更多开销，除非像 Apache Fory™ 那样使用 JIT 技术。
由于 Apache Fory™ 会在运行时生成代码，因此在收集性能测试统计数据之前请进行预热。

## Java 性能测试

Java 部分已切换为 `docs/benchmarks/java` 中的最新性能测试图。图表现在按以下维度分组：

- **Heap**：序列化到堆上 `byte[]` 缓冲区
- **Off-heap**：序列化到 direct/off-heap 缓冲区
- **Compatible**：启用前向/后向兼容的 Schema 演进模式
- **Consistent**：要求读写两端 Schema 完全一致的模式

**测试数据类型**：

- `Struct`：包含 [100 个基础类型字段](https://github.com/apache/fory/tree/main/docs/benchmarks#Struct) 的类
- `MediaContent`：来自 [jvm-serializers](https://github.com/eishay/jvm-serializers/blob/master/tpc/src/data/media/MediaContent.java) 的类
- `Sample`：来自 [Kryo benchmark](https://github.com/EsotericSoftware/kryo/blob/master/benchmarks/src/main/java/com/esotericsoftware/kryo/benchmarks/data/Sample.java) 的类

### Heap 序列化

Compatible 模式：

<img width="90%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_MEDIA_CONTENT_to_array_tps.png" />

Consistent 模式：

<img width="90%" alt="" src="/img/benchmarks/serialization/bench_serialize_MEDIA_CONTENT_to_array_tps.png" />

### Off-heap 序列化

Compatible 模式：

<img width="90%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_STRUCT_to_directBuffer_tps.png" />

Consistent 模式：

<img width="90%" alt="" src="/img/benchmarks/serialization/bench_serialize_STRUCT_to_directBuffer_tps.png" />

### Heap 反序列化

Compatible 模式：

<img width="90%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_MEDIA_CONTENT_from_array_tps.png" />

Consistent 模式：

<img width="90%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_MEDIA_CONTENT_from_array_tps.png" />

### Off-heap 反序列化

Compatible 模式：

<img width="90%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_STRUCT_from_directBuffer_tps.png" />

Consistent 模式：

<img width="90%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_STRUCT_from_directBuffer_tps.png" />

### 仓库基准汇总

序列化吞吐：

<img width="90%" alt="" src="/img/benchmarks/serialization/bench_serialize_SAMPLE_to_array_tps.png" />

反序列化吞吐：

<img width="90%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_SAMPLE_from_array_tps.png" />

### 零拷贝性能测试

序列化：

<img width="90%" alt="" src="/img/benchmarks/zerocopy/zero_copy_bench_serialize_BUFFER_to_array_tps.png" />

反序列化：

<img width="90%" alt="" src="/img/benchmarks/zerocopy/zero_copy_bench_deserialize_BUFFER_from_array_tps.png" />

注意：Apache Fory™ 依赖运行时代码生成，进行性能测试前必须充分预热。

更多说明、原始数据和完整 Java benchmark README 请参见 [Java Benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks/java)。

## Rust 性能测试

<img src="/img/benchmarks/rust/company.png" width="90%"/>

<img src="/img/benchmarks/rust/ecommerce_data.png" width="90%"/>

<img src="/img/benchmarks/rust/system_data.png" width="90%"/>

注意：结果取决于硬件、数据集和实现版本。有关如何自行运行性能测试的信息，请参阅 Fory Rust Benchmark 指南：https://github.com/apache/fory/blob/main/benchmarks/rust_benchmark/README.md

## C++ 性能测试

Fory C++ 在性能方面相较 Protobuf C++ 序列化框架具有竞争力。

<img src="/img/benchmarks/cpp/throughput.png" width="90%"/>

## Go 性能测试

Fory Go 在单对象和列表两类工作负载下，相较 Protobuf 与 Msgpack 展现出较强的性能表现。

<img src="/img/blog/fory_0_16_0_release/go_benchmark_combined.png" width="90%"/>

注意：结果取决于硬件、数据集和实现版本。详细信息请参见 Go 性能测试报告：https://fory.apache.org/docs/benchmarks/go/

## Python 性能测试

Fory Python 在单对象和列表两类工作负载下，相较 `pickle` 与 Protobuf 展现出较强的性能表现。

<img src="/img/benchmarks/python/throughput.png" width="90%"/>

注意：结果取决于硬件、数据集、Python 运行时和实现版本。详细信息请参见 Python 性能测试报告：https://fory.apache.org/docs/benchmarks/python/

## JavaScript 性能测试

<img width="33%" alt="" src="/img/benchmarks/javascript/complex_object.jpg" />

此柱状图使用的数据包含一个具有多种字段类型的复杂对象，JSON 数据大小为 3KB。

性能测试代码请参见 [benchmarks](https://github.com/apache/fory/blob/main/javascript/benchmark/index.js)。
