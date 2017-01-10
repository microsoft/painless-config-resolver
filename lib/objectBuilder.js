//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

// NOTE: in the future this may be a part of "painless-config" or a more generalized package

const appRoot = require('app-root-path');
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

module.exports = (api, callback) => {
  if (!callback && typeof (api) === 'function') {
    callback = api;
    api = null;
  }
  api = api || {};
  const options = api.options || {};
  const applicationRoot = options.applicationRoot || appRoot;
  const directoryName = options.directoryName || 'config';
  const treatErrorsAsWarnings = options.treatErrorsAsWarnings || false;

  const dirPath = path.join(applicationRoot.toString(), directoryName);
  const config = {};
  fs.readdir(dirPath, (directoryError, files) => {
    if (directoryError) {
      return callback(directoryError);
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
        if (value !== undefined) {
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
    return callback(null, config);
  });
};
