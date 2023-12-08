/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2019 Fachwerk
 */

// npm packages
const { defaultsDeep } = require('@weave-js/utils');
const { createDbMethods } = require('./methods');
const { initActionFactories } = require('./provider-actions');
// own modules

const { createHooks } = require('./hooks');

/**
 * @typedef {Object} Adapter Database adapter
*/

/**
 * @typedef {Object} DbActionFactoryParams Database action factory parameters.
 * @property {string=} name Override action name
 * @property {'public'|'private'|'protected'} actionVisibility Visibility of action
*/

/**
 * @typedef {Object} DbActions Database Mixin options
 * @property {function(DbActionFactoryParams=):void} count Count action factory
 * @property {function(DbActionFactoryParams=):void} find Count action factory
 * @property {function(DbActionFactoryParams=):void} findOne Count action factory
 * @property {function(DbActionFactoryParams=):void} findStream Count action factory
 * @property {function(DbActionFactoryParams=):void} get Count action factory
 * @property {function(DbActionFactoryParams=):void} insertMany Count action factory
 * @property {function(DbActionFactoryParams=):void} insert Count action factory
 * @property {function(DbActionFactoryParams=):void} list Count action factory
 * @property {function(DbActionFactoryParams=):void} remove Count action factory
 * @property {function(DbActionFactoryParams=):void} update Count action factory
*/

/**
 * @typedef {Object} DBMixinValidatorOptions Database Mixin options
 * @property {boolean} strict Enable validator strict mode
 * @property {'remove'|'error'} strictMode Actions
*/

/**
 * @typedef {Object} DbServiceProvider Database Mixin options
 * @property {Object} mixin DB mixin
 * @property {DbActions} action Actions
*/

/**
 * Create a new DB mixin instance.
 * @param {import('../../types/internal').DBMixinOptions} mixinOptions DB mixin options
 * @returns {import('../../types/internal').DbServiceProvider} Db Mixin
*/
function createDbMixinProvider (mixinOptions) {
  mixinOptions = defaultsDeep(mixinOptions, {
    loadAllActions: false,
    actionVisibility: 'protected',
    adapter: null,
    entityChangedEventType: 'emit',
    entityChangedEventName: '$cache.',
    cache: {
      enabled: false,
      keys: undefined,
      clearEventName: null
    },
    validator: {
      strict: true,
      strictMode: 'remove' // error
    },
    fields: null,
    reconnectOnError: true,
    reconnectTimeout: 2000,
    throwErrorIfNotFound: true
  });

  const serviceSchema = {
    settings: {
      idFieldName: '_id',
      pageSize: 10,
      maxPageSize: 1000,
      lookups: null,
      fields: null
    },
    adapter: mixinOptions.adapter,
    entitySchema: mixinOptions.entitySchema,
    methods: {
      ...createDbMethods(mixinOptions)
    },
    ...createHooks(mixinOptions)
  };

  const actionFactories = initActionFactories(mixinOptions, serviceSchema);

  // If the "loadAllActions" property is set to "true", we load
  // all action factories with the default options
  const loadedActions = {};
  if (mixinOptions.loadAllActions) {
    Object.values(actionFactories).map(actionFactory => {
      Object.entries(actionFactory()).forEach(([key, action]) => {
        loadedActions[key] = action;
      });
    });

    // Add loaded actions to the service schema
    serviceSchema.actions = loadedActions;
  }

  return {
    mixin: serviceSchema,
    action: actionFactories
  };
};

module.exports = { createDbMixinProvider };
