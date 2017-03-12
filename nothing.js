'use strict'

// 3: express provider initialization & configuration, including 'implicit' middleware (environment-based names)
      // DEPLOYMENT_IMPLICIT_NPMS = '@ospo/microsoft-directory-provider,@ospo/legacy-oss-db'
// 4: configuration specific to a sub-library
      // sub-library includes a configuration graph & resolves it; @ospo/legacy-oss-configuration
      // getPainlessConfigurationGraph() {
      //   return painlessConfigurationGraph();
      //}
//
// prepare list of providers first (phase 1 resolver)
// require each provider
// functions/options returned for each...
// .getPainlessConfigurationGraph(...)
// .initialize()
// .initializeExpress()
// ... becomes ...
// config.providers[npmName] --> the graph for that provider
//

// 5: during resolution of configuration graph, cache identical secrets for performance win


const tempConfig = require('temp-config')('hey');
console.log(tempConfig);

const tempConfig2 = require('temp-config-json');
console.log(tempConfig2);

const rr = require.resolve('temp-config-json');
console.log(rr);

// key vault key off of different environment variables for client id and secret
// KEYVAULT_CLIENT_ID_KEY
// KEYVAULT_CLIENT_SECRET_KEY

// combine any and all environment name packages
// combine any and all configuration graph objects using Object.assign in-order

// ENVIRONMENT PROVIDER can be used to get these first things rolling
// standard environment provider also could have support for special variables, i.e.
// ...
// ENVIRONMENT_VARIABLE_NAME --> ENVIRONMENT_NAME
// ENVIRONMENT_NAME
//
// ENVIRONMENT_MODULES_KEY --> ENVIRONMENT_MODULES
// ENVIRONMENT_MODULES

// ENVIRONMENT_DIRECTORY_KEY -> ENVIRONMENT_DIRECTORY
// use that variable; OR fallback to 'env' in the app's root
// a module of the name '.' means the local app's stuff

// 1: resolve the library IF module var name set; use this to get the directory for configuration use
      // ^ may not pass any variable if it cannot resolve the variable name for the config; that's OK
//   A: IF the return type is a function, this can be used to select the app config - function call returns the graph
//   B: IF the return type is an object, use it!
//   C: If the return is null, try for a ./config directory
// 2: ELSE if no app config stuff present, use local /.config dir

// APPLICATION_CONFIGURATION_MODULE_VARIABLE_NAME -> APPLICATION_CONFIGURATION_MODULE_NAME
// APPLICATION_CONFIGURATION_MODULE_NAME = '@ospo/config'
// APPLICATION_CONFIGURATION_VARIABLE_NAME ---> default is APPLICATION_CONFIGURATION
// APPLICATION_CONFIGURATION --> resolve
// a local module name of '.' means the local app's version of stuff

// APPLICATION_CONFIGURATION_FALLBACK_DIRECTORY_VARIABLE_NAME -> APPLICATION_CONFIGURATION_FALLBACK_DIRECTORY_NAME
// ... if no fallback value, 'config'


// ... new painless-config-object or painless-config-graph npm?
// takes a directory and builds the config graph from it
// could also support combinations, i.e. repos = github + redis + ...

const pcc = require('./lib/');
const options = {
  graph: tempConfig,
};
pcc.resolve(options, error => {
console.dir(error);
});
