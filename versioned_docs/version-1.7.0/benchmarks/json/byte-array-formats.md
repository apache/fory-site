# JVM JSON byte-array format measurements

This comparison covers numeric byte arrays and Base16 strings on the unchanged
jsoniter-scala `ArrayOfBytesReading`, `ArrayOfBytesWriting`, `Base16Reading`, and
`Base16Writing` workloads at `size=512`. Higher throughput is better.

All 12 final adjacent comparison pairs exceed 10%. Numeric-array reading has a
narrow margin: its smallest measured improvement is 10.05%. These are local
steady-state measurements, not a guarantee for other sizes, data distributions,
machines, or JVMs.

## Results

| Workload                   | jsoniter-scala median, ops/s | Fory median, ops/s | Median paired improvement |         Paired range |
| -------------------------- | ---------------------------: | -----------------: | ------------------------: | -------------------: |
| Numeric byte-array reading |                      646,911 |            713,856 |                   +10.18% |   +10.05% to +11.55% |
| Numeric byte-array writing |                    1,539,685 |          3,350,581 |                  +117.93% | +116.07% to +118.36% |
| Base16 reading             |                    2,914,929 |          3,585,325 |                   +22.18% |   +15.26% to +24.77% |
| Base16 writing             |                    8,444,372 |          9,639,286 |                   +15.94% |   +13.78% to +16.00% |

Each pair compares the means of five measurement iterations. The improvement
column is the median of those paired ratios, not the ratio of independent medians.
All final samples are retained. Earlier, shorter numeric-reading comparisons
measured +8.59% and +13.01%; they are also included in the evidence and illustrate
why the final narrow margin should not be generalized.

Allocation per operation is approximately 528 B for Fory numeric-array reading
and 1,128 B for jsoniter-scala. Both libraries allocate about 1,888 B for numeric
array output, 528 B for Base16 input, and 1,048 B for Base16 output. Both use APIs
that return independent arrays; neither uses the preallocated-output benchmark.
Startup and retained lookup-table memory are outside these steady-state allocation
figures. Fory's Base16 output table occupies 256 KiB after its first use.

The affected integer-reading path was also compared with the pre-optimization
Fory revision in two adjacent pairs. Changes were +1.41% and +1.01%, within the
range normally treated as noise; no regression was observed in those runs.

[Iteration samples, allocations, paired results, and artifact hashes](byte-array-formats-results.json)
are available as JSON.

## Workloads and configuration

The input bytes are the benchmark's original sequence
`(1 to size).map(_.toByte).toArray`. Numeric arrays keep the original signed decimal
JSON representation. Base16 keeps the original lowercase hexadecimal string.
Models, inputs, expected outputs, and jsoniter-scala implementations are unchanged.
Only the missing Fory adapters and their existing correctness specs are enabled.

Fory uses separate instances configured through its public builder:

```java
import org.apache.fory.json.ForyJson;
import org.apache.fory.json.annotation.JsonByteArray;

ForyJson arrays = ForyJson.builder().byteArrayFormat(JsonByteArray.Format.ARRAY).build();
ForyJson hex = ForyJson.builder().byteArrayFormat(JsonByteArray.Format.BASE16).build();
```

Each reading adapter calls `fromJson(jsonBytes, classOf[Array[Byte]])`; each writing
adapter calls `toJsonBytes(obj)`. These configurations also apply to nested byte
arrays; they are not benchmark-specific codecs.

## Environment and revisions

- Date: September 21, 2026.
- Apple M4 Pro, 12 logical CPUs, 48 GiB RAM; macOS 15.7.2 arm64.
- OpenJDK 25.0.3; JMH 1.37.
- Fory: `13739263ebf31af5fc962184aaccf2833f8ffc9a`, version `1.8.0-SNAPSHOT`.
- Fory pre-optimization baseline: `e1d2f9d67800901392755b1133968d448ab076b8`.
- jsoniter-scala: `2.40.2-SNAPSHOT`, checkout
  `71b2ba16f1d5261e2be4e98d5dfe4be452d0e136`; its Fory adapter additions are based on
  `84cb277f2c2a16b4018bc61fdeec3eed62252a1e`.
- Benchmark Scala: 3.9.0; Fory JSON Scala: 3.3.8.
- One thread and one fork per run; three 1-second warmups and five 1-second
  measurements; `-Xms1g -Xmx1g -XX:+UseParallelGC`; JMH GC profiler.
- Three adjacent pairs per workload. Order is jsoniter/Fory, Fory/jsoniter,
  jsoniter/Fory. Runs are serial; normal desktop background activity remains.

The runtime, core, Scala, and benchmark jars are frozen during measurement. Only
the Fory JSON runtime jar changes in baseline/current controls.

## Reproduction

Install Fory core, JSON, and JSON Scala artifacts before building the benchmark
assembly. Enable Maven Local when using locally published snapshots:

```bash
sbt --java-home "$JAVA_HOME" \
  'set ThisBuild / resolvers += Resolver.mavenLocal' \
  '++3.9.0!' 'jsoniter-scala-benchmarkJVM/assembly'
```

Run each method as a separate process, alternating the library order between
pairs. Use the same frozen classpath for both methods:

```bash
java -cp "$FORY_JSON_JAR:$FORY_SCALA_JAR:$FORY_CORE_JAR:$BENCHMARK_JAR" \
  org.openjdk.jmh.Main ".*\.${CASE}\.${METHOD}$" \
  -t 1 -f 1 -wi 3 -i 5 -w 1s -r 1s -p size=512 \
  -jvmArgs '-Xms1g -Xmx1g -XX:+UseParallelGC' -foe true -prof gc \
  -rf json -rff "$RESULT_FILE"
```

`CASE` is one of the four workload names above; `METHOD` is `fory` or
`jsoniterScala`. No GraalVM or native-image performance is measured here.
