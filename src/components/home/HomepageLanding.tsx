import React, { useMemo, useState } from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import CodeBlock from "@theme/CodeBlock";
import styles from "./HomepageLanding.module.css";

type RuntimeId =
  | "java"
  | "python"
  | "rust"
  | "go"
  | "cpp"
  | "javascript"
  | "csharp"
  | "swift"
  | "dart"
  | "scala"
  | "kotlin"
  | "xlang";

type RuntimeExample = {
  id: RuntimeId;
  label: string;
  install: string;
  installLanguage: string;
  codeLanguage: string;
  code: string;
  guide: string;
  summary: string;
};

type Copy = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimary: string;
  heroSecondary: string;
  heroGithub: string;
  heroVersion: string;
  heroRuntimes: string;
  heroBenchmarks: string;
  heroApache: string;
  heroPanelTitle: string;
  heroPanelSubtitle: string;
  heroFlowSource: string;
  heroFlowWire: string;
  heroFlowTarget: string;
  quickEyebrow: string;
  quickTitle: string;
  quickSubtitle: string;
  installLabel: string;
  codeLabel: string;
  guideLabel: string;
  capabilitiesEyebrow: string;
  capabilitiesTitle: string;
  capabilitiesSubtitle: string;
  performanceEyebrow: string;
  performanceTitle: string;
  performanceSubtitle: string;
  benchmarkCta: string;
  useCasesEyebrow: string;
  useCasesTitle: string;
  useCasesSubtitle: string;
  ecosystemTitle: string;
  ecosystemSubtitle: string;
};

const copies: Record<"en" | "zh", Copy> = {
  en: {
    heroEyebrow: "Apache Fory 1.0",
    heroTitle: "Fast object serialization across languages.",
    heroSubtitle:
      "Fory serializes native domain objects, preserves object graphs, and gives teams a compact cross-language wire format with Schema IDL when contracts need to be explicit.",
    heroPrimary: "Get Started",
    heroSecondary: "View Docs",
    heroGithub: "GitHub",
    heroVersion: "1.0.0 release",
    heroRuntimes: "12 runtime entries",
    heroBenchmarks: "Benchmarks by language",
    heroApache: "Apache project",
    heroPanelTitle: "Native objects in, portable bytes out",
    heroPanelSubtitle:
      "Use xlang mode for payloads that cross runtime boundaries, or native mode for same-runtime hot paths.",
    heroFlowSource: "Java object",
    heroFlowWire: "Fory payload",
    heroFlowTarget: "Python object",
    quickEyebrow: "Quick start",
    quickTitle: "Choose a runtime and copy a current example.",
    quickSubtitle:
      "The homepage examples are intentionally short. Each one links to the full guide for configuration, schema evolution, references, and production notes.",
    installLabel: "Install",
    codeLabel: "Serialize / deserialize",
    guideLabel: "Open guide",
    capabilitiesEyebrow: "Core capabilities",
    capabilitiesTitle: "Built for language boundaries, object graphs, and hot paths.",
    capabilitiesSubtitle:
      "Fory combines a portable wire format with runtime-specific optimization and object-graph semantics that ordinary IDL-first serializers often flatten away.",
    performanceEyebrow: "Performance",
    performanceTitle: "Keep hot paths compact, typed, and fast.",
    performanceSubtitle:
      "Homepage numbers stay high level; the full charts, raw notes, and reproduction details remain in the benchmark documentation.",
    benchmarkCta: "View full benchmark charts",
    useCasesEyebrow: "Use cases",
    useCasesTitle: "Built for language boundaries and data-heavy systems.",
    useCasesSubtitle:
      "Use Fory where object graphs, schema evolution, and high-throughput binary data need to coexist.",
    ecosystemTitle: "Choose the adoption path that matches your system.",
    ecosystemSubtitle:
      "Move from a single runtime to shared schemas and measured performance without changing the object model.",
  },
  zh: {
    heroEyebrow: "Apache Fory 1.0",
    heroTitle: "面向多语言系统的高性能对象序列化。",
    heroSubtitle:
      "Fory 直接序列化原生领域对象，保留对象图语义，并提供紧凑的跨语言线格式；当团队需要显式契约时，也可以使用 Schema IDL。",
    heroPrimary: "开始使用",
    heroSecondary: "查看文档",
    heroGithub: "GitHub",
    heroVersion: "1.0.0 版本",
    heroRuntimes: "12 个运行时入口",
    heroBenchmarks: "多语言性能测试",
    heroApache: "Apache 项目",
    heroPanelTitle: "原生对象输入，可移植字节输出",
    heroPanelSubtitle:
      "跨运行时载荷使用 xlang 模式；同一运行时的热点路径可以选择 native 模式。",
    heroFlowSource: "Java 对象",
    heroFlowWire: "Fory 载荷",
    heroFlowTarget: "Python 对象",
    quickEyebrow: "快速开始",
    quickTitle: "选择运行时，复制当前可用示例。",
    quickSubtitle:
      "首页示例刻意保持精简。每个示例都会链接到完整指南，覆盖配置、Schema 演进、引用和生产使用注意事项。",
    installLabel: "安装",
    codeLabel: "序列化 / 反序列化",
    guideLabel: "打开指南",
    capabilitiesEyebrow: "核心能力",
    capabilitiesTitle: "面向语言边界、对象图和热点路径而设计。",
    capabilitiesSubtitle:
      "Fory 将可移植线格式、运行时定制优化和对象图语义结合起来，避免传统 IDL 优先序列化器常见的语义压平。",
    performanceEyebrow: "性能",
    performanceTitle: "让热点路径保持紧凑、类型化和高速。",
    performanceSubtitle:
      "首页只保留高层性能入口；完整图表、原始说明和复现细节仍保留在 Benchmark 文档中。",
    benchmarkCta: "查看完整性能图表",
    useCasesEyebrow: "使用场景",
    useCasesTitle: "为语言边界和数据密集型系统而设计。",
    useCasesSubtitle:
      "当对象图、Schema 演进和高吞吐二进制数据需要共存时，Fory 可以作为统一的序列化层。",
    ecosystemTitle: "选择适合当前系统的采用路径。",
    ecosystemSubtitle:
      "从单一运行时开始，再逐步走向共享 Schema 和可复现性能验证，而不改变领域对象模型。",
  },
};

const runtimeExamples: RuntimeExample[] = [
  {
    id: "java",
    label: "Java",
    installLanguage: "xml",
    install: `<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>1.0.0</version>
</dependency>`,
    codeLanguage: "java",
    guide: "/docs/guide/java/",
    summary: "JVM runtime with xlang and native modes, JIT serializers, and object graph support.",
    code: `import org.apache.fory.Fory;

public record Person(String name, int age) {}

Fory fory = Fory.builder()
    .withXlang(true)
    .build();
fory.register(Person.class, "example", "Person");

byte[] bytes = fory.serialize(new Person("Alice", 30));
Person out = (Person) fory.deserialize(bytes);`,
  },
  {
    id: "python",
    label: "Python",
    installLanguage: "bash",
    install: `pip install pyfory==1.0.0`,
    codeLanguage: "python",
    guide: "/docs/guide/python/",
    summary: "Python dataclasses, native Python object graphs, and xlang payloads.",
    code: `from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register(Person, typename="example.Person")

data = fory.serialize(Person("Alice", 30))
out = fory.deserialize(data)`,
  },
  {
    id: "rust",
    label: "Rust",
    installLanguage: "bash",
    install: `cargo add fory@1.0.0`,
    codeLanguage: "rust",
    guide: "/docs/guide/rust/",
    summary: "Typed Rust structs with derive-based registration and xlang support.",
    code: `use fory::{Error, Fory, ForyObject};

#[derive(ForyObject, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(true).build();
    fory.register_by_name::<Person>("example", "Person")?;

    let bytes = fory.serialize(&Person { name: "Alice".into(), age: 30 })?;
    let out: Person = fory.deserialize(&bytes)?;
    Ok(())
}`,
  },
  {
    id: "go",
    label: "Go",
    installLanguage: "bash",
    install: `go get github.com/apache/fory/go/fory@v1.0.0`,
    codeLanguage: "go",
    guide: "/docs/guide/go/",
    summary: "Go structs, native mode, xlang mode, and explicit registration.",
    code: `type Person struct {
    Name string
    Age  int32
}

f := fory.New(fory.WithXlang(true))
_ = f.RegisterStruct(Person{}, 1)

payload, _ := f.Serialize(&Person{Name: "Alice", Age: 30})
var out Person
_ = f.Deserialize(payload, &out)`,
  },
  {
    id: "cpp",
    label: "C++",
    installLanguage: "cmake",
    install: `FetchContent_Declare(
  fory
  GIT_REPOSITORY https://github.com/apache/fory.git
  GIT_TAG v1.0.0
  SOURCE_SUBDIR cpp
)`,
    codeLanguage: "cpp",
    guide: "/docs/guide/cpp/",
    summary: "Modern C++17 serialization with compile-time type safety and xlang mode.",
    code: `struct Person {
  std::string name;
  int32_t age;

  bool operator==(const Person& other) const {
    return name == other.name && age == other.age;
  }
};
FORY_STRUCT(Person, name, age);

auto fory = Fory::builder().xlang(true).build();
fory.register_struct<Person>(1);

auto bytes = fory.serialize(Person{"Alice", 30}).value();
auto out = fory.deserialize<Person>(bytes).value();`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    installLanguage: "bash",
    install: `npm install @apache-fory/core`,
    codeLanguage: "typescript",
    guide: "/docs/guide/javascript/",
    summary: "JavaScript and TypeScript xlang payloads for Node.js and browsers.",
    code: `import Fory, { Type } from "@apache-fory/core";

const personType = Type.struct(
  { typeName: "example.Person" },
  { name: Type.string(), age: Type.int32() },
);

const fory = new Fory();
const { serialize, deserialize } = fory.register(personType);

const payload = serialize({ name: "Alice", age: 30 });
const out = deserialize(payload);`,
  },
  {
    id: "csharp",
    label: "C#",
    installLanguage: "bash",
    install: `dotnet add package Apache.Fory --version 1.0.0`,
    codeLanguage: "csharp",
    guide: "/docs/guide/csharp/",
    summary: ".NET runtime with source-generated serializers and xlang compatibility.",
    code: `using Apache.Fory;

[ForyStruct]
public sealed class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

Fory fory = Fory.Builder().Build();
fory.Register<Person>(1);

byte[] payload = fory.Serialize(new Person { Name = "Alice", Age = 30 });
Person out = fory.Deserialize<Person>(payload);`,
  },
  {
    id: "swift",
    label: "Swift",
    installLanguage: "swift",
    install: `.package(url: "https://github.com/apache/fory.git", exact: "1.0.0")`,
    codeLanguage: "swift",
    guide: "/docs/guide/swift/",
    summary: "Swift value types with macro-based registration and strong type safety.",
    code: `import Fory

@ForyStruct
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
fory.register(Person.self, id: 1)

let payload = try fory.serialize(Person(name: "Alice", age: 30))
let out: Person = try fory.deserialize(payload)`,
  },
  {
    id: "dart",
    label: "Dart",
    installLanguage: "yaml",
    install: `dependencies:
  fory: ^1.0.0

dev_dependencies:
  build_runner: ^2.4.13`,
    codeLanguage: "dart",
    guide: "/docs/guide/dart/",
    summary: "Generated Dart serializers for VM, Flutter, and web xlang payloads.",
    code: `@ForyStruct()
class Person {
  Person();
  String name = "";

  @ForyField(type: Int32Type())
  int age = 0;
}

final fory = Fory();
PersonForyModule.register(fory, Person, namespace: "example", typeName: "Person");

final payload = fory.serialize(Person()..name = "Alice"..age = 30);
final out = fory.deserialize<Person>(payload);`,
  },
  {
    id: "scala",
    label: "Scala",
    installLanguage: "sbt",
    install: `libraryDependencies += "org.apache.fory" %% "fory-scala" % "1.0.0"`,
    codeLanguage: "scala",
    guide: "/docs/guide/scala/",
    summary: "Scala case classes and collections on top of optimized JVM serialization.",
    code: `import org.apache.fory.scala.ForyScala

case class Person(name: String, age: Int)

val fory = ForyScala.builder()
  .withXlang(true)
  .build()
fory.register(classOf[Person])

val payload = fory.serialize(Person("Alice", 30))
val out = fory.deserialize(payload).asInstanceOf[Person]`,
  },
  {
    id: "kotlin",
    label: "Kotlin",
    installLanguage: "kotlin",
    install: `implementation("org.apache.fory:fory-kotlin:1.0.0")`,
    codeLanguage: "kotlin",
    guide: "/docs/guide/kotlin/",
    summary: "Kotlin data classes, Android support, and JVM xlang/native modes.",
    code: `import org.apache.fory.kotlin.ForyKotlin

data class Person(val name: String, val age: Int)

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .buildThreadSafeFory()
fory.register(Person::class.java)

val payload = fory.serialize(Person("Alice", 30))
val out = fory.deserialize(payload) as Person`,
  },
  {
    id: "xlang",
    label: "Schema IDL",
    installLanguage: "fory",
    install: `foryc example.fdl --lang rust --output ./generated`,
    codeLanguage: "protobuf",
    guide: "/docs/guide/xlang/",
    summary: "Define a stable schema once and generate a native Rust model.",
    code: `package example;

message Person {
    string name = 1;
    int32 age = 2;
    optional string email = 3;
}

// This follows the Fory IDL Quick Start schema.`,
  },
];

const capabilities = [
  {
    title: "Cross-language wire format",
    zhTitle: "跨语言线格式",
    label: "XLANG",
    description:
      "Use one compact binary payload across supported runtimes when services cross language boundaries.",
    zhDescription: "跨服务语言边界时，用同一套紧凑二进制载荷连接不同运行时。",
    link: "/docs/guide/xlang/",
  },
  {
    title: "Object graph semantics",
    zhTitle: "对象图语义",
    label: "GRAPH",
    description:
      "Preserve shared references, circular references, and polymorphic runtime types instead of flattening them away.",
    zhDescription: "保留共享引用、循环引用和多态运行时类型，而不是把对象图语义压平。",
    link: "/docs/introduction/overview/",
  },
  {
    title: "Schema IDL and compiler",
    zhTitle: "Schema IDL 与编译器",
    label: "IDL",
    description:
      "Define stable contracts once and generate idiomatic domain objects for each target language.",
    zhDescription: "一次定义稳定契约，为不同语言生成符合习惯的领域对象。",
    link: "/docs/compiler/",
  },
  {
    title: "Row format and zero-copy",
    zhTitle: "Row format 与零拷贝",
    label: "ROW",
    description:
      "Read fields, arrays, and nested values without rebuilding whole objects for analytics and partial-read paths.",
    zhDescription: "无需重建完整对象即可读取字段、数组和嵌套值，适合分析和部分读取路径。",
    link: "/docs/specification/row_format_spec",
  },
  {
    title: "Optimized runtimes",
    zhTitle: "运行时优化",
    label: "JIT",
    description:
      "Combine Java JIT serializers with generated or static serializers in other runtimes.",
    zhDescription: "结合 Java JIT 序列化器，以及其他运行时的生成式或静态序列化器。",
    link: "/docs/guide/java/",
  },
  {
    title: "Multi-runtime ecosystem",
    zhTitle: "多运行时生态",
    label: "12X",
    description:
      "Work from Java, Python, Rust, Go, C++, JavaScript, C#, Swift, Dart, Scala, Kotlin, and cross-language guides.",
    zhDescription: "覆盖 Java、Python、Rust、Go、C++、JavaScript、C#、Swift、Dart、Scala、Kotlin 和跨语言指南。",
    link: "/docs/start/usage",
  },
];

const performanceCards = [
  {
    value: "9",
    label: "benchmark reports",
    zhLabel: "份性能报告",
    text: "Java, Python, Rust, C++, Go, C#, Swift, JavaScript, and Dart have dedicated benchmark pages.",
    zhText: "Java、Python、Rust、C++、Go、C#、Swift、JavaScript 和 Dart 均有独立性能报告。",
  },
  {
    value: "2",
    label: "wire modes",
    zhLabel: "种线格式模式",
    text: "Use xlang for portable payloads and native mode for same-runtime object surfaces.",
    zhText: "xlang 用于可移植载荷，native mode 用于同一运行时的原生对象面。",
  },
  {
    value: "1",
    label: "object model",
    zhLabel: "套对象模型",
    text: "Keep domain objects central while choosing schema, row format, or runtime-specific paths as needed.",
    zhText: "以领域对象为中心，并按需选择 Schema、Row format 或运行时定制路径。",
  },
];

const useCases = [
  {
    title: "Cross-language service payloads",
    zhTitle: "跨语言服务载荷",
    text: "Share objects between JVM, Python, Rust, Go, JavaScript, .NET, Swift, and Dart services.",
    zhText: "在 JVM、Python、Rust、Go、JavaScript、.NET、Swift、Dart 服务之间共享对象。",
  },
  {
    title: "Cache and state snapshots",
    zhTitle: "缓存与状态快照",
    text: "Serialize rich object graphs without losing reference structure.",
    zhText: "序列化复杂对象图，同时保留引用结构。",
  },
  {
    title: "Data pipelines and partial reads",
    zhTitle: "数据管道与部分读取",
    text: "Use row format when pipelines need zero-copy access to selected fields.",
    zhText: "当管道只需要读取部分字段时，使用 Row format 获得零拷贝访问。",
  },
];

const adoptionPaths = [
  {
    label: "01",
    title: "Start with one runtime",
    zhTitle: "从单一运行时开始",
    text: "Install the package for your language and serialize native domain objects first.",
    zhText: "安装当前语言的运行时包，先序列化原生领域对象。",
    cta: "Install guide",
    zhCta: "安装指南",
    link: "/docs/start/install",
  },
  {
    label: "02",
    title: "Standardize with Schema IDL",
    zhTitle: "用 Schema IDL 标准化",
    text: "Define shared contracts when teams need stable models across services and languages.",
    zhText: "当团队需要跨服务、跨语言稳定模型时，用 Schema IDL 定义共享契约。",
    cta: "Compiler docs",
    zhCta: "编译器文档",
    link: "/docs/compiler/",
  },
  {
    label: "03",
    title: "Validate performance",
    zhTitle: "验证性能表现",
    text: "Use the benchmark notes and charts to compare runtime behavior before rollout.",
    zhText: "上线前通过 Benchmark 说明和图表比较不同运行时表现。",
    cta: "Benchmarks",
    zhCta: "性能测试",
    link: "/docs/introduction/benchmark",
  },
];

function langKey(locale?: string): "en" | "zh" {
  return locale === "zh-CN" ? "zh" : "en";
}

function HomepageLanding(): JSX.Element {
  const {
    i18n: { currentLocale },
  } = useDocusaurusContext();
  const copy = copies[langKey(currentLocale)];
  const isZh = langKey(currentLocale) === "zh";
  const [selectedRuntime, setSelectedRuntime] = useState<RuntimeId>("java");

  const selected = useMemo(
    () => runtimeExamples.find((item) => item.id === selectedRuntime) ?? runtimeExamples[0],
    [selectedRuntime],
  );

  return (
    <main className={styles.homepage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>{copy.heroEyebrow}</div>
          <h1>{copy.heroTitle}</h1>
          <p className={styles.heroSubtitle}>{copy.heroSubtitle}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} to="/docs/start/install">
              {copy.heroPrimary}
            </Link>
            <Link className={styles.secondaryButton} to="/docs/introduction/overview">
              {copy.heroSecondary}
            </Link>
            <Link className={styles.ghostButton} to="https://github.com/apache/fory">
              {copy.heroGithub}
            </Link>
          </div>
          <dl className={styles.trustList}>
            <div>
              <dt>{copy.heroVersion}</dt>
              <dd>2026-05-21</dd>
            </div>
            <div>
              <dt>{copy.heroRuntimes}</dt>
              <dd>Java to Dart</dd>
            </div>
            <div>
              <dt>{copy.heroBenchmarks}</dt>
              <dd>9 reports</dd>
            </div>
            <div>
              <dt>{copy.heroApache}</dt>
              <dd>ASF</dd>
            </div>
          </dl>
        </div>

        <div className={styles.heroVisual} aria-label={copy.heroPanelTitle}>
          <div className={styles.panelHeader}>
            <div>
              <strong>{copy.heroPanelTitle}</strong>
              <span>{copy.heroPanelSubtitle}</span>
            </div>
            <span className={styles.panelBadge}>xlang=true</span>
          </div>
          <div className={styles.flowGrid}>
            <div className={styles.flowNode}>
              <span>01</span>
              <strong>{copy.heroFlowSource}</strong>
              <code>Person("Alice", 30)</code>
            </div>
            <div className={styles.flowLine} />
            <div className={styles.flowNode}>
              <span>02</span>
              <strong>{copy.heroFlowWire}</strong>
              <code>compact bytes</code>
            </div>
            <div className={styles.flowLine} />
            <div className={styles.flowNode}>
              <span>03</span>
              <strong>{copy.heroFlowTarget}</strong>
              <code>Person(name="Alice")</code>
            </div>
          </div>
          <div className={styles.heroCode}>
            <CodeBlock language="java">{`Fory fory = Fory.builder().withXlang(true).build();
fory.register(Person.class, "example", "Person");

byte[] bytes = fory.serialize(new Person("Alice", 30));
Person out = (Person) fory.deserialize(bytes);`}</CodeBlock>
          </div>
        </div>
      </section>

      <section className={styles.quickStart}>
        <div className={styles.sectionHeader}>
          <span>{copy.quickEyebrow}</span>
          <h2>{copy.quickTitle}</h2>
          <p>{copy.quickSubtitle}</p>
        </div>

        <div className={styles.runtimeShell}>
          <div className={styles.runtimeTabs} role="tablist" aria-label="Runtime examples">
            {runtimeExamples.map((runtime) => (
              <button
                aria-selected={runtime.id === selectedRuntime}
                className={runtime.id === selectedRuntime ? styles.runtimeTabActive : styles.runtimeTab}
                key={runtime.id}
                onClick={() => setSelectedRuntime(runtime.id)}
                role="tab"
                type="button"
              >
                {runtime.label}
              </button>
            ))}
          </div>

          <div className={styles.runtimeDetail}>
            <div className={styles.runtimeSummary}>
              <div className={styles.runtimeTitleRow}>
                <span>{selected.label}</span>
                <Link to={selected.guide}>{copy.guideLabel}</Link>
              </div>
              <p>{selected.summary}</p>
              <div className={styles.installBlock}>
                <div className={styles.blockLabel}>{copy.installLabel}</div>
                <CodeBlock language={selected.installLanguage}>{selected.install}</CodeBlock>
              </div>
            </div>

            <div className={styles.codeBlock}>
              <div className={styles.blockLabel}>{copy.codeLabel}</div>
              <CodeBlock language={selected.codeLanguage}>{selected.code}</CodeBlock>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.capabilities}>
        <div className={styles.sectionHeader}>
          <span>{copy.capabilitiesEyebrow}</span>
          <h2>{copy.capabilitiesTitle}</h2>
          <p>{copy.capabilitiesSubtitle}</p>
        </div>
        <div className={styles.capabilityGrid}>
          {capabilities.map((item) => (
            <Link className={styles.capabilityCard} key={item.title} to={item.link}>
              <span>{item.label}</span>
              <h3>{isZh ? item.zhTitle : item.title}</h3>
              <p>{isZh ? item.zhDescription : item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.performance}>
        <div className={styles.performanceCopy}>
          <span>{copy.performanceEyebrow}</span>
          <h2>{copy.performanceTitle}</h2>
          <p>{copy.performanceSubtitle}</p>
          <Link className={styles.secondaryButton} to="/docs/introduction/benchmark">
            {copy.benchmarkCta}
          </Link>
        </div>
        <div className={styles.performanceCards}>
          {performanceCards.map((item) => (
            <div className={styles.performanceCard} key={item.label}>
              <strong>{item.value}</strong>
              <span>{isZh ? item.zhLabel : item.label}</span>
              <p>{isZh ? item.zhText : item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.useCases}>
        <div className={styles.sectionHeader}>
          <span>{copy.useCasesEyebrow}</span>
          <h2>{copy.useCasesTitle}</h2>
          <p>{copy.useCasesSubtitle}</p>
        </div>
        <div className={styles.useCaseGrid}>
          {useCases.map((item) => (
            <article className={styles.useCaseCard} key={item.title}>
              <h3>{isZh ? item.zhTitle : item.title}</h3>
              <p>{isZh ? item.zhText : item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ecosystem}>
        <div className={styles.ecosystemHeader}>
          <span className={styles.eyebrow}>{isZh ? "采用路径" : "Adoption paths"}</span>
          <h2>{copy.ecosystemTitle}</h2>
          <p>{copy.ecosystemSubtitle}</p>
        </div>
        <div className={styles.adoptionGrid}>
          {adoptionPaths.map((item) => (
            <Link className={styles.adoptionCard} key={item.title} to={item.link}>
              <span>{item.label}</span>
              <h3>{isZh ? item.zhTitle : item.title}</h3>
              <p>{isZh ? item.zhText : item.text}</p>
              <strong>{isZh ? item.zhCta : item.cta}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomepageLanding;
