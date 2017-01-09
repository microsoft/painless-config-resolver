//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

// NOTE: in the future this may be a part of "painless-config" or a more generalized package

const appRoot = require('app-root-path');
const fs = require('fs');
const path = require('path');

const supportedExtensions = new Map([
  ['.js', scriptProcessor],
  ['.json', jsonProcessor],
]);

function scriptProcessor(config, p) {
  const script = require(p);
  return typeof(script) === 'function' ? script(config) : script;
}

function jsonProcessor(config, p) {
  return require(p);
}

module.exports = (options, callback) => {
  if (!callback && typeof (options) === 'function') {
    callback = options;
    options = null;
  }

  options = options || {};
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
        const ret = processor(config, file);
        if (ret !== undefined) {
          config[nodeName] = ret;
        }
      } catch (ex) {
        ex.path = file;
        if (treatErrorsAsWarnings) {
          config[nodeName] = ex;
        } else {
          return callback(ex);
        }
      }
    }
    return callback(null, config);
  });
};
