//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

const environmentConfigurationResolver = require('./environmentConfigurationResolver');
const multiGraphBuilder = require('./multiGraphBuilder');
const keyVaultConfigurationResolver = require('./keyVaultConfigurationResolver');
const volumeConfigurationResolver = require('./volumeConfigurationResolver');
const painlessConfigAsCode = require('./painlessConfigAsCode');

const keyVaultClientIdFallbacks = [
  // 0: the value of the KEYVAULT_CLIENT_ID_KEY variable
  'KEYVAULT_CLIENT_ID',
  'AAD_CLIENT_ID',
];

const keyVaultClientSecretFallbacks = [
  // 0: the value of KEYVAULT_CLIENT_SECRET_KEY variable
  'KEYVAULT_CLIENT_SECRET',
  'AAD_CLIENT_SECRET',
];

function createDefaultResolvers(libraryOptions) {
  // The core environment resolver is used to make sure that the
  // right variables are used for KeyVault or other boostrapping
  const environmentProvider = libraryOptions.environmentProvider || painlessConfigAsCode(libraryOptions);

  try {
    environmentProvider.get(); // for init
  } catch (ignoreError) {
    console.warn(ignoreError);
  }
  const environmentOptions = {
    provider: environmentProvider,
  };
  const volumeResolver = volumeConfigurationResolver(environmentOptions);
  const keyVaultOptions = {
    getClientCredentials: async () => {
      unshiftOptionalVariable(keyVaultClientIdFallbacks, environmentProvider, 'KEYVAULT_CLIENT_ID_KEY');
      unshiftOptionalVariable(keyVaultClientSecretFallbacks, environmentProvider, 'KEYVAULT_CLIENT_SECRET_KEY');
      async function getEnvironmentOrVolumeValue(fallbacks) {
        let value = getEnvironmentValue(environmentProvider, fallbacks);
        const asVolumeFile = volumeResolver.isVolumeFile(value);
        if (asVolumeFile) {
          value = await volumeResolver.resolveVolumeFile(environmentProvider, asVolumeFile);
        }
        return value;
      }
      const clientId = await getEnvironmentOrVolumeValue(keyVaultClientIdFallbacks);
      const clientSecret = await getEnvironmentOrVolumeValue(keyVaultClientSecretFallbacks);
      if (clientId && clientSecret) {
        return {
          clientId: clientId,
          clientSecret: clientSecret,
        };
      }
    },
  };

  const resolvers = [
    environmentConfigurationResolver(environmentOptions).resolveObjectVariables,
    volumeResolver.resolveVolumeFiles,
    keyVaultConfigurationResolver(keyVaultOptions).getObjectSecrets,
  ];

  resolvers.environment = environmentProvider;

  return resolvers;
}

function unshiftOptionalVariable(arr, environmentProvider, key) {
  let value = environmentProvider.get(key);
  if (value) {
    arr.unshift(value);
  }
  return arr;
}

function getEnvironmentValue(environmentProvider, potentialNames) {
  for (let i = 0; i < potentialNames.length; i++) {
    const value = environmentProvider.get(potentialNames[i]);
    // Warning - false is a valid value
    if (value !== undefined && value !== null) {
      return value;
    }
  }
}

async function getConfigGraph(libraryOptions, options, environmentProvider) {
  if (options.graph) {
    return options.graph;
  }
  let graphProvider = options.graphProvider || libraryOptions.graphProvider || multiGraphBuilder;
  if (!graphProvider) {
    throw new Error('No graph provider configured for this environment: no options.graphProvider or libraryOptions.graphProvider or multiGraphBuilder');
  }
  const graphLibraryApi = {
    options,
    environment: environmentProvider,
  };
  const graph = await graphProvider(graphLibraryApi);
  return graph;
}

function initialize(libraryOptions) {
  libraryOptions = libraryOptions || {};
  const resolvers = libraryOptions.resolvers || createDefaultResolvers(libraryOptions);
  if (!resolvers) {
    throw new Error('No resolvers provided.');
  }
  const environmentProvider = resolvers.environment;
  return {
    resolve: async function (options) {
      if (typeof(options) === 'function') {
        const deprecatedCallback = options;
        return deprecatedCallback(new Error('This library no longer supports callbacks. Please use native JavaScript promises, i.e. const config = await painlessConfigResolver.resolve();'));
      }
      options = options || {};
      // Find, build or dynamically generate the configuration graph
      const graph = await getConfigGraph(libraryOptions, options, environmentProvider);
      if (!graph) {
        throw new Error('No configuration "graph" provided as an option to this library. Unless using a configuration graph provider, the graph option must be included.');
      }
      try {
      // Synchronously, in order, resolve the graph
        for (const resolver of resolvers) {
          await resolver(graph);
        }
      } catch (resolveConfigurationError) {
        console.warn(`Error while resolving the graph with a resolver: ${resolveConfigurationError}`);
        throw resolveConfigurationError;
      }
      return graph;
    },
  };
}

initialize.resolve = function moduleWithoutInitialization(options) {
  return initialize().resolve(options);
};

module.exports = initialize;
