# JVM JSON 字节数组格式测量

本次对比使用未修改的 jsoniter-scala `ArrayOfBytesReading`、`ArrayOfBytesWriting`、
`Base16Reading` 和 `Base16Writing` 工作负载，参数为 `size=512`，覆盖数字字节数组和 Base16 字符串。
吞吐量越高越好。

最终 12 组相邻配对对比的提升均超过 10%。数字数组读取的余量较小，最小提升为 10.05%。
这些是本地稳态测量，不保证其他大小、数据分布、机器或 JVM 上的结果。

## 结果

| 工作负载 | jsoniter-scala 中位数，ops/s | Fory 中位数，ops/s | 配对提升中位数 | 配对范围 |
| --- | ---: | ---: | ---: | ---: |
| 数字字节数组读取 | 646,911 | 713,856 | +10.18% | +10.05% 至 +11.55% |
| 数字字节数组写入 | 1,539,685 | 3,350,581 | +117.93% | +116.07% 至 +118.36% |
| Base16 读取 | 2,914,929 | 3,585,325 | +22.18% | +15.26% 至 +24.77% |
| Base16 写入 | 8,444,372 | 9,639,286 | +15.94% | +13.78% 至 +16.00% |

每组配对比较五轮测量迭代的均值。提升列是配对比值的中位数，不是两个独立中位数之比。
保留全部最终样本。较早、较短的数字数组读取对比分别测得 +8.59% 和 +13.01%，也保留在证据中，
说明不能将最终的小幅余量推广到其他环境。

Fory 数字数组读取每次操作分配约 528 B，jsoniter-scala 约 1,128 B。
数字数组输出两者均约 1,888 B，Base16 输入约 528 B，Base16 输出约 1,048 B。
两者均使用返回独立数组的 API，不使用预分配输出的基准测试。
这些稳态分配数据不包含启动及保留的查找表内存；Fory 的 Base16 输出表在首次使用后占用 256 KiB。

受影响的整数读取路径还与优化前的 Fory 版本做了两组相邻配对比较，变化为 +1.41% 和 +1.01%，
处于通常视为噪声的范围；这些运行中未观察到回退。

[迭代样本、分配量、配对结果及制品哈希](byte-array-formats-results.json)以 JSON 提供。

## 工作负载与配置

输入字节为基准测试原有的 `(1 to size).map(_.toByte).toArray` 序列。
数字数组保留原有有符号十进制 JSON 表示，Base16 保留原有小写十六进制字符串。
模型、输入、期望输出和 jsoniter-scala 实现均未修改，只启用了缺失的 Fory 适配器及其已有正确性规格。

Fory 使用通过公共 builder 分别配置的实例：

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonByteArray;

ForyJson arrays = ForyJson.builder().byteArrayFormat(JsonByteArray.Format.ARRAY).build();
ForyJson hex = ForyJson.builder().byteArrayFormat(JsonByteArray.Format.BASE16).build();
```

读取适配器调用 `fromJson(jsonBytes, classOf[Array[Byte]])`，写入适配器调用 `toJsonBytes(obj)`。
这些配置也适用于嵌套字节数组，不是基准测试专用编解码器。

## 环境与版本

- 日期：2026 年 9 月 21 日。
- Apple M4 Pro，12 个逻辑 CPU，48 GiB RAM；macOS 15.7.2 arm64。
- OpenJDK 25.0.3；JMH 1.37。
- Fory：`13739263ebf31af5fc962184aaccf2833f8ffc9a`，版本 `1.8.0-SNAPSHOT`。
- Fory 优化前基线：`e1d2f9d67800901392755b1133968d448ab076b8`。
- jsoniter-scala：`2.40.2-SNAPSHOT`，检出版本 `71b2ba16f1d5261e2be4e98d5dfe4be452d0e136`；
  Fory 适配器新增内容基于 `84cb277f2c2a16b4018bc61fdeec3eed62252a1e`。
- 基准测试 Scala：3.9.0；Fory JSON Scala：3.3.8。
- 每次运行一个线程和一个 fork；三轮 1 秒预热、五轮 1 秒测量；
  `-Xms1g -Xmx1g -XX:+UseParallelGC`；JMH GC profiler。
- 每个工作负载三组相邻配对，顺序为 jsoniter/Fory、Fory/jsoniter、jsoniter/Fory。
  所有运行串行进行，保留日常桌面后台活动。

测量期间 runtime、core、Scala 和基准测试 jar 固定不变。
基线/当前版本对照中只替换 Fory JSON runtime jar。

## 复现

构建基准测试 assembly 前，先安装 Fory core、JSON 和 JSON Scala 制品。
使用本地发布的快照时启用 Maven Local：

```bash
sbt --java-home "$JAVA_HOME" \
  'set ThisBuild / resolvers += Resolver.mavenLocal' \
  '++3.9.0!' 'jsoniter-scala-benchmarkJVM/assembly'
```

每个方法在独立进程中运行，并在配对之间交替库的执行顺序。两个方法使用同一固定 classpath：

```bash
java -cp "$FORY_JSON_JAR:$FORY_SCALA_JAR:$FORY_CORE_JAR:$BENCHMARK_JAR" \
  org.openjdk.jmh.Main ".*\.${CASE}\.${METHOD}$" \
  -t 1 -f 1 -wi 3 -i 5 -w 1s -r 1s -p size=512 \
  -jvmArgs '-Xms1g -Xmx1g -XX:+UseParallelGC' -foe true -prof gc \
  -rf json -rff "$RESULT_FILE"
```

`CASE` 为上述四个工作负载之一，`METHOD` 为 `fory` 或 `jsoniterScala`。
这里没有测量 GraalVM 或原生镜像性能。
