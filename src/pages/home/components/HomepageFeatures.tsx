import clsx from "clsx";
import Heading from "@theme/Heading";
import Translate from "@docusaurus/Translate";
import React from "react";

type FeatureItem = {
  title: React.ReactNode;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: React.ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: (
      <Translate
        id="feature.crossLanguageEncoding.title"
        description="The title for the cross-language encoding feature"
      >
        Cross-language encoding
      </Translate>
    ),
    Svg: require("@site/static/img/performance.svg").default,
    description: (
      <Translate
        id="feature.crossLanguageEncoding.description"
        description="Description for the cross-language encoding feature"
      >
        Exchange compact binary payloads across runtimes with schema evolution,
        shared and circular references, and polymorphic runtime types.
      </Translate>
    ),
  },
  {
    title: (
      <Translate
        id="feature.domainObjects.title"
        description="The title for the domain objects feature"
      >
        Domain objects first
      </Translate>
    ),
    Svg: require("@site/static/img/happy.svg").default,
    description: (
      <Translate
        id="feature.domainObjects.description"
        description="Description for the domain objects feature"
      >
        Serialize native domain objects directly, including Java classes,
        Python dataclasses, Go structs, Rust and C++ structs, and generated or
        annotated types.
      </Translate>
    ),
  },
  {
    title: (
      <Translate
        id="feature.schemaIdl.title"
        description="The title for the schema IDL feature"
      >
        Reference-aware Schema IDL
      </Translate>
    ),
    Svg: require("@site/static/img/multi.svg").default,
    description: (
      <Translate
        id="feature.schemaIdl.description"
        description="Description for the schema IDL feature"
      >
        Define schemas once, including shared and circular references, then
        generate native domain objects without wrapper types.
      </Translate>
    ),
  },
  {
    title: (
      <Translate
        id="feature.rowFormat.title"
        description="The title for the row format feature"
      >
        Row-format random access
      </Translate>
    ),
    Svg: require("@site/static/img/rocket.svg").default,
    description: (
      <Translate
        id="feature.rowFormat.description"
        description="Description for the row format feature"
      >
        Read fields, arrays, and nested values without rebuilding whole
        objects, with zero-copy access, partial reads, and Arrow integration.
      </Translate>
    ),
  },
  {
    title: (
      <Translate
        id="feature.optimizedRuntimes.title"
        description="The title for the optimized runtimes feature"
      >
        Optimized runtimes
      </Translate>
    ),
    Svg: require("@site/static/img/performance.svg").default,
    description: (
      <Translate
        id="feature.optimizedRuntimes.description"
        description="Description for the optimized runtimes feature"
      >
        Java JIT serializers and generated or static serializers in other
        runtimes keep hot paths fast and serialized data compact.
      </Translate>
    ),
  },
  {
    title: (
      <Translate
        id="feature.platformSupport.title"
        description="The title for the platform support feature"
      >
        Broad platform support
      </Translate>
    ),
    Svg: require("@site/static/img/multi.svg").default,
    description: (
      <Translate
        id="feature.platformSupport.description"
        description="Description for the platform support feature"
      >
        Use Fory from Java, Python, C++, Go, Rust, JavaScript/TypeScript, C#,
        Swift, Dart, Scala, Kotlin, GraalVM, Flutter, Node.js, and browsers.
      </Translate>
    ),
  },
];

const styles = {
  features: {
    display: "flex",
    alignItems: "center",
    padding: "2rem 0",
    width: "100%",
  },
  featureSvg: {
    height: "120px",
    width: "120px",
    fill: "var(--ifm-color-primary)",
  },
};

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <div
          style={{
            backgroundColor: "rgba(39, 174, 96, 0.1)",
            borderRadius: "50%",
            display: "inline-flex",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <Svg style={styles.featureSvg} role="img" />
        </div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

const HomepageFeatures: React.FC = () => {
  return (
    <section style={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
};
export default HomepageFeatures;
