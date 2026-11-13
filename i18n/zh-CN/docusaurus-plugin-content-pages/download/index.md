---
id: download
title: 下载
---

Apache Fory™ 的官方发布以源码制品形式提供。

如需二进制安装，请参见 Apache Fory™ [快速开始](/zh-CN/docs/start/)文档。

## 最新版本

当前最新源码版本为 1.7.8：

| 版本  | 日期       | 源码                                                                                                                                                                                                                                                        | 发布说明                                                                                                           |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1.7.8 | 2026-11-13 | [source](https://www.apache.org/dyn/closer.lua/fory/apache-fory-1.7.8-src.tar.gz?action=download) [asc](https://downloads.apache.org/fory/apache-fory-1.7.8-src.tar.gz.asc) [sha512](https://downloads.apache.org/fory/apache-fory-1.7.8-src.tar.gz.sha512) | [GitHub 发布说明](https://github.com/apache/fory/releases/tag/v1.7.8) · [版本亮点](/zh-CN/blog/fory_1_7_8_release) |

## 所有归档版本

如需更早版本，请访问 [archive](https://archive.apache.org/dist/fory)。

## 验证发布文件

强烈建议对下载的文件进行校验。

Fory 为下载站点上的所有文件提供 SHA 摘要和 PGP 签名文件。
这些文件与对应制品同名，仅额外带有 `.sha512` 或 `.asc` 扩展名。

### 校验 Checksum

要验证 SHA 摘要，你需要 `.tar.gz` 文件及其对应的 `.tar.gz.sha512` 文件。示例命令如下：

```bash
sha512sum --check apache-fory-1.7.8-src.tar.gz.sha512
```

输出类似下面这样即表示校验通过：

```bash
apache-fory-1.7.8-src.tar.gz: OK
```

### 校验签名

要验证 PGP 签名，首先需要下载 [release KEYS](https://downloads.apache.org/fory/KEYS)。

然后导入下载得到的 `KEYS`：

```bash
gpg --import KEYS
```

之后可以校验签名：

```bash
gpg --verify apache-fory-1.7.8-src.tar.gz.asc apache-fory-1.7.8-src.tar.gz
```

核对 GPG 输出中的签名者及密钥指纹。1.7.8 源码包由 Apache Fory 自动发布密钥签名。

```text
gpg:                using RSA key C1FE86839CEDF2E023F4D9DF36A8FDFFA7A40EA5
gpg: Good signature from "Apache Fory Automated Release Signing <private@fory.apache.org>" [unknown]
```
