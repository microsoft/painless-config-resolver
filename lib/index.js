//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

module.exports = function initialize(libraryOptions) {
  const resolver = {
    resolve: function (options, callback) {
      if (!callback && typeof(options) === 'function') {
        callback = options;
        options = null;
      }
      options = options || {};

      callback();
    },
  };
  return resolver;
};
