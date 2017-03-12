//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

const appRoot = require('app-root-path');
const async = require('async');
const deepmerge = require('deepmerge');
const fs = require('fs');
const path = require('path');

const graphBuilder = require('./graphBuilder');

function composeGraphs(api, callback) {
  if (!callback && typeof (api) === 'function') {
    callback = api;
    api = null;
  }
  api = api || {};
  const options = api.options || {};
  let applicationRoot = (options.applicationRoot || appRoot).toString();

  const paths = [];

  // Configuration directory presence in the app
  // -------------------------------------------
  addAppConfigDirectory(paths, api, options, applicationRoot);

  // Configuration packages defined explicitly in app's package.json
  // ---------------------------------------------------------------
  let pkg = getPackage(applicationRoot);
  if (pkg && pkg.painlessConfigObjectPackages) {
    let pco = Array.isArray(pkg.painlessConfigObjectPackages) ? pkg.painlessConfigObjectPackages : pkg.painlessConfigObjectPackages.split(',');
    addConfigPackages(paths, applicationRoot, pco);
  }

  // Environment-based configuration packages
  // ----------------------------------------
  const additionalPackagesKey = api.environment.get('CONFIGURATION_PACKAGES_KEY') || 'CONFIGURATION_PACKAGES';
  let configurationPakages = api.environment.get(additionalPackagesKey);
  if (configurationPakages) {
    configurationPakages = configurationPakages.split(',');
    addConfigPackages(paths, applicationRoot, configurationPakages);
  }

  if (paths.length === 0) {
    return callback(new Error('No configuration packages or directories were found to process. Consider using "options.graph" as an option to the configuration resolver if you do not need to use configuration directories. Otherwise, check that you have configured your package.json or other environment values as needed.'));
  }

  // Build the graph
  // ---------------
  let graph = {};
  async.eachSeries(paths.reverse(), (p, next) => {
    graphBuilder(api, p, (buildError, result) => {
      if (buildError) {
        return next(buildError);
      }
      graph = deepmerge(graph, result);
      return next();
    });
  }, error => {
    if (!error && (!graph || Object.getOwnPropertyNames(graph).length === 0)) {
      error = new Error(`Successfully processed ${paths.length} configuration graph packages or directories, yet the resulting graph object did not have properties. This is likely an error or issue that should be corrected. Or, alternatively, use options.graph as an input to the resolver.`);
    }
    return callback(error, error ? null : graph);
  });
};

function addConfigPackages(paths, applicationRoot, painlessConfigObjects) {
  for (let i = 0; i < painlessConfigObjects.length; i++) {
    addConfigPackage(paths, applicationRoot, painlessConfigObjects[i]);
  }
}

function getPackage() {
  try {
    const pkgPath = path.join(applicationRoot, 'package.json');
    pkg = require(pkgPath);
    return pkg;
  } catch (noPackageJson) {
    // It's OK if the app doesn't have a package.json
  }
}

function addConfigPackage(paths, applicationRoot, npmName) {
  let root = null;
  let packageInstance = null;
  npmName = npmName.trim();
  if (!npmName.startsWith('.')) {
    try {
      packageInstance = require(npmName);
    } catch (cannotRequire) {
      const error = new Error(`While trying to identify configuration graphs, ${npmName} could not be required`);
      error.innerError = cannotRequire;
      throw error;
    }
    if (typeof(packageInstance) === 'string') {
      root = packageInstance;
    } else {
      throw new Error(`The package ${npmName} instance is not of type string. For the configuration graph system it should be a string (a path).`);
    }
  } else {
    root = path.resolve(path.join(applicationRoot, npmName));
  }
  try {
    fs.statSync(root);
    paths.push(root);
  } catch (notFound) {
    if (packageInstance) {
      throw new Error(`While instantiating "${npmName}, the returned string value was not a valid path: ${root}`);
    } else {
      throw new Error(`Could not locate the local configuration directory for package "${npmName}": ${root}`);
    }
  }
}

function addAppConfigDirectory(paths, api, options, applicationRoot) {
  let directoryName = options.directoryName;
  let key = null;
  if (!directoryName && api.environment) {
    key = api.environment.get('CONFIGURATION_GRAPH_DIRECTORY_KEY') || 'CONFIGURATION_GRAPH_DIRECTORY';
    directoryName = api.environment.get(key);
  }
  if (!directoryName) {
    return;
  }
  const dirPath = path.join(applicationRoot, directoryName);
  try {
    fs.statSync(dirPath);
    paths.push(dirPath);
  } catch (notFound) {
    const error = new Error(`The configuration graph directory ${dirPath} was not found. ${key}`);
    error.innerError = notFound;
    throw error;
  }
}

module.exports = composeGraphs;
