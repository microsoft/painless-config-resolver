> This is the former README for the `keyvault-configuration-resolver-node` repo that has been integrated

# Azure KeyVault configuration secrets resolver

This library extends the official Azure KeyVault client library for Node.js with a new
method, `resolveObjectSecrets`, that takes an object graph (typically a set of configuration
data), walks the object to identify strings that use a custom syntax to identify KeyVault
secrets, and then gets the secret(s) using the KeyVault client, updating the value with the
resolved secret.

At this time the library is available on npm with the module name `keyvault-configuration-resolver`.

```
npm install keyvault-configuration-resolver --save
```

## Intended scenario

The purpose of this library is to help resolve a bunch of secrets at app startup, or other
times.

The goal is to prevent developer mistakes by keeping secrets in a KeyVault instead of checking in
credentials to a repository. It also helps keep production secrets more secret by not authorizing
the production key vault instance to work with other applications.

Since the resolution of key vault secrets in this case requires a client ID and secret, anyone
with the client ID and secret could resolve the secrets, but for us it's enough to prevent most
mistakes.

## Limitations/ known issues

- `npm-shrinkwrap.json`: shrinkwrap files may break this script

### Unofficial but useful

This component was developed by the Open Source Programs Office at Microsoft. The OSPO team
uses Node.js for some of its applications and has found this component to be useful. We are
sharing this in the hope that others may find it useful.

It's important to understand that this library was developed for use by a team at Microsoft, but
that this is not an official library or module built by the KeyVault team.

### Why a custom URI protocol syntax

We use a custom URI syntax to identify KeyVault secrets that we would like to address inside of
an object.

This is as opposed to trying to identify strings that are URIs and contain KeyVault addresses; we
have many valid scenarios where we resolve KeyVault secrets at runtime, so we do not want to
resolve them just once.

The custom syntax makes it very clear that the developer/configuration explicitly wants to take
the string with the `keyvault://` syntax and resolve it.

## How to use the library

The library simply extends the provided Azure KeyVault client for Node.js, or creates a new
instance, with a new method called `getObjectSecrets`.

### getObjectSecrets method

The get object secrets method takes in an object and a callback. Anything identified as a
KeyVault string URI (by having the custom `keyvault://` scheme) will
be resolved using KeyVault. The application will need to have permission to the vault(s)
or it will error out.

### example

Here is the environment that we are making available to this application:

```
AZUREAD_CLIENT_ID=our_AAD_app_id
AZUREAD_CLIENT_SECRET=our_AAD_app_secret
SESSION_SALT=keyvault://keyvaultname.vault.azure.net/secrets/our-app-session-salt
AZURE_STORAGE_ACCOUNT=keyvault://account@keyvaultname.vault.azure.net/secrets/azure-storage-account/7038c64d4b094ee897bc62dd43b29640
AZURE_STORAGE_KEY=keyvault://keyvaultname.vault.azure.net/secrets/azure-storage-account/7038c64d4b094ee897bc62dd43b29640
```

Note that this AAD client ID has been authorized as a service principal to have secret GET
access to the KeyVault. You can configure this in the Azure portal or using PowerShell, etc.

Our Azure storage key in this example also has a custom "tag" set called "account" that
includes the account name. This is to demonstrate how to refer to tag values stored
alongside the secret version.

Here is a sample object graph that contains some configuration information that our
application would like to use:

```
let config = {
  session: {
    salt: process.env.SESSION_SALT,
  },
  storage: {
    account: process.env.AZURE_STORAGE_ACCOUNT,
    key: process.env.AZURE_STORAGE_KEY,
  },
};
```

And here is how we go ahead at startup inside of our Express app to resolve these secrets:

```
const keyVaultResolver = require('keyvault-configuration-resolver');

const keyVaultConfig = {
  clientId: process.env.AZUREAD_CLIENT_ID,
  clientSecret: process.env.AZUREAD_CLIENT_SECRET,
};

keyVaultResolver(keyVaultConfig).getObjectSecrets(config, (resolutionError) => {
  if (resolutionError) {
    throw resolutionError;
  }
  // at this point, config values such as config.storage.key now have the secrets

  // ... continue your app work, or store in middleware
});
```

## How to instantiate the library

### With an AAD client ID and secret

Pass in the `clientId` and `clientSecret` as options to the library.

Alternatively, you can pass in a function called `getClientCredentials` that will be called when they are needed. `clientId` and `clientSecret` values are expected at this time.

### With an existing KeyVault credentials instance

Pass in the credentials as a property called `credentials`, and the KeyVaultClient will be
instantiated for you, along with the new method `getObjectSecrets`.

### With an existing KeyVault client instance

Simply pass in the client instance as the value of a property called `client`. The client
will then have a `getObjectSecrets` method.

You may also just pass in a KeyVault client instance. This is detected by the presence of
a function called "getSecret" on the passed-in object.

### With an AAD client certificate

_Not supported_

This work is not yet complete but may be available in a future update. At this time the app
secret must be provided for KeyVault resolution to work with Node.js apps.

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

## 1.0.4

- Thrown errors in validation by the key vault clients are propagated

## 1.0.3

- Newer dependencies
- Removes `eslint` dev dep

## 1.0.1

- Uses a newer KeyVault client

## 1.0.0

- For each resolution call (a set of changes through the object graph), a cache of secret responses is maintained. This improves performance for apps that include many sub-secret tag values or reuse the same secret many times.

## 0.9.7

- First stable release
