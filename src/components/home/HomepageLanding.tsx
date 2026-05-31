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
  | "kotlin";

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
  quickEyebrow: string;
  quickTitle: string;
  quickSubtitle: string;
  installLabel: string;
  codeLabel: string;
  guideLabel: string;
  capabilitiesEyebrow: string;
  capabilitiesTitle: string;
  capabilitiesSubtitle: string;
  schemaEyebrow: string;
  schemaTitle: string;
  schemaSubtitle: string;
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
    heroEyebrow: "Multi-language serialization framework",
    heroTitle: "Apache Fory™",
    heroSubtitle:
      "A blazingly-fast multi-language serialization framework for idiomatic domain objects, Schema IDL, and cross-language data exchange.",
    heroPrimary: "Get Started",
    heroSecondary: "View Docs",
    heroGithub: "View GitHub",
    quickEyebrow: "Quick start",
    quickTitle: "Start from native domain objects.",
    quickSubtitle:
      "Pick a language, register a native type with a stable name, then serialize and deserialize with a small Fory runtime.",
    installLabel: "Install",
    codeLabel: "Serialize / deserialize",
    guideLabel: "Open guide",
    capabilitiesEyebrow: "Core capabilities",
    capabilitiesTitle: "What Fory is built to handle.",
    capabilitiesSubtitle:
      "Fory brings together cross-language serialization, native object support, Schema IDL/code generation, reference tracking, schema evolution, and row-format access.",
    schemaEyebrow: "Schema IDL",
    schemaTitle: "Model contracts that still understand object graphs.",
    schemaSubtitle:
      "Fory IDL starts with familiar message definitions, then adds unions and reference-aware fields for data models that ordinary IDLs tend to flatten.",
    performanceEyebrow: "Performance",
    performanceTitle: "Measure the runtime you plan to ship.",
    performanceSubtitle:
      "Compare language-specific benchmark results with the same workloads, chart notes, and reproduction details.",
    benchmarkCta: "View full benchmark charts",
    useCasesEyebrow: "Data boundaries",
    useCasesTitle: "Match Fory to each data boundary.",
    useCasesSubtitle:
      "Use one serialization layer, but choose the payload surface by the boundary your data crosses.",
    ecosystemTitle: "Adopt Fory without changing the object model.",
    ecosystemSubtitle:
      "Start with native objects, promote shared contracts to Schema IDL when teams need them, then validate the exact runtime path with benchmarks.",
  },
  zh: {
    heroEyebrow: "多语言序列化框架",
    heroTitle: "Apache Fory™",
    heroSubtitle:
      "一个面向原生领域对象、Schema IDL 和跨语言数据交换的高性能多语言序列化框架。",
    heroPrimary: "开始使用",
    heroSecondary: "查看文档",
    heroGithub: "查看 GitHub",
    quickEyebrow: "快速开始",
    quickTitle: "从原生领域对象开始。",
    quickSubtitle:
      "选择一种语言，用稳定名称注册原生类型，然后通过 Fory 运行时完成序列化和反序列化。",
    installLabel: "安装",
    codeLabel: "序列化 / 反序列化",
    guideLabel: "打开指南",
    capabilitiesEyebrow: "核心能力",
    capabilitiesTitle: "Fory 面向这些问题而设计。",
    capabilitiesSubtitle:
      "Fory 将跨语言序列化、原生对象支持、Schema IDL/codegen、引用跟踪、Schema 演进和 row-format 访问组合在一起。",
    schemaEyebrow: "Schema IDL",
    schemaTitle: "理解对象图的模型契约。",
    schemaSubtitle:
      "Fory IDL 从熟悉的 message 定义开始，并提供 union 与引用感知字段，表达普通 IDL 容易压平的对象模型。",
    performanceEyebrow: "性能",
    performanceTitle: "测量你真正要上线的运行时。",
    performanceSubtitle:
      "按语言对比相同工作负载下的 Benchmark 结果、图表说明和复现细节。",
    benchmarkCta: "查看完整性能图表",
    useCasesEyebrow: "数据边界",
    useCasesTitle: "让 Fory 匹配每一种数据边界。",
    useCasesSubtitle:
      "使用同一层序列化能力，但根据数据跨越的边界选择不同 payload 表面。",
    ecosystemTitle: "不改变对象模型地采用 Fory。",
    ecosystemSubtitle:
      "从原生对象开始；当契约需要跨团队共享时推进到 Schema IDL；上线前用 Benchmark 验证具体运行时路径。",
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
    summary: "Java supports xlang and native modes, JIT serializers, schema evolution, and Java-native object graph features.",
    code: `import org.apache.fory.Fory;

public record Person(String name, int age) {}

Fory fory = Fory.builder()
    .withXlang(true)
    .build();
fory.register(Person.class, "Person");

byte[] bytes = fory.serialize(new Person("Alice", 30));
Person out = (Person) fory.deserialize(bytes);`,
  },
  {
    id: "python",
    label: "Python",
    installLanguage: "bash",
    install: `pip install pyfory`,
    codeLanguage: "python",
    guide: "/docs/guide/python/",
    summary: "pyfory supports xlang, Python native mode, dataclasses, row format, and out-of-band buffers.",
    code: `from dataclasses import dataclass
import pyfory

@dataclass
class Person:
    name: str
    age: pyfory.Int32

fory = pyfory.Fory(xlang=True)
fory.register(Person, typename="Person")

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
    summary: "Rust uses derive macros for type-safe structs and supports both xlang and native payloads.",
    code: `use fory::{Error, Fory, ForyStruct};

#[derive(ForyStruct, Debug, PartialEq)]
struct Person {
    name: String,
    age: i32,
}

fn main() -> Result<(), Error> {
    let mut fory = Fory::builder().xlang(true).build();
    fory.register_by_name::<Person>("", "Person")?;

    let bytes = fory.serialize(&Person { name: "Alice".into(), age: 30 })?;
    let out: Person = fory.deserialize(&bytes)?;
    Ok(())
}`,
  },
  {
    id: "go",
    label: "Go",
    installLanguage: "bash",
    install: `go get github.com/apache/fory/go/fory`,
    codeLanguage: "go",
    guide: "/docs/guide/go/",
    summary: "Go supports xlang and native modes with exported structs, circular references, and schema-aware serializers.",
    code: `type Person struct {
    Name string
    Age  int32
}

f := fory.New(fory.WithXlang(true))
_ = f.RegisterStructByName(Person{}, "Person")

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
    summary: "C++17 support covers xlang/native payloads, macro-based type registration, and row-format APIs.",
    code: `struct Person {
  std::string name;
  int32_t age;

  bool operator==(const Person& other) const {
    return name == other.name && age == other.age;
  }
};
FORY_STRUCT(Person, name, age);

auto fory = Fory::builder().xlang(true).track_ref(false).build();
fory.register_struct<Person>("Person");

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
    summary: "JavaScript/TypeScript is xlang-only, schema-driven, and runs in Node.js or browsers.",
    code: `import Fory, { Type } from "@apache-fory/core";

const personType = Type.struct(
  { typeName: "Person" },
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
    summary: ".NET support uses source-generated serializers for Fory structs, enums, and unions.",
    code: `using Apache.Fory;

[ForyStruct]
public sealed class Person
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
}

Fory fory = Fory.Builder().Build();
fory.Register<Person>("Person");

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
    summary: "Swift uses @ForyStruct, @ForyEnum, and @ForyUnion macros for xlang-compatible models.",
    code: `import Fory

@ForyStruct
struct Person: Equatable {
    var name: String = ""
    var age: Int32 = 0
}

let fory = Fory()
try fory.register(Person.self, name: "Person")

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
    summary: "Dart uses generated serializers across Dart VM, Flutter, AOT, and web targets.",
    code: `import 'package:fory/fory.dart';

part 'person.fory.dart';

@ForyStruct()
class Person {
  Person();
  String name = "";

  @ForyField(type: Int32Type())
  int age = 0;
}

final fory = Fory();
PersonForyModule.register(
  fory,
  Person,
  namespace: '',
  typeName: 'Person',
);

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
    summary: "Scala builds on Fory Java with optimized serializers for case classes, collections, tuples, and Option.",
    code: `import org.apache.fory.scala.ForyScala

case class Person(name: String, age: Int)

val fory = ForyScala.builder()
  .withXlang(true)
  .build()
fory.register(classOf[Person], "Person")

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
    summary: "Kotlin adds data-class support, Android guidance, and KSP static serializers for xlang/schema mode.",
    code: `import org.apache.fory.kotlin.ForyKotlin

data class Person(val name: String, val age: Int)

val fory = ForyKotlin.builder()
    .withXlang(true)
    .requireClassRegistration(true)
    .buildThreadSafeFory()
fory.register(Person::class.java, "Person")

val payload = fory.serialize(Person("Alice", 30))
val out = fory.deserialize(payload) as Person`,
  },
];

const capabilities = [
  {
    title: "Cross-language encoding",
    zhTitle: "跨语言编码",
    label: "XLANG",
    description:
      "Serialize in one supported runtime and deserialize in another with the xlang wire format.",
    zhDescription: "通过 xlang 线格式，在一个受支持运行时序列化，在另一个运行时反序列化。",
    link: "/docs/guide/xlang/",
  },
  {
    title: "Domain objects first",
    zhTitle: "领域对象优先",
    label: "OBJECTS",
    description:
      "Work with Java classes, Python dataclasses, Go structs, Rust/C++ structs, and generated or annotated models.",
    zhDescription: "直接使用 Java 类、Python dataclass、Go struct、Rust/C++ struct，以及生成或注解模型。",
    link: "/docs/start/usage",
  },
  {
    title: "Reference-aware Schema IDL",
    zhTitle: "支持引用语义的 Schema IDL",
    label: "IDL",
    description:
      "Define schemas once with optional fields, refs, IDs, unions, and services, then generate native code.",
    zhDescription: "一次定义 optional、ref、ID、union 和 service 等 schema，再生成各语言原生代码。",
    link: "/docs/compiler/",
  },
  {
    title: "Row-format random access",
    zhTitle: "Row format 随机访问",
    label: "ROW",
    description:
      "Read fields, arrays, and nested values without deserializing the whole object; integrate with Arrow where supported.",
    zhDescription: "无需反序列化完整对象即可读取字段、数组和嵌套值，并在支持语言中对接 Arrow。",
    link: "/docs/guide/xlang/row_format",
  },
  {
    title: "Optimized runtimes",
    zhTitle: "运行时优化",
    label: "FAST",
    description:
      "Use Java JIT serializers, generated JavaScript schemas, C# source generators, Kotlin KSP, and Dart build_runner output.",
    zhDescription: "使用 Java JIT、JavaScript schema 生成缓存、C# source generator、Kotlin KSP 和 Dart build_runner 输出。",
    link: "/docs/guide/java/",
  },
  {
    title: "Broad platform support",
    zhTitle: "多运行时生态",
    label: "11X",
    description:
      "Use Fory from Java, Python, C++, Go, Rust, JavaScript/TypeScript, C#, Swift, Dart, Scala, and Kotlin.",
    zhDescription: "覆盖 Java、Python、C++、Go、Rust、JavaScript/TypeScript、C#、Swift、Dart、Scala 和 Kotlin。",
    link: "/docs/start/usage",
  },
];

const heroSurfaces = [
  {
    label: "Native",
    zhLabel: "Native",
    title: "Native Objects",
    zhTitle: "原生对象",
    text: "Serialize existing domain objects inside one runtime.",
    zhText: "在单一运行时内序列化已有领域对象。",
    link: "/docs/start/usage",
  },
  {
    label: "xlang",
    zhLabel: "xlang",
    title: "Cross-language Payloads",
    zhTitle: "跨语言 Payload",
    text: "Exchange typed payloads across supported languages.",
    zhText: "在受支持语言之间交换类型化 payload。",
    link: "/docs/guide/xlang/",
  },
  {
    label: "IDL",
    zhLabel: "IDL",
    title: "Schema IDL",
    zhTitle: "Schema IDL",
    text: "Define shared contracts and generate native code.",
    zhText: "定义共享契约，并生成各语言原生代码。",
    link: "/docs/compiler/",
  },
  {
    label: "Row",
    zhLabel: "Row",
    title: "Row Format",
    zhTitle: "Row Format",
    text: "Read selected fields for partial-read and analytics workloads.",
    zhText: "面向部分读取和分析工作负载读取指定字段。",
    link: "/docs/guide/xlang/row_format",
  },
];

const schemaExamples = [
  {
    title: "Simple object",
    zhTitle: "简单对象",
    text: "Define ordinary typed fields with explicit field IDs and optional values.",
    zhText: "用明确字段 ID 和 optional 值定义普通类型化对象。",
    code: `message Person {
    string name = 1;
    int32 age = 2;
    optional string email = 3;
}`,
  },
  {
    title: "Typed union",
    zhTitle: "类型化 union",
    text: "Represent one-of-many domain cases without flattening every payload into a generic map.",
    zhText: "表达 one-of-many 领域分支，而不是把所有载荷压平成通用 map。",
    code: `message Dog [id=104] {
    string name = 1;
    int32 bark_volume = 2;
}

message Cat [id=105] {
    string name = 1;
    int32 lives = 2;
}

union Animal [id=106] {
    Dog dog = 1;
    Cat cat = 2;
}`,
  },
  {
    title: "Circular references",
    zhTitle: "循环引用",
    text: "Use ref-tracked fields when the same object can be shared or a graph contains cycles.",
    zhText: "当对象会被共享，或图结构中存在环时，用 ref 字段保留引用语义。",
    code: `message Node {
    string value = 1;
    ref Node parent = 2;
    list<ref Node> children = 3;
}`,
  },
];

const schemaPreviewCode = `package example;\n\n${schemaExamples
  .map((item) => item.code)
  .join("\n\n")}`;

const performanceCards = [
  {
    value: "Per language",
    zhValue: "按语言",
    label: "runtime benchmarks",
    zhLabel: "运行时性能",
    text: "Compare Fory with the serializers a team would realistically choose for that language.",
    zhText: "把 Fory 与该语言中团队实际会选择的序列化方案进行对比。",
  },
  {
    value: "Same workloads",
    zhValue: "同工作负载",
    label: "reproducible setup",
    zhLabel: "可复现设置",
    text: "Use the benchmark notes to understand payload shape, environment, and methodology.",
    zhText: "通过 Benchmark 说明理解载荷形态、环境和测试方法。",
  },
  {
    value: "By boundary",
    zhValue: "按边界",
    label: "mode selection",
    zhLabel: "模式选择",
    text: "Measure the path you intend to ship: xlang payloads, native mode, or row format.",
    zhText: "测量你真正要上线的路径：xlang payload、native mode 或 row format。",
  },
];

const useCases = [
  {
    title: "Language boundary",
    zhTitle: "语言边界",
    text: "Use xlang when services in different languages need to exchange the same typed payload directly.",
    zhText: "当不同语言服务需要直接交换同一份类型化载荷时，使用 xlang。",
  },
  {
    title: "Runtime boundary",
    zhTitle: "运行时边界",
    text: "Use native mode when objects stay inside one runtime and object graph fidelity matters.",
    zhText: "当对象只在同一运行时内流转，且对象图语义重要时，使用 native mode。",
  },
  {
    title: "Read boundary",
    zhTitle: "读取边界",
    text: "Use row format for partial reads and analytics workloads that should not rebuild whole objects.",
    zhText: "当部分读取和分析类工作负载不应重建完整对象时，使用 row format。",
  },
];

const adoptionPaths = [
  {
    label: "01",
    title: "Serialize native objects",
    zhTitle: "序列化原生对象",
    text: "Start with the object model your service already owns, then register stable names when payloads cross runtimes.",
    zhText: "从服务已有的对象模型开始；当 payload 跨运行时边界时，再注册稳定类型名。",
    cta: "Usage guide",
    zhCta: "使用指南",
    doc: "/docs/start/usage",
    link: "/docs/start/usage",
  },
  {
    label: "02",
    title: "Define shared schemas",
    zhTitle: "定义共享 Schema",
    text: "Use Fory IDL when models become long-lived, span teams, or need generated code across languages.",
    zhText: "当模型生命周期变长、跨团队协作，或需要多语言代码生成时，使用 Fory IDL。",
    cta: "Schema IDL guide",
    zhCta: "Schema IDL",
    doc: "/docs/compiler",
    link: "/docs/compiler/",
  },
  {
    label: "03",
    title: "Validate performance",
    zhTitle: "验证性能",
    text: "Compare the language and payload path you plan to ship before committing to a production rollout.",
    zhText: "上线前对比你实际计划使用的语言和 payload 路径。",
    cta: "Benchmark charts",
    zhCta: "Benchmark",
    doc: "/docs/introduction/benchmark",
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
        </div>

        <div className={styles.surfacePanel} aria-label={isZh ? "Fory 文档入口" : "Fory documentation paths"}>
          <div className={styles.surfaceOptions}>
            {heroSurfaces.map((item) => (
              <Link className={styles.surfaceOption} key={item.title} to={item.link}>
                <span className={styles.surfaceOptionBadge}>{isZh ? item.zhLabel : item.label}</span>
                <span className={styles.surfaceOptionBody}>
                  <strong>{isZh ? item.zhTitle : item.title}</strong>
                  <small>{isZh ? item.zhText : item.text}</small>
                </span>
              </Link>
            ))}
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

      <section className={styles.schemaIdl}>
        <div className={styles.schemaLayout}>
          <div className={styles.schemaCopy}>
            <span className={styles.eyebrow}>{copy.schemaEyebrow}</span>
            <h2>{copy.schemaTitle}</h2>
            <p>{copy.schemaSubtitle}</p>
            <div className={styles.schemaFeatureList}>
              {schemaExamples.map((item, index) => (
                <article className={styles.schemaFeature} key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{isZh ? item.zhTitle : item.title}</h3>
                    <p>{isZh ? item.zhText : item.text}</p>
                  </div>
                </article>
              ))}
            </div>
            <Link className={styles.secondaryButton} to="/docs/compiler/">
              {copy.guideLabel}
            </Link>
          </div>
          <div className={styles.schemaPreview} aria-label={copy.schemaTitle}>
            <div className={styles.schemaPreviewHeader}>
              <span>model.fdl</span>
              <strong>Fory IDL</strong>
            </div>
            <CodeBlock language="protobuf">{schemaPreviewCode}</CodeBlock>
          </div>
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
              <strong>{isZh ? item.zhValue : item.value}</strong>
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
          <span className={styles.eyebrow}>{isZh ? "采用路径" : "Adoption path"}</span>
          <h2>{copy.ecosystemTitle}</h2>
          <p>{copy.ecosystemSubtitle}</p>
        </div>
        <div className={styles.adoptionGrid}>
          {adoptionPaths.map((item) => (
            <Link className={styles.adoptionCard} key={item.title} to={item.link}>
              <span className={styles.adoptionStep}>{item.label}</span>
              <span className={styles.adoptionDocText}>
                <strong>{isZh ? item.zhCta : item.cta}</strong>
                <small>{isZh ? item.zhTitle : item.title}</small>
                <code>{item.doc}</code>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomepageLanding;
