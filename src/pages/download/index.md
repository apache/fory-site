---
id: download
title: Apache Fory™ Download
---

The official Apache Fory™ releases are provided as source artifacts.

For binary install, please see the Apache Fory™ [getting started](/docs/start/) documentation.

## The latest release

The latest source release is 1.7.8:

| Version | Date       | Source                                                                                                                                                                                                                                                      | Release Notes                             |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1.7.8   | 2026-11-13 | [source](https://www.apache.org/dyn/closer.lua/fory/apache-fory-1.7.8-src.tar.gz?action=download) [asc](https://downloads.apache.org/fory/apache-fory-1.7.8-src.tar.gz.asc) [sha512](https://downloads.apache.org/fory/apache-fory-1.7.8-src.tar.gz.sha512) | [release notes](/blog/fory_1_7_8_release) |

## All archived releases

For older releases, please check the [archive](https://archive.apache.org/dist/fory).

## Verify a release

It's highly recommended to verify the files that you download.

Fory provides SHA digest and PGP signature files for all the files that we host on the download site.
These files are named after the files they relate to but have `.sha512/.asc` extensions.

### Verifying Checksums

To verify the SHA digests, you need the `.tar.gz` file and its associated `.tar.gz.sha512` file. An example command:

```bash
sha512sum --check apache-fory-1.7.8-src.tar.gz.sha512
```

It should output something like:

```bash
apache-fory-1.7.8-src.tar.gz: OK
```

### Verifying Signatures

To verify the PGP signatures, you will need to download the
[release KEYS](https://downloads.apache.org/fory/KEYS) first.

Then import the downloaded `KEYS`:

```bash
gpg --import KEYS
```

Then you can verify signature:

```bash
gpg --verify apache-fory-1.7.8-src.tar.gz.asc apache-fory-1.7.8-src.tar.gz
```

Check the signer and fingerprint in the GPG output. The Apache Fory automated release key signed the 1.7.8 source archive.

```text
gpg:                using RSA key C1FE86839CEDF2E023F4D9DF36A8FDFFA7A40EA5
gpg: Good signature from "Apache Fory Automated Release Signing <private@fory.apache.org>" [unknown]
```
