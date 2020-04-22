//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

const objectPath = require('object-path');
const url = require('url');

// Configuration Assumptions:
// In URL syntax, we define a custom scheme of "env://" which resolves
// an environment variable in the object, directly overwriting the
// original value.
//
// For example:
//   "env://HOSTNAME" will resolve on a Windows machine to its hostname
//
// Note that this use of a custom scheme called "env" is not an officially
// recommended or supported thing, but it has worked great for us!

const envProtocol = 'env:';

function getUrlIfEnvironmentVariable(value) {
  try {
    const u = url.parse(value, true /* parse query string */);
    if (u.protocol === envProtocol) {
      return u;
    }
  }
  catch (typeError) {
    /* ignore */
  }
  return undefined;
}

function identifyPaths(node, prefix) {
  prefix = prefix !== undefined ? prefix + '.' : '';
  const paths = {};
  for (const property in node) {
    const value = node[property];
    if (typeof value === 'object') {
      Object.assign(paths, identifyPaths(value, prefix + property));
      continue;
    }
    if (typeof value !== 'string') {
      continue;
    }
    const envUrl = getUrlIfEnvironmentVariable(value);
    if (!envUrl) {
      continue;
    }
    const originalHostname = value.substr(value.indexOf(envProtocol) + envProtocol.length + 2, envUrl.hostname.length);
    if (originalHostname.toLowerCase() === envUrl.hostname.toLowerCase()) {
      envUrl.hostname = originalHostname;
    }
    paths[prefix + property] = envUrl;
  }
  return paths;
}

function defaultProvider() {
  return {
    get: (key) => {
      return process.env[key];
    },
  };
}

function createClient(options) {
  options = options || {};
  let provider = options.provider || defaultProvider();
  return {
    resolveObjectVariables: async (object) => {
      let paths = null;
      try {
        paths = identifyPaths(object);
      } catch(parseError) {
        throw parseError;
      }
      const names = Object.getOwnPropertyNames(paths);
      for (let i = 0; i < names.length; i++) {
        const path = names[i];
        const parsed = paths[path];
        const variableName = parsed.hostname;
        let variableValue = provider.get(variableName);

        // Support for default variables
        if (variableValue === undefined && parsed.query && parsed.query.default) {
          variableValue = parsed.query.default;
        }

        // Loose equality "true" for boolean values
        if (parsed.query && parsed.query.trueIf) {
          variableValue = parsed.query.trueIf == /* loose */ variableValue;
        }

        // Cast if a type is set to 'boolean' or 'integer'
        if (parsed.query && parsed.query.type) {
          const currentValue = variableValue;
          switch (parsed.query.type) {
          case 'boolean':
          case 'bool':
            if (currentValue && currentValue !== 'false' && currentValue != '0' && currentValue !== 'False') {
              variableValue = true;
            } else {
              variableValue = false;
            }
            break;

          case 'integer':
          case 'int':
            variableValue = parseInt(currentValue, 10);
            break;

          default:
            throw new Error(`The "type" parameter for the env:// string was set to "${parsed.query.type}", a type that is currently not supported.`);
          }
        }

        objectPath.set(object, path, variableValue);
      }
    },
  };
}

module.exports = createClient;
