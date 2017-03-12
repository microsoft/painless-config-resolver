# painless-config-resolver

Yet another opinionated Node.js configuration library providing a set of default resolvers to enable rapid, rich configuration object graphs powered by the deployment environment, config-as-code, and Azure KeyVault secrets.

## Resolving variables into a simple configuration graph

This library takes an object (a configuration graph) containing simple variables or
script and uses configuration providers, in order, to try and resolve.

As configured by default this means variables can come from:

- environment variables always win
- painless-config development environment `env.json` file outside an app's root
- configuration-as-code JSON file, per-environment

Variables themselves will be sent to other resolvers, so the values can be:

- direct values from variables
- KeyVault secrets to resolve at runtime from Azure KeyVault

In lieu of a configuration graph object, a special `config/` directory structure
with JSON and JS files can be used to build the configuration object at startup,
making it easy to compartmentalize values.

## Part of the painless-config family

This module is a part of the `painless-config` family of configuration libraries.

- [painless-config](https://github.com/Microsoft/painless-config): resolving a variable from an `env.json` file or the environment with a simple `get(key)` method
- [painless-config-as-code](https://github.com/Microsoft/painless-config-as-code): resolving a variable from an environment-specific configuration file located within a repository, enabling configuration-as-code, including code reviews and pull requests for config changes.

## How to use

Resolve a simple set of variables from the environment.

```
const resolver = require('painless-config-resolver');

const graph = {
  hostname: 'env://HOSTNAME',
  app: 'my app',
};

resolver.resolve(graph, (error, config) => {
  if (error) {
    throw error;
  }

  // ... config has the resolved values ...
});
```

After calling `resolve` the `config` object might look like:

```
{
  hostname: 'JMWORKMACHINE',
  app: 'my app',
}
```

### Unofficial but useful

This component was developed by the Open Source Programs Office at Microsoft. The OSPO team
uses Node.js for some of its applications and has found this component to be useful. We are
sharing this in the hope that others may find it useful.

It's important to understand that this library was developed for use by a team at Microsoft, but
that this is not an official library or module built by the KeyVault team.

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

## 1.0.0

- Configuration folder `./config` is no longer implicit.
- Automatic graph configuration must be specified through `package.json` properties under `painlessConfigObjectPackages` and/or environment variables pointing at config-containing npm and/or directories. To maintain the previous behavior, configure an environment or config-as-code variable named `CONFIGURATION_GRAPH_DIRECTORY` or the option `directoryName` with the value `config`.
- Adds CONFIGURATION_PACKAGES support for dynamic/environment-based configuration package inclusion

## 0.1.4

- Able to instantiate without calling the module as a function
- No longer requires the presence of a `./config` graph folder

## 0.1.3

- First stable release