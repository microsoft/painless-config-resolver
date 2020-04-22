> This is the former README for the `painless-config-as-code` repo that has been integrated

# painless-config-as-code

Environment variable resolution using configuration-as-code logic on top of painless-config. For Node.js apps.

## Environment value resolution

order        | type                 | provider of value       | notes
------------ | -------------------- | ----------------------- | ----------
1            | process env variable | painless-config         | process.env in node
2            | env.json file value  | painless-config         | will walk up the directory hierarchy until finding an env.json
3            | _env_.json file val  | painless-config-as-code | will look for an ./env/_env_.json, such as ./env/prod.json
4            | env package          | npm package             | package defined in package.json or ENVIRONMENT_MODULES_NAME

## How to use the library

```
const painlessConfigAsCode = require('painless-config-as-code');
const someValue = painlessConfigAsCode.get('SOME_VALUE');
```

### Unofficial but useful

This component was developed by the Open Source Programs Office at Microsoft. The OSPO team
uses Node.js for some of its applications and has found this component to be useful. We are
sharing this in the hope that others may find it useful.

It's important to understand that this library was developed for use by a team at Microsoft, but
that this is not an official library or module built by the KeyVault team.

# Other Node configuration libraries

There are many other configuration libraries for Node, but of course everyone
has their own favorite. Consider one of these if you'd like a more fully supported
library.

This library is most like `node-config`, with the different being that it is
limited to just JSON files at this time for values, and its use of `painless-config`
to resolve environment variables or other configuration values located up the
directory hierarchy.

In deciding to build this library many other libraries were considered.

# License

MIT

# Contributing

Pull requests will gladly be considered! A CLA may be needed.

This project has adopted the [Microsoft Open Source Code of
Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct
FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com)
with any additional questions or comments.

# Changes

## 0.0.2

- Adds support for environment-containing npm package(s)
  - Multiple packages are supported, with the first package values winning
  - Packages can be defined in an app's `package.json` as well as environment variables such as `ENVIRONMENT_MODULES`
  - Environment-variable based package names have higher precedence than `package.json`-based
- Can be required without calling as a function when no custom initialization options are needed
- The environment directory name can now be configured via the `ENVIRONMENT_DIRECTORY` key (and also `ENVIRONMENT_DIRECTORY_KEY` to change that variable name)
- The variable keys used to define the configuration environment can now be customized via `CONFIGURATION_ENVIRONMENT_KEYS`

## 0.0.1

- Initial release
