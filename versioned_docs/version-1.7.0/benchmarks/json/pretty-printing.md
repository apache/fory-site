# JVM JSON pretty-printing measurements

These measurements cover `ForyJson.toPrettyJsonBytes` on the jsoniter-scala
`GoogleMapsAPIPrettyPrinting` workload and check compact output on the Java
`JsonSerializationSuite` MediaContent workload. Higher throughput is better.

The pretty-printing comparison exceeds the 10% improvement target. Compact throughput point
estimates are within the 2% regression threshold, but their uncertainty does **not** establish
that threshold reliably. In particular, the String safeguard remains inconclusive.

## Results

| Workload                                   | Reference median, ops/s | Fory median, ops/s | Paired geometric change | One-sided 95% lower bound | Pairs |
| ------------------------------------------ | ----------------------: | -----------------: | ----------------------: | ------------------------: | ----: |
| Google Maps pretty UTF-8 vs jsoniter-scala |                 169,914 |            205,722 |                 +21.39% |                   +17.89% |     4 |
| MediaContent compact UTF-8 vs Fory base    |              10,845,923 |         10,962,601 |                  +0.87% |                    -2.71% |     4 |
| MediaContent compact String vs Fory base   |               8,383,745 |          8,199,076 |                  -1.35% |                    -6.27% |     6 |

Changes aggregate the ratios of adjacent reference/current runs, rather than dividing the two
independent medians. The lower bound uses Student's t on log ratios. All pairs are retained;
none are excluded. String pair changes range from -7.72% to +10.93%, so the average must not be
read as a stable guarantee of less than 2% regression.

Compact allocation remains approximately 504 B/op for UTF-8 and 528 B/op for String on both
revisions. Pretty output allocates 26,120–26,200 B/op for Fory and 25,408 B/op for jsoniter-scala.
The comparison uses each library's detached byte-array API, not preallocated output.

[All iteration samples, allocation measurements, pair totals, and artifact hashes](pretty-printing-results.json)
are available as JSON.

## Workload and formatting

The original Google Maps model and input are unchanged. The adapter calls
`Fory.foryJson.toPrettyJsonBytes(obj)`; the reference calls ordinary `jsoniterScala`, not
`jsoniterScalaPrealloc`. The Scala 2 and Scala 3 correctness specs compare Fory with the existing
Jackson expected output without changing the fixture or its expectations.

Both libraries use two-space multiline object and array indentation. Fory follows the workload's
Jackson formatting, including spaces on both sides of colons. jsoniter-scala keeps its original
format, with a space after the colon. Their output byte sequences and sizes therefore differ.
Fory emits indentation during serialization; it does not reformat a completed compact document.

The compact controls use the unchanged `benchmarks/java` MediaContent model and Eishay input.
Only the Fory JSON runtime jar changes between reference and current; the core and benchmark
jars are frozen.

## Environment and revisions

- Date: September 21, 2026.
- Machine: Apple M4 Pro, 12 CPU cores, 48 GiB RAM; macOS 15.7.2 arm64.
- JDK: OpenJDK 25.0.3; JMH 1.37.
- Fory source: `2b8af43f17c98633538594ab6ff942591728c0a4`, version `1.8.0-SNAPSHOT`.
- Compact reference: `509a096aa3ac68c0ca9ee248d085db7855523584`.
- jsoniter-scala benchmark checkout: `84cb277f2c2a16b4018bc61fdeec3eed62252a1e`,
  including the Fory pretty adapter, version `2.40.2-SNAPSHOT`.
- Scala: benchmark 3.9.0; Fory JSON Scala and jsoniter-scala core/macros 3.3.8.
- Each run: one fork, one thread, three 1-second warmups, five 1-second measurements.
- JVM options: `-Xms1g -Xmx1g -XX:+UseParallelGC`; JMH GC profiler enabled.
- Runs execute serially in adjacent reference/current pairs on the same machine. Background
  desktop activity remains present, and the measured uncertainty is reported above.

## Reproduction

Build the Fory core and JSON jars from each source revision and retain them separately. Build the
Java benchmark jar using `mvn -f benchmarks/java/pom.xml -Pjmh -DskipTests package`. Install the
current Fory JSON Scala module before building the jsoniter-scala benchmark assembly with Scala
3.9.0. Use the corresponding frozen jars in the following commands:

```bash
java -cp "$RUNTIME_JAR:$CORE_JAR:$MEDIA_BENCHMARK_JAR" org.openjdk.jmh.Main \
  '.*JsonSerializationSuite.foryToJsonString$' \
  -t 1 -f 1 -wi 3 -i 5 -w 1s -r 1s -bm thrpt -tu s \
  -jvmArgs '-Xms1g -Xmx1g -XX:+UseParallelGC' -foe true -prof gc \
  -rf json -rff "$RESULT_FILE"
```

For compact UTF-8, select `.*JsonSerializationSuite.foryToJsonBytes$`. Run the base jar immediately
before the current jar for each pair.

```bash
java -cp "$SCALA_JSON_JAR:$RUNTIME_JAR:$CORE_JAR:$SCALA_BENCHMARK_JAR" org.openjdk.jmh.Main \
  '.*GoogleMapsAPIPrettyPrinting.fory$' \
  -t 1 -f 1 -wi 3 -i 5 -w 1s -r 1s -bm thrpt -tu s \
  -jvmArgs '-Xms1g -Xmx1g -XX:+UseParallelGC' -foe true -prof gc \
  -rf json -rff "$RESULT_FILE"
```

Run `.*GoogleMapsAPIPrettyPrinting.jsoniterScala$` immediately before each Fory run using the same
classpath and JVM settings.
