# Apache Fory (incubating) Website

The source repository of static website for Apache Fory (incubating): https://github.com/apache/fory.

> [!IMPORTANT]
> Apache Fory (incubating) is an effort undergoing incubation at the Apache
> Software Foundation (ASF), sponsored by the Apache Incubator PMC.
>
> Please read the [DISCLAIMER](DISCLAIMER) and a full explanation of ["incubating"](https://incubator.apache.org/policy/incubation.html).

## Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Release doc version

```
yarn docusaurus docs:version xxxx
```

> **Note:** This command only versions the default docs.  
> To version i18n docs, you must manually copy the contents of  
> `i18n/<locale>/docusaurus-plugin-content-docs/current/`  
> to  
> `i18n/<locale>/docusaurus-plugin-content-docs/version-xxxx/`  
> for each locale.

## How to Contribute

Please read the [CONTRIBUTING](CONTRIBUTING.md) guide for instructions on how to contribute.

## LICENSE

[Apache License 2.0](./LICENSE).
