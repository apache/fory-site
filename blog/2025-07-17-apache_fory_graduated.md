---
title: "Apache Fory™ Graduates to Top-Level Apache Project"
date: 2025-07-18
slug: apache-fory-graduated
tags: [announcement, serialization, asf]
authors: [chaokunyang]
---

**Hello, everyone! I'm pleased to announce that [Apache Fory™](https://fory.apache.org/) has graduated from the [Apache Incubator](https://incubator.apache.org/) to become a Top-Level Project (TLP) of [the Apache Software Foundation](https://apache.org/), signifying its technical maturity and sustainable open-source governance under the Apache Way.**

## What is Apache Fory?

**Apache Fory** is a blazingly-fast multi-language serialization framework that revolutionizes data exchange between systems and languages. By leveraging **JIT compilation** and **zero-copy techniques**, Fory delivers up to **170x faster performance** compared to other serialization frameworkds while being extremely easy to use.

### Key Features:

- 🌐 **Cross-language serialization**: Java, Python, C++, Go, JavaScript, Rust, Scala, Kotlin
- ⚡️ **Zero-copy optimization**: Minimizes memory overhead for large datasets
- 🔄 **Schema evolution**: Forward/backward compatibility for evolving data structures
- 🔒 **Security-first**: Class registration prevents deserialization vulnerabilities
- 📦 **Multiple protocols**: Object graph, Row format, and Java-compatible modes

### Quick Start

Java serialization example:

```java
Fory fory = Fory.builder().build();
fory.register(DataModel.class);

DataModel obj = new DataModel(/*...*/);
byte[] bytes = fory.serialize(obj);
DataModel restored = (DataModel) fory.deserialize(bytes);
```

Python serialization example

```python
from dataclasses import dataclass
import pyfory

class Foo:
    name: str:
    age: int
pyfory.register(Foo)
bytes = pyfory.serialize(Foo("Shawn", 30))  # Ultra-fast encoding
restored = pyfory.deserialize(bytes)  # Instant decoding
```

## The Incubation Journey

Since entering the Apache Incubator in December 2023, Fory has achieved significant milestones.

### Community Growth

- 👥 90+ contributors
- 🔧 6 new committers added, with 1 promoted to PPMC
- 🤝 Diverse adoption across fintech, e-commerce, and cloud

### Technical Progress

- 🚀 14 ASF-compliant releases (0.5.0 to 0.11.2)
- 🔄 4 release managers ensuring sustainable operations
- ™ Trademark resolution: Successful rename from Fury → Fory
- ✅ Maturity validation: Full compliance with ASF graduation requirements

### Apache Way Adoption

- 📬 100% public discussions on dev@ mailing lists
- 🗳️ Consensus-driven decisions through formal voting
- 🌐 Complete infrastructure migration to Fory namespace

## Why Graduation Matters

Graduation signifies that Fory has demonstrated:

- Sustainable governance with diverse PMC leadership
- Enterprise-ready stability through rigorous releases
- Community independence with no vendor dominance
- ASF policy compliance including security and licensing

## What's Next

As a Top-Level Project, Fory's roadmap includes:

- Enhanced Capabilities
  - Improved schema evolution for cross-language compatibility
  - Producation ready support forRust/C++ serialization
- Ecosystem Integration
  - GRPC Integration
  - Protobuf Migration Tool
- Community Growth
  - Comprehensive user documentation
  - Structured mentorship program for new contributors
  - Production case studies with early adopters

## Get Involved

Experience Fory's performance:

Java:

```xml
<dependency>
  <groupId>org.apache.fory</groupId>
  <artifactId>fory-core</artifactId>
  <version>0.11.2</version>
</dependency>
```

Python:

```bash
pip install pyfory
```

Join our community:

- 🌐 Website: https://fory.apache.org
- 💬 Slack: [fory-project.slack.com](https://join.slack.com/t/fory-project/shared_invite/zt-36g0qouzm-kcQSvV_dtfbtBKHRwT5gsw)
- 📧 Mailing list: dev@fory.apache.org
- 🐙 GitHub: https://github.com/apache/fory

## Acknowledgements

The PMC Members of the Fory project are listed as follows, with big thanks to their significant contributions:

- [Shawn Yang (Chair)](https://github.com/chaokunyang)
- [tison](https://github.com/tisonkun)
- [Xuanwo](https://github.com/xuanwo)
- [Twice](https://github.com/pragmatwice)
- [PJ Fanning](https://github.com/pjfanning)
- [Pan Li](https://github.com/pandalee99)
- Xin Wang
- Weipeng Wang
- liyu
- [eolivelli](https://github.com/eolivelli)

Big thanks to all contributors who submitted code, reported issues, and improved documentation. This achievement belongs to the entire Apache Fory community!
