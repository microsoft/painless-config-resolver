# painless-config-resolver

Yet another opinionated Node.js configuration library providing a set of default resolvers to enable rapid, rich configuration object graphs powered by the deployment environment, config-as-code, and Azure KeyVault secrets.

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

## 0.0.19

- Able to instantiate without calling the module as a function
- No longer requires the presence of a `./config` graph folder

## 0.0.18

- First stable release