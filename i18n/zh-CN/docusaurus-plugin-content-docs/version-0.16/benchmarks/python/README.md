# Python 基准性能报告

_生成于 2026-03-03 13:42:38_

## 如何生成本报告

```bash
cd benchmarks/python
./run.sh
```

## 硬件与操作系统信息

| 键                    | 值                           |
| --------------------- | ---------------------------- |
| 操作系统              | Darwin 24.6.0                |
| 机器架构              | arm64                        |
| 处理器                | arm                          |
| Python                | 3.10.8                       |
| CPU 核心数（物理）    | 12                           |
| CPU 核心数（逻辑）    | 12                           |
| 总内存（GB）          | 48.0                         |
| Python 实现           | CPython                      |
| 基准平台              | macOS-15.7.2-arm64-arm-64bit |

## 基准配置

| 键         | 值    |
| ---------- | ----- |
| warmup     | 3     |
| iterations | 15    |
| repeat     | 5     |
| number     | 1000  |
| list_size  | 5     |

## 基准图表

所有图表均展示吞吐量（ops/sec）；数值越高越好。

### 总吞吐量

<p align="center">
<img src="throughput.png" width="90%" />
</p>

### `MediaContent` 基准

<p align="center">
<img src="mediacontent.png" width="90%" />
</p>

### `MediaContentList` 基准

<p align="center">
<img src="mediacontentlist.png" width="90%" />
</p>

### Sample

<p align="center">
<img src="sample.png" width="90%" />
</p>

### Samplelist

<p align="center">
<img src="samplelist.png" width="90%" />
</p>

### Struct

<p align="center">
<img src="struct.png" width="90%" />
</p>

### Structlist

<p align="center">
<img src="structlist.png" width="90%" />
</p>

## 基准结果

### 延迟结果（纳秒）

| 数据类型         | 操作        | fory (ns) | pickle (ns) | protobuf (ns) | 最快    |
| ---------------- | ----------- | --------- | ----------- | ------------- | ------- |
| Struct           | Serialize   | 417.9     | 868.9       | 548.9         | fory    |
| Struct           | Deserialize | 516.1     | 910.6       | 742.4         | fory    |
| Sample           | Serialize   | 828.1     | 1663.5      | 2383.7        | fory    |
| Sample           | Deserialize | 1282.4    | 2296.3      | 3992.7        | fory    |
| MediaContent     | Serialize   | 1139.9    | 2859.7      | 2867.1        | fory    |
| MediaContent     | Deserialize | 1719.5    | 2854.3      | 3236.1        | fory    |
| StructList       | Serialize   | 1009.1    | 2630.6      | 3281.6        | fory    |
| StructList       | Deserialize | 1387.2    | 2651.9      | 3547.9        | fory    |
| SampleList       | Serialize   | 2828.3    | 5541.0      | 15256.6       | fory    |
| SampleList       | Deserialize | 5043.4    | 8144.7      | 18912.5       | fory    |
| MediaContentList | Serialize   | 3417.9    | 9341.9      | 15853.2       | fory    |
| MediaContentList | Deserialize | 6138.7    | 8435.3      | 16442.6       | fory    |

### 吞吐结果（ops/sec）

| 数据类型         | 操作        | fory TPS  | pickle TPS | protobuf TPS | 最快    |
| ---------------- | ----------- | --------- | ---------- | ------------ | ------- |
| Struct           | Serialize   | 2,393,086 | 1,150,946  | 1,821,982    | fory    |
| Struct           | Deserialize | 1,937,707 | 1,098,170  | 1,346,915    | fory    |
| Sample           | Serialize   | 1,207,542 | 601,144    | 419,511      | fory    |
| Sample           | Deserialize | 779,789   | 435,489    | 250,460      | fory    |
| MediaContent     | Serialize   | 877,300   | 349,688    | 348,780      | fory    |
| MediaContent     | Deserialize | 581,563   | 350,354    | 309,018      | fory    |
| StructList       | Serialize   | 991,017   | 380,145    | 304,732      | fory    |
| StructList       | Deserialize | 720,901   | 377,081    | 281,855      | fory    |
| SampleList       | Serialize   | 353,574   | 180,473    | 65,545       | fory    |
| SampleList       | Deserialize | 198,280   | 122,780    | 52,875       | fory    |
| MediaContentList | Serialize   | 292,578   | 107,045    | 63,079       | fory    |
| MediaContentList | Deserialize | 162,902   | 118,550    | 60,818       | fory    |

### 序列化数据大小（字节）

| 数据类型         | fory | pickle | protobuf |
| ---------------- | ---- | ------ | -------- |
| Struct           | 72   | 126    | 61       |
| Sample           | 517  | 793    | 375      |
| MediaContent     | 470  | 586    | 301      |
| StructList       | 205  | 420    | 315      |
| SampleList       | 1810 | 2539   | 1890     |
| MediaContentList | 1756 | 1377   | 1520     |
