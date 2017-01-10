//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

const async = require('async');
const painlessConfigAsCode = require('painless-config-as-code');
const environmentConfigurationResolver = require('environment-configuration-resolver');
const functionConfigurationResolver = require('function-configuration-resolver');
const graphObjectBuilder = require('./objectBuilder');
const keyVaultConfigurationResolver = require('keyvault-configuration-resolver');

const keyVaultClientIdFallbacks = [
  // 0: the value of the KEYVAULT_CLIENT_ID_KEY variable
  'KEYVAULT_CLIENT_ID',
  'AAD_CLIENT_ID',
];

const keyVaultClientSecretFallbacks = [
  // 0: the value of KEYVAULT_CLIENT_SECRET_KEY variable
  'KEYVAULT_CLIENT_SECRET',
  'AAD_CLIENT_ID',
];

function createDefaultResolvers(libraryOptions) {
  // The core environment resolver is used to make sure that the
  // right variables are used for KeyVault or other boostrapping
  const environmentProvider = libraryOptions.environmentProvider || painlessConfigAsCode();

  // KeyVault today needs a client ID and secret to bootstrap the
  // resolver. This does mean that the secret cannot be stored in
  // the vault.
  const keyVaultOptions = {
    getClientCredentials: () => {
      unshiftOptionalVariable(keyVaultClientIdFallbacks, environmentProvider, 'KEYVAULT_CLIENT_ID_KEY');
      unshiftOptionalVariable(keyVaultClientSecretFallbacks, environmentProvider, 'KEYVAULT_CLIENT_SECRET_KEY');

      const clientId = getEnvironmentValue(environmentProvider, keyVaultClientIdFallbacks);
      const clientSecret = getEnvironmentValue(environmentProvider, keyVaultClientSecretFallbacks);
      if (clientId && clientSecret) {
        return {
          clientId: clientId,
          clientSecret: clientSecret,
        };
      }
    },
  };

  const environmentOptions = {
    provider: environmentProvider,
  };

  const resolvers = [
    environmentConfigurationResolver(environmentOptions).resolveObjectVariables,
    keyVaultConfigurationResolver(keyVaultOptions).getObjectSecrets,
    functionConfigurationResolver().resolveFunctions,
  ];
  return resolvers;
}

function unshiftOptionalVariable(arr, environmentProvider, key) {
  let value = environmentProvider.get(key);
  if (value) {
    arr.unshift(value);
  }
  return arr;
}

function getEnvironmentValue() {
  const args = Array.prototype.slice.call(arguments);
  if (args.length < 2) {
    throw new Error('An environmentProvider instance and also at least one environment variable name must be passed to the evaluator.');
  }
  const environmentProvider = args.shift();
  for (let i = 0; i < args.length; i++) {
    const value = environmentProvider.get(args[i]);
    // Warning - false is a valid value
    if (value !== undefined && value !== null) {
      return value;
    }
  }
}

function getConfigGraph(libraryOptions, options, callback) {
  if (options.graph) {
    return callback(null, options.graph);
  }
  let graphProvider = options.graphProvider || libraryOptions.graphProvider || graphObjectBuilder;
  if (!graphProvider) {
    return callback(new Error('No graph provider configured for this environment.'));
  }
  graphProvider(options, (graphBuildError, graph) => {
    return callback(graphBuildError ? graphBuildError : null, graphBuildError ? undefined : graph);
  });
}

module.exports = function initialize(libraryOptions) {
  libraryOptions = libraryOptions || {};
  const resolvers = libraryOptions.resolvers || createDefaultResolvers(libraryOptions);
  if (!resolvers) {
    throw new Error('No resolvers provided.');
  }
  return {
    resolve: function (options, callback) {
      if (!callback && typeof(options) === 'function') {
        callback = options;
        options = null;
      }
      options = options || {};
      // Find, build or dynamically generate the configuration graph
      getConfigGraph(libraryOptions, options, (buildGraphError, graph) => {
        if (!graph) {
          throw new Error('No configuration "graph" provided as an option to this library. Automatic graph build is not yet available in this build/version.');
        }
        // Synchronously, in order, resolve the graph
        async.eachSeries(resolvers, (resolver, next) => {
          resolver(graph, next);
        }, (err) => {
          return callback(err ? err : null, err ? null : graph);
        });
      });
    },
  };
};
