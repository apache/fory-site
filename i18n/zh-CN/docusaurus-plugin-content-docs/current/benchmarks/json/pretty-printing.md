# JVM JSON 格式化输出测量

本次测量覆盖 jsoniter-scala `GoogleMapsAPIPrettyPrinting` 工作负载上的
`ForyJson.toPrettyJsonBytes`，并检查 Java `JsonSerializationSuite` MediaContent 工作负载的紧凑输出。
吞吐量越高越好。

格式化输出对比超过了 10% 的提升目标。紧凑输出的吞吐量点估计位于 2% 回退阈值以内，
但其不确定性**不足以**可靠地证明该阈值，尤其是 String 对照仍无法得出确定结论。

## 结果

| 工作负载                                      | 参考中位数，ops/s | Fory 中位数，ops/s | 配对几何变化 | 单侧 95% 下界 | 配对数 |
| --------------------------------------------- | ----------------: | -----------------: | -----------: | ------------: | -----: |
| Google Maps 格式化 UTF-8，对比 jsoniter-scala |           169,914 |            205,722 |      +21.39% |       +17.89% |      4 |
| MediaContent 紧凑 UTF-8，对比 Fory 基线       |        10,845,923 |         10,962,601 |       +0.87% |        -2.71% |      4 |
| MediaContent 紧凑 String，对比 Fory 基线      |         8,383,745 |          8,199,076 |       -1.35% |        -6.27% |      6 |

变化汇总相邻参考/当前运行的比值，不是两个独立中位数相除。下界对比值的对数使用 Student t 分布计算。
所有配对均保留，没有剔除。String 配对变化介于 -7.72% 和 +10.93%，
不能把平均值视为稳定低于 2% 回退的保证。

两个版本的紧凑输出分配量均约为 UTF-8 504 B/op、String 528 B/op。
格式化输出中 Fory 分配 26,120–26,200 B/op，jsoniter-scala 分配 25,408 B/op。
对比使用各库返回独立字节数组的 API，不使用预分配输出。

[全部迭代样本、分配测量、配对汇总及制品哈希](pretty-printing-results.json)以 JSON 提供。

## 工作负载与格式

原有 Google Maps 模型和输入未修改。适配器调用 `Fory.foryJson.toPrettyJsonBytes(obj)`；
参考实现调用普通 `jsoniterScala`，而非 `jsoniterScalaPrealloc`。
Scala 2 和 Scala 3 正确性规格将 Fory 与已有 Jackson 期望输出比较，没有修改 fixture 或预期结果。

两者均对对象和数组使用两个空格的多行缩进。Fory 遵循该工作负载的 Jackson 格式，包括冒号两侧的空格；
jsoniter-scala 保留原有格式，仅在冒号后加空格。因此两者的输出字节序列和大小不同。
Fory 在序列化时直接输出缩进，不会对已完成的紧凑文档重新格式化。

紧凑输出对照使用未修改的 `benchmarks/java` MediaContent 模型和 Eishay 输入。
参考与当前版本之间只替换 Fory JSON runtime jar，core 和基准测试 jar 保持固定。

## 环境与版本

- 日期：2026 年 9 月 21 日。
- 机器：Apple M4 Pro，12 个 CPU 核心，48 GiB RAM；macOS 15.7.2 arm64。
- JDK：OpenJDK 25.0.3；JMH 1.37。
- Fory 源码：`2b8af43f17c98633538594ab6ff942591728c0a4`，版本 `1.8.0-SNAPSHOT`。
- 紧凑输出参考版本：`509a096aa3ac68c0ca9ee248d085db7855523584`。
- jsoniter-scala 基准测试检出版本：`84cb277f2c2a16b4018bc61fdeec3eed62252a1e`，
  包含 Fory 格式化输出适配器，版本 `2.40.2-SNAPSHOT`。
- Scala：基准测试为 3.9.0；Fory JSON Scala 和 jsoniter-scala core/macros 为 3.3.8。
- 每次运行：一个 fork、一个线程、三轮 1 秒预热、五轮 1 秒测量。
- JVM 参数：`-Xms1g -Xmx1g -XX:+UseParallelGC`；启用 JMH GC profiler。
- 同一机器上按相邻参考/当前配对串行运行。保留桌面后台活动，测量不确定性如上所示。

## 复现

从各自源码版本构建 Fory core 和 JSON jar，并分别保留。使用
`mvn -f benchmarks/java/pom.xml -Pjmh -DskipTests package` 构建 Java 基准测试 jar。
以 Scala 3.9.0 构建 jsoniter-scala 基准测试 assembly 前，先安装当前 Fory JSON Scala 模块。
以下命令使用对应的固定 jar：

```bash
java -cp "$RUNTIME_JAR:$CORE_JAR:$MEDIA_BENCHMARK_JAR" org.openjdk.jmh.Main \
  '.*JsonSerializationSuite.foryToJsonString$' \
  -t 1 -f 1 -wi 3 -i 5 -w 1s -r 1s -bm thrpt -tu s \
  -jvmArgs '-Xms1g -Xmx1g -XX:+UseParallelGC' -foe true -prof gc \
  -rf json -rff "$RESULT_FILE"
```

紧凑 UTF-8 选择 `.*JsonSerializationSuite.foryToJsonBytes$`。
每个配对都先运行基线 jar，紧接着运行当前 jar。

```bash
java -cp "$SCALA_JSON_JAR:$RUNTIME_JAR:$CORE_JAR:$SCALA_BENCHMARK_JAR" org.openjdk.jmh.Main \
  '.*GoogleMapsAPIPrettyPrinting.fory$' \
  -t 1 -f 1 -wi 3 -i 5 -w 1s -r 1s -bm thrpt -tu s \
  -jvmArgs '-Xms1g -Xmx1g -XX:+UseParallelGC' -foe true -prof gc \
  -rf json -rff "$RESULT_FILE"
```

使用同一 classpath 和 JVM 设置，在每次 Fory 运行前立即运行
`.*GoogleMapsAPIPrettyPrinting.jsoniterScala$`。
