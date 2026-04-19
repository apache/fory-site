---
id: benchmark
title: Benchmark
sidebar_position: 3
---

> **Note**: Different serialization frameworks excel in different scenarios. Benchmark results are for reference only.
> For your specific use case, conduct benchmarks with appropriate configurations and workloads.

## Java Benchmark

The Java benchmark section compares Fory against popular Java serialization frameworks using the current benchmark suite from `docs/benchmarks/java`.

**Serialization Throughput**:

![Java Serialization Throughput](../benchmarks/java/java_repo_serialization_throughput.png)

**Deserialization Throughput**:

![Java Deserialization Throughput](../benchmarks/java/java_repo_deserialization_throughput.png)

**Zero-Copy Serialize Throughput**:

<img width="90%" alt="" src="/img/benchmarks/zerocopy/zero_copy_bench_serialize_BUFFER_to_array_tps.png" />

**Zero-Copy Deserialize Throughput**:

<img width="90%" alt="" src="/img/benchmarks/zerocopy/zero_copy_bench_deserialize_BUFFER_from_array_tps.png" />

**Important**: Fory's runtime code generation requires proper warm-up for performance measurement:

For additional benchmark notes, raw data, and the complete Java benchmark README, see [Java Benchmarks](https://github.com/apache/fory/tree/main/docs/benchmarks/java).

## Python Benchmark

Fory Python demonstrates strong performance compared to `pickle` and Protobuf across object and list workloads.

![Python Throughput](../benchmarks/python/throughput.png)

For benchmark setup, raw results, and reproduction steps, see [Python Benchmarks](../benchmarks/python/README.md).

## Rust Benchmark

Fory Rust demonstrates competitive performance compared to other Rust serialization frameworks.

<img src="/img/benchmarks/rust/company.png" width="90%"/>

<img src="/img/benchmarks/rust/ecommerce_data.png" width="90%"/>

<img src="/img/benchmarks/rust/system_data.png" width="90%"/>

Note: Results depend on hardware, dataset, and implementation versions. See the Rust guide for how to run benchmarks yourself: https://github.com/apache/fory/blob/main/benchmarks/rust_benchmark/README.md

## C++ Benchmark

Fory C++ demonstrates competitive performance compared to Protobuf C++ serialization framework.

<img src="/img/benchmarks/cpp/throughput.png" width="90%"/>

## Go Benchmark

Fory Go demonstrates strong performance compared to Protobuf and Msgpack across
single-object and list workloads.

<img src="/img/blog/fory_0_16_0_release/go_benchmark_combined.png" width="90%"/>

Note: Results depend on hardware, dataset, and implementation versions. See the
Go benchmark report for details: https://fory.apache.org/docs/benchmarks/go/

## C# Benchmark

Fory C# demonstrates strong performance compared to Protobuf and Msgpack across
typed object serialization and deserialization workloads.

<img src="/img/blog/fory_0_16_0_release/csharp_benchmark_combined.png" width="90%"/>

Note: Results depend on hardware and runtime versions. See the C# benchmark
report for details: https://fory.apache.org/docs/benchmarks/csharp/

## Swift Benchmark

Fory Swift demonstrates strong performance compared to Protobuf and Msgpack
across both scalar-object and list workloads.

<img src="/img/blog/fory_0_16_0_release/swift_benchmark_combined.png" width="90%"/>

Note: Results depend on hardware and runtime versions. See the Swift benchmark
report for details: https://fory.apache.org/docs/benchmarks/swift/

## JavaScript Benchmark

This benchmark compares Apache Fory with Protocol Buffers and JSON across
representative JavaScript/Node.js workloads.

For benchmark setup, hardware/runtime details, and the full report, see
[JavaScript Benchmarks](../benchmarks/javascript/README.md).

**Throughput**:

![JavaScript Throughput](../benchmarks/javascript/throughput.png)

**Throughput Results (ops/sec)**:

| Datatype         | Operation   | fory TPS  | protobuf TPS | json TPS  | Fastest |
| ---------------- | ----------- | --------- | ------------ | --------- | ------- |
| Struct           | Serialize   | 8,453,950 | 1,903,706    | 3,058,232 | fory    |
| Struct           | Deserialize | 9,705,287 | 8,233,664    | 3,860,538 | fory    |
| Sample           | Serialize   | 1,498,391 | 422,620      | 744,790   | fory    |
| Sample           | Deserialize | 1,918,162 | 819,010      | 762,048   | fory    |
| MediaContent     | Serialize   | 1,293,157 | 729,497      | 1,299,908 | json    |
| MediaContent     | Deserialize | 1,638,086 | 1,209,140    | 921,191   | fory    |
| StructList       | Serialize   | 3,928,325 | 495,648      | 891,810   | fory    |
| StructList       | Deserialize | 3,264,827 | 1,529,744    | 986,144   | fory    |
| SampleList       | Serialize   | 355,581   | 92,741       | 163,120   | fory    |
| SampleList       | Deserialize | 424,916   | 163,253      | 162,520   | fory    |
| MediaContentList | Serialize   | 286,053   | 148,977      | 282,445   | fory    |
| MediaContentList | Deserialize | 376,826   | 244,622      | 190,155   | fory    |

**Serialized Data Sizes (bytes)**:

| Datatype         | fory | protobuf | json |
| ---------------- | ---- | -------- | ---- |
| Struct           | 58   | 61       | 103  |
| Sample           | 446  | 377      | 724  |
| MediaContent     | 391  | 307      | 596  |
| StructList       | 184  | 315      | 537  |
| SampleList       | 1980 | 1900     | 3642 |
| MediaContentList | 1665 | 1550     | 3009 |

**Per-workload Plots**:

### MediaContent

![JavaScript MediaContent](../benchmarks/javascript/mediacontent.png)

### MediaContentList

![JavaScript MediaContentList](../benchmarks/javascript/mediacontentlist.png)

### Sample

![JavaScript Sample](../benchmarks/javascript/sample.png)

### SampleList

![JavaScript SampleList](../benchmarks/javascript/samplelist.png)

### Struct

![JavaScript Struct](../benchmarks/javascript/struct.png)

### StructList

![JavaScript StructList](../benchmarks/javascript/structlist.png)

## Dart Benchmark

This benchmark compares Apache Fory with Protocol Buffers across representative
Dart workloads.

For benchmark setup, hardware/runtime details, and the full report, see
[Dart Benchmarks](../benchmarks/dart/README.md).

**Throughput**:

![Dart Throughput](../benchmarks/dart/throughput.png)

**Throughput Results (ops/sec)**:

| Datatype         | Operation   |  Fory TPS | Protobuf TPS | Fastest      |
| ---------------- | ----------- | --------: | -----------: | ------------ |
| Struct           | Serialize   | 3,989,432 |    1,884,653 | fory (2.12x) |
| Struct           | Deserialize | 5,828,197 |    4,199,680 | fory (1.39x) |
| Sample           | Serialize   | 1,649,722 |      500,167 | fory (3.30x) |
| Sample           | Deserialize | 2,060,113 |      785,109 | fory (2.62x) |
| MediaContent     | Serialize   |   800,876 |      391,235 | fory (2.05x) |
| MediaContent     | Deserialize | 1,315,115 |      683,533 | fory (1.92x) |
| StructList       | Serialize   | 1,456,396 |      367,506 | fory (3.96x) |
| StructList       | Deserialize | 1,921,006 |      645,958 | fory (2.97x) |
| SampleList       | Serialize   |   411,144 |       48,508 | fory (8.48x) |
| SampleList       | Deserialize |   464,273 |      103,558 | fory (4.48x) |
| MediaContentList | Serialize   |   186,870 |       77,029 | fory (2.43x) |
| MediaContentList | Deserialize |   330,293 |      128,215 | fory (2.58x) |

**Serialized Data Sizes (bytes)**:

| Datatype         | Fory | Protobuf |
| ---------------- | ---: | -------: |
| Struct           |   58 |       61 |
| Sample           |  446 |      377 |
| MediaContent     |  365 |      307 |
| StructList       |  184 |      315 |
| SampleList       | 1980 |     1900 |
| MediaContentList | 1535 |     1550 |

**Per-workload Plots**:

### Struct

![Dart Struct](../benchmarks/dart/struct.png)

### Sample

![Dart Sample](../benchmarks/dart/sample.png)

### MediaContent

![Dart MediaContent](../benchmarks/dart/mediacontent.png)

### StructList

![Dart StructList](../benchmarks/dart/structlist.png)

### SampleList

![Dart SampleList](../benchmarks/dart/samplelist.png)

### MediaContentList

![Dart MediaContentList](../benchmarks/dart/mediacontentlist.png)
