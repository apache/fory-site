---
id: download
title: Apache Fory(incubating) Download
---

The official Apache Fory releases are provided as source artifacts.

For binary install, please see Fory [install](/docs/docs/start/install/) document.

## The latest release

The latest source release is 0.11.2:

| Version | Date       | Source                                                                                                                                                                                                                                                                                                                                             | Release Notes                                                        |
|---------|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| 0.11.2  | 2025-07-10 | [source](https://www.apache.org/dyn/closer.lua/incubator/fory/0.11.2/apache-fory-0.11.2-incubating-src.tar.gz?action=download) [asc](https://downloads.apache.org/incubator/fory/0.11.2/apache-fory-0.11.2-incubating-src.tar.gz.asc) [sha512](https://downloads.apache.org/incubator/fory/0.11.2/apache-fory-0.11.2-incubating-src.tar.gz.sha512) | [release notes](https://github.com/apache/fory/releases/tag/v0.11.2) |

## All archived releases

For older releases, please check the [archive](https://archive.apache.org/dist/incubator/fory).

## Verify a release

It's highly recommended to verify the files that you download.

Fory provides SHA digest and PGP signature files for all the files that we host on the download site.
These files are named after the files they relate to but have `.sha512/.asc` extensions.

### Verifying Checksums

To verify the SHA digests, you need the `.tgz` and its associated `.tgz.sha512` file. An example command:

```bash
sha512sum --check apache-fory-incubating-0.11.2-src.tar.gz
```

It should output something like:

```bash
apache-fory-incubating-0.11.2-src.tar.gz: OK
```

### Verifying Signatures

To verify the PGP signatures, you will need to download the
[release KEYS](https://downloads.apache.org/incubator/fory/KEYS) first.

Then import the downloaded `KEYS`:

```bash
gpg --import KEYS
```

Then you can verify signature:

```bash
gpg --verify apache-fory-incubating-0.11.2-src.tar.gz.asc apache-fory-incubating-0.11.2-src.tar.gz
```

If something like the following appears, it means the signature is correct:

```bash
gpg: Signature made Sun Feb  9 12:09:36 2025 CST
gpg:                using RSA key F4796001336453FDE7BB45709C0212E28DD7828C
gpg: Good signature from "Weipeng Wang (CODE SIGNING KEY) <wangweipeng@apache.org>"
```

You should also verify the key using a command like:

```bash
gpg --fingerprint F4796001336453FDE7BB45709C0212E28DD7828C
```

It should output something like:

```bash
pub   rsa4096 2025-02-07 [SC]
      F479 6001 3364 53FD E7BB  4570 9C02 12E2 8DD7 828C
uid           [ultimate] Weipeng Wang (CODE SIGNING KEY) <wangweipeng@apache.org>
sub   rsa4096 2025-02-07
```
