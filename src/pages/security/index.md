---
id: download
title: Apache Fory™ Download
---

## Reporting Security Issues

Apache Fory™ uses the standard process outlined by the [Apache Security Team](https://www.apache.org/security/) for reporting vulnerabilities. Note that vulnerabilities should not be publicly disclosed until the project has responded.

To report a possible security vulnerability, please email private@fory.apache.org.

### [CVE-2025-59328](https://www.cve.org/CVERecord?id=CVE-2025-59328): Denial of Service (DoS) due to Deserialization of Untrusted malicious large Data

Severity: Mederate

Vendor: The Apache Software Foundation

Versions affected: 0.5.0 through 0.12.1

Description: A vulnerability in Apache Fory allows a remote attacker to cause a Denial of Service (DoS). The issue stems from the insecure deserialization of untrusted data. An attacker can supply a large, specially crafted data payload that, when processed, consumes an excessive amount of CPU resources during the deserialization process. This leads to CPU exhaustion, rendering the application or system using the Apache Fory library unresponsive and unavailable to legitimate users.

Mitigation: Users of Apache Fory are strongly advised to upgrade to version 0.12.2 or later to mitigate this vulnerability. Developers of libraries and applications that depend on Apache Fory should update their dependency requirements to Apache Fory 0.12.2 or later and release new versions of their software.
