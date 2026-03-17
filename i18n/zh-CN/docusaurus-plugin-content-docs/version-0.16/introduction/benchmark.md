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

### Java 序列化

<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_STRUCT_to_directBuffer_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_MEDIA_CONTENT_to_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_MEDIA_CONTENT_to_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/serialization/bench_serialize_SAMPLE_to_array_tps.png" />

### Java 反序列化

<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_STRUCT_from_directBuffer_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_MEDIA_CONTENT_from_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_MEDIA_CONTENT_from_array_tps.png" />
<img width="33%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_SAMPLE_from_array_tps.png" />

更多关于类型前向/后向兼容性、堆外支持、零拷贝序列化的性能测试，请参见 [benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks)。

## Rust 性能测试

<img src="/img/benchmarks/rust/company.png" width="90%"/>

<img src="/img/benchmarks/rust/ecommerce_data.png" width="90%"/>

<img src="/img/benchmarks/rust/system_data.png" width="90%"/>

注意：结果取决于硬件、数据集和实现版本。有关如何自行运行性能测试的信息，请参阅 Fory Rust Benchmark 指南：https://github.com/apache/fory/blob/main/benchmarks/rust_benchmark/README.md

## JavaScript 性能测试

<img width="33%" alt="" src="/img/benchmarks/javascript/complex_object.jpg" />

此柱状图使用的数据包含一个具有多种字段类型的复杂对象，JSON 数据大小为 3KB。

性能测试代码请参见 [benchmarks](https://github.com/apache/fory/blob/main/javascript/benchmark/index.js)。
