//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

const fs = require('fs');
const objectPath = require('object-path');
const path = require('path');

const supportedExtensions = new Map([
  ['.js', scriptProcessor],
  ['.json', jsonProcessor],
]);

function scriptProcessor(api, config, p) {
  const script = require(p);
  return typeof(script) === 'function' ? script(api, config) : script;
}

function jsonProcessor(api, config, p) {
  return require(p);
}

function fsReadDir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (directoryError, files) => {
      return directoryError ? reject(directoryError) : resolve(files);
    });
  });
}

module.exports = async (api, dirPath) => {
  api = api || {};
  const options = api.options || {};

  const treatErrorsAsWarnings = options.treatErrorsAsWarnings || false;
  const requireConfigurationDirectory = options.requireConfigurationDirectory || false;

  const config = {};
  let files = [];
  try {
    files = await fsReadDir(dirPath);
  } catch (directoryError) {
    // behavior change: version 1.x of this library through whenever this error'd, not just if required
    if (requireConfigurationDirectory) {
      throw directoryError;
    }
  }
  for (let i = 0; i < files.length; i++) {
    const file = path.join(dirPath, files[i]);
    const ext = path.extname(file);
    const nodeName = path.basename(file, ext);
    const processor = supportedExtensions.get(ext);
    if (!processor) {
      continue;
    }
    try {
      const value = processor(api, config, file);
      if (value && typeof(value) === 'string' && value === dirPath) {
        // Skip the index.js for local hybrid package scenarios
      } else if (value !== undefined) {
        objectPath.set(config, nodeName, value);
      }
    } catch (ex) {
      ex.path = file;
      if (treatErrorsAsWarnings) {
        objectPath.set(config, nodeName, ex);
      } else {
        return callback(ex);
      }
    }
  }
  return config;
};
