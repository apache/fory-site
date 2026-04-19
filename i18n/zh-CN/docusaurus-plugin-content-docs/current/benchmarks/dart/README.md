# Fory Dart 基准

该基准用于比较 Apache Fory 和 Protocol Buffers 在 Dart 中的序列化与反序列化吞吐量。

## 硬件与运行时信息

| 键                    | 值                                                               |
| --------------------- | ---------------------------------------------------------------- |
| 时间戳                | 2026-04-13T21:55:28.456625Z                                      |
| 操作系统              | Version 26.2 (Build 25C56)                                       |
| 主机                  | Macbook-Air.local                                                |
| CPU 核心数（逻辑）    | 8                                                                |
| 内存（GB）            | 8.00                                                             |
| Dart                  | 3.10.4 (stable) (Tue Dec 9 00:01:55 2025 -0800) on "macos_arm64" |
| 每个用例的采样次数    | 5                                                                |
| 每个用例的预热时长（秒） | 1.0                                                           |
| 每个用例的持续时长（秒） | 1.5                                                           |

## 吞吐结果

![Throughput](throughput.png)

| 数据类型         | 操作        |  Fory TPS | Protobuf TPS | 最快         |
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

## 序列化大小（字节）

| 数据类型         | Fory | Protobuf |
| ---------------- | ---: | -------: |
| Struct           |   58 |       61 |
| Sample           |  446 |      377 |
| MediaContent     |  365 |      307 |
| StructList       |  184 |      315 |
| SampleList       | 1980 |     1900 |
| MediaContentList | 1535 |     1550 |

## 各工作负载图表

### Struct

![Struct](struct.png)

### Sample

![Sample](sample.png)

### MediaContent

![MediaContent](mediacontent.png)

### StructList

![StructList](structlist.png)

### SampleList

![SampleList](samplelist.png)

### MediaContentList

![MediaContentList](mediacontentlist.png)
