//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

const objectPath = require('object-path');
const fs = require('fs').promises;
const path = require('path');

// Volume Assumptions:
// For now, the simple model, the volume is defined in PCR_VOLUME_MOUNT.
// The file is the value after volumefile:.

const pcrVolumeMountVariable = 'PCR_VOLUME_MOUNT';
const volumeFilePrefix = 'volumefile:';

function getAsVolumeFile(value) {
  if (value && value.startsWith && value.startsWith(volumeFilePrefix)) {
    const i = value.indexOf(volumeFilePrefix);
    const v = value.substr(i + volumeFilePrefix.length);
    return path.basename(v);
  }
  return undefined;
}

async function identifyPaths(provider, node, prefix) {
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
    const asVolumeFile = getAsVolumeFile(value);
    if (!asVolumeFile) {
      continue;
    }

    const volumePath = provider.get(pcrVolumeMountVariable);
    if (!volumePath) {
      throw new Error(`Unable to resolve volume path ${asVolumeFile}, no defined ${pcrVolumeMountVariable}`);
    }

    const combined = path.resolve(volumePath, asVolumeFile);

    try {
      const contents = await fs.readFile(combined, 'utf8');
      paths[prefix + property] = contents;
    } catch (error) {
      throw new Error(`Unable to resolve volume file ${asVolumeFile} from ${pcrVolumeMountVariable}`);
    }
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
    resolveVolumeFiles: async (object) => {
      let paths = null;
      try {
        paths = await identifyPaths(provider, object);
      } catch(parseError) {
        throw parseError;
      }
      const names = Object.getOwnPropertyNames(paths);
      for (let i = 0; i < names.length; i++) {
        const p = names[i];
        const volumeValue = paths[p];
        objectPath.set(object, p, volumeValue);
      }
    },
  };
}

module.exports = createClient;
