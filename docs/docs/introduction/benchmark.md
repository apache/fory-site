---
id: benchmark
title: Benchmark
sidebar_position: 3
---

> **Note**: Different serialization frameworks excel in different scenarios. Benchmark results are for reference only.
> For your specific use case, conduct benchmarks with appropriate configurations and workloads.

## Java Benchmark

The following benchmarks compare Fory against popular Java serialization frameworks. Charts labeled **"compatible"** show schema evolution mode with forward/backward compatibility enabled, while others show schema consistent mode where class schemas must match.

**Test Classes**:

- `Struct`: Class with [100 primitive fields](https://github.com/apache/fory/tree/main/docs/benchmarks#Struct)
- `MediaContent`: Class from [jvm-serializers](https://github.com/eishay/jvm-serializers/blob/master/tpc/src/data/media/MediaContent.java)
- `Sample`: Class from [Kryo benchmark](https://github.com/EsotericSoftware/kryo/blob/master/benchmarks/src/main/java/com/esotericsoftware/kryo/benchmarks/data/Sample.java)

### Java Serialization

<img width="48%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_STRUCT_to_directBuffer_tps.png" />
<img width="48%" alt="" src="/img/benchmarks/serialization/bench_serialize_compatible_MEDIA_CONTENT_to_array_tps.png" />
<img width="48%" alt="" src="/img/benchmarks/serialization/bench_serialize_MEDIA_CONTENT_to_array_tps.png" />
<img width="48%" alt="" src="/img/benchmarks/serialization/bench_serialize_SAMPLE_to_array_tps.png" />

### Java Deserialization

<img width="48%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_STRUCT_from_directBuffer_tps.png" />
<img width="48%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_compatible_MEDIA_CONTENT_from_array_tps.png" />
<img width="48%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_MEDIA_CONTENT_from_array_tps.png" />
<img width="48%" alt="" src="/img/benchmarks/deserialization/bench_deserialize_SAMPLE_from_array_tps.png" />

**Important**: Fory's runtime code generation requires proper warm-up for performance measurement:

For additional benchmarks covering type forward/backward compatibility, off-heap support, and zero-copy serialization, see [Java Benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks).

## Rust Benchmark

Fory Rust demonstrates competitive performance compared to other Rust serialization frameworks.

<img src="/img/benchmarks/rust/company.png" width="90%"/>

<img src="/img/benchmarks/rust/ecommerce_data.png" width="90%"/>

<img src="/img/benchmarks/rust/system_data.png" width="90%"/>

Note: Results depend on hardware, dataset, and implementation versions. See the Rust guide for how to run benchmarks yourself: https://github.com/apache/fory/blob/main/benchmarks/rust_benchmark/README.md

## C++ Benchmark

Fory C++ demonstrates competitive performance compared to Protobuf C++ serialization framework.

<img src="/img/benchmarks/cpp/throughput.png" width="90%"/>

## JavaScript Benchmark

<img width="50%" alt="" src="/img/benchmarks/javascript/complex_object.jpg" />

The data used for this bar graph includes a complex object that has many kinds of field types, and the size of the JSON data is 3KB.

See [benchmarks](https://github.com/apache/fory/blob/main/javascript/benchmark/index.js) for the benchmark code.
