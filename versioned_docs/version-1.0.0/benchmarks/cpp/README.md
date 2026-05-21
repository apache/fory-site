# C++ Benchmark Performance Report

_Generated on 2026-05-08 17:54:45_

## How to Generate This Report

```bash
cd benchmarks/cpp/build
./fory_benchmark --benchmark_format=json --benchmark_out=benchmark_results.json
cd ..
python benchmark_report.py --json-file build/benchmark_results.json --output-dir report
```

## Benchmark Plot

The plot shows throughput (ops/sec); higher is better.

![Throughput](throughput.png)

## Hardware & OS Info

| Key                        | Value                     |
| -------------------------- | ------------------------- |
| OS                         | Darwin 24.6.0             |
| Machine                    | arm64                     |
| Processor                  | arm                       |
| CPU Cores (Physical)       | 12                        |
| CPU Cores (Logical)        | 12                        |
| Total RAM (GB)             | 48.0                      |
| Benchmark Date             | 2026-05-08T16:29:28+08:00 |
| CPU Cores (from benchmark) | 12                        |

## Benchmark Results

### Timing Results (nanoseconds)

| Datatype          | Operation   | fory (ns) | protobuf (ns) | msgpack (ns) | Fastest |
| ----------------- | ----------- | --------- | ------------- | ------------ | ------- |
| NumericStruct     | Serialize   | 24.9      | 48.2          | 91.0         | fory    |
| NumericStruct     | Deserialize | 26.6      | 33.0          | 1194.5       | fory    |
| Sample            | Serialize   | 62.3      | 97.3          | 314.6        | fory    |
| Sample            | Deserialize | 371.1     | 689.0         | 2649.9       | fory    |
| MediaContent      | Serialize   | 115.0     | 857.2         | 311.7        | fory    |
| MediaContent      | Deserialize | 406.5     | 1193.1        | 3311.1       | fory    |
| NumericStructList | Serialize   | 81.7      | 495.0         | 485.6        | fory    |
| NumericStructList | Deserialize | 180.9     | 410.6         | 5733.1       | fory    |
| SampleList        | Serialize   | 284.9     | 5004.9        | 1579.6       | fory    |
| SampleList        | Deserialize | 1928.7    | 5118.1        | 13396.8      | fory    |
| MediaContentList  | Serialize   | 464.8     | 4861.1        | 1671.1       | fory    |
| MediaContentList  | Deserialize | 2099.8    | 6610.3        | 13963.4      | fory    |

### Throughput Results (ops/sec)

| Datatype          | Operation   | fory TPS   | protobuf TPS | msgpack TPS | Fastest |
| ----------------- | ----------- | ---------- | ------------ | ----------- | ------- |
| NumericStruct     | Serialize   | 40,087,668 | 20,733,305   | 10,989,907  | fory    |
| NumericStruct     | Deserialize | 37,606,127 | 30,296,744   | 837,189     | fory    |
| Sample            | Serialize   | 16,041,299 | 10,277,207   | 3,178,983   | fory    |
| Sample            | Deserialize | 2,694,434  | 1,451,449    | 377,373     | fory    |
| MediaContent      | Serialize   | 8,698,574  | 1,166,539    | 3,208,626   | fory    |
| MediaContent      | Deserialize | 2,460,094  | 838,185      | 302,013     | fory    |
| NumericStructList | Serialize   | 12,240,275 | 2,020,102    | 2,059,276   | fory    |
| NumericStructList | Deserialize | 5,527,333  | 2,435,246    | 174,427     | fory    |
| SampleList        | Serialize   | 3,510,210  | 199,804      | 633,061     | fory    |
| SampleList        | Deserialize | 518,490    | 195,386      | 74,645      | fory    |
| MediaContentList  | Serialize   | 2,151,560  | 205,715      | 598,396     | fory    |
| MediaContentList  | Deserialize | 476,241    | 151,280      | 71,616      | fory    |

### Serialized Data Sizes (bytes)

| Datatype          | fory | protobuf | msgpack |
| ----------------- | ---- | -------- | ------- |
| NumericStruct     | 78   | 93       | 87      |
| Sample            | 445  | 375      | 530     |
| MediaContent      | 362  | 301      | 480     |
| NumericStructList | 255  | 475      | 449     |
| SampleList        | 1978 | 1890     | 2664    |
| MediaContentList  | 1531 | 1520     | 2421    |
