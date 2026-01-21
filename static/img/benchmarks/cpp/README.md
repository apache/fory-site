# C++ Benchmark Performance Report

_Generated on 2025-12-15 23:03:06_

## How to Generate This Report

```bash
cd benchmarks/cpp_benchmark/build
./fory_benchmark --benchmark_format=json --benchmark_out=benchmark_results.json
cd ..
python benchmark_report.py --json-file build/benchmark_results.json --output-dir report
```

## Hardware & OS Info

| Key                        | Value                     |
| -------------------------- | ------------------------- |
| OS                         | Darwin 24.6.0             |
| Machine                    | arm64                     |
| Processor                  | arm                       |
| CPU Cores (Physical)       | 12                        |
| CPU Cores (Logical)        | 12                        |
| Total RAM (GB)             | 48.0                      |
| Benchmark Date             | 2025-12-15T23:02:49+08:00 |
| CPU Cores (from benchmark) | 12                        |

## Benchmark Plots

<p align="center">
<img src="throughput.png" width="90%">
</p>

## Benchmark Results

### Timing Results (nanoseconds)

| Datatype     | Operation   | Fory (ns) | Protobuf (ns) | Faster      |
| ------------ | ----------- | --------- | ------------- | ----------- |
| Mediacontent | Serialize   | 89.7      | 870.1         | Fory (9.7x) |
| Mediacontent | Deserialize | 368.4     | 1276.7        | Fory (3.5x) |
| Sample       | Serialize   | 59.2      | 95.5          | Fory (1.6x) |
| Sample       | Deserialize | 355.6     | 655.2         | Fory (1.8x) |
| Struct       | Serialize   | 23.5      | 40.1          | Fory (1.7x) |
| Struct       | Deserialize | 18.5      | 25.5          | Fory (1.4x) |

### Throughput Results (ops/sec)

| Datatype     | Operation   | Fory TPS   | Protobuf TPS | Faster      |
| ------------ | ----------- | ---------- | ------------ | ----------- |
| Mediacontent | Serialize   | 11,151,839 | 1,149,335    | Fory (9.7x) |
| Mediacontent | Deserialize | 2,714,139  | 783,243      | Fory (3.5x) |
| Sample       | Serialize   | 16,889,474 | 10,474,347   | Fory (1.6x) |
| Sample       | Deserialize | 2,812,439  | 1,526,317    | Fory (1.8x) |
| Struct       | Serialize   | 42,570,153 | 24,942,338   | Fory (1.7x) |
| Struct       | Deserialize | 54,146,253 | 39,213,086   | Fory (1.4x) |

### Serialized Data Sizes (bytes)

| Datatype | Fory | Protobuf |
| -------- | ---- | -------- |
| Struct   | 34   | 61       |
| Sample   | 394  | 375      |
