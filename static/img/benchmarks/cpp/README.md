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
| Mediacontent | Serialize   | 435.0     | 2104.4        | Fory (4.8x) |
| Mediacontent | Deserialize | 1361.8    | 2695.0        | Fory (2.0x) |
| Sample       | Serialize   | 219.5     | 350.8         | Fory (1.6x) |
| Sample       | Deserialize | 1133.0    | 1512.6        | Fory (1.3x) |
| Struct       | Serialize   | 51.2      | 184.0         | Fory (3.6x) |
| Struct       | Deserialize | 135.1     | 167.0         | Fory (1.2x) |

### Throughput Results (ops/sec)

| Datatype     | Operation   | Fory TPS   | Protobuf TPS | Faster      |
| ------------ | ----------- | ---------- | ------------ | ----------- |
| Mediacontent | Serialize   | 2,298,686  | 475,190      | Fory (4.8x) |
| Mediacontent | Deserialize | 734,318    | 371,056      | Fory (2.0x) |
| Sample       | Serialize   | 4,556,001  | 2,850,266    | Fory (1.6x) |
| Sample       | Deserialize | 882,650    | 661,107      | Fory (1.3x) |
| Struct       | Serialize   | 19,541,982 | 5,436,142    | Fory (3.6x) |
| Struct       | Deserialize | 7,402,696  | 5,987,231    | Fory (1.2x) |

### Serialized Data Sizes (bytes)

| Datatype | Fory | Protobuf |
| -------- | ---- | -------- |
| Struct   | 34   | 61       |
| Sample   | 394  | 375      |
