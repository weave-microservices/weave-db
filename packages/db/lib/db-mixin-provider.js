/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2019 Fachwerk
 */

// npm packages
const { defaultsDeep } = require('@weave-js/utils')
const { createDbMethods } = require('./methods')
const { initActionFactories } = require('./provider-actions')
// own modules

const { createHooks } = require('./hooks')

/**
 * @typedef {Object} Adapter Database adapter
*/

/**
 * @typedef {Object} DbActionFactoryParams Database action factory parameters.
 * @property {string?} name Override action name
*/

/**
 * @typedef {Object} DbActions Database Mixin options
 * @property {function(DbActionFactoryParams):void} count Count action factory
 * @property {function(DbActionFactoryParams):void} find Count action factory
 * @property {function(DbActionFactoryParams):void} findOne Count action factory
 * @property {function(DbActionFactoryParams):void} findStream Count action factory
 * @property {function(DbActionFactoryParams):void} get Count action factory
 * @property {function(DbActionFactoryParams):void} insertMany Count action factory
 * @property {function(DbActionFactoryParams):void} insert Count action factory
 * @property {function(DbActionFactoryParams):void} list Count action factory
 * @property {function(DbActionFactoryParams):void} remove Count action factory
 * @property {function(DbActionFactoryParams):void} update Count action factory
*/

/**
 * @typedef {Object} DBMixinOptions Database Mixin options
 * @property {Adapter} [adapter] Database adapter.
 * @property {boolean} [loadAllActions=false] Should the mixin load all actions.
 * @property {('emit'|'broadcast')} [entityChangedEventType=emit] Event type of the entity changed events.
 * @property {string} [eventChangedName] Event changed name.
 * @property {boolean} [autoReconnect=true] Try reconnect if the DB connection fails.
 * @property {number} [reconnectTimeout=2000] Reconnect timeout.
 * @property {boolean} [throwErrorIfNotFound=true] Throw an error if an document not exisis.
*/

/**
 * @typedef {Object} DbServiceProvider Database Mixin options
 * @property {Object} mixin DB mixin
 * @property {DbActions} action Actions
*/

/**
 * Create a new DB mixin instance.
 * @param {DBMixinOptions=} mixinOptions DB mixin options
 * @returns {DbServiceProvider} Db Mixin
*/
module.exports = (mixinOptions) => {
  mixinOptions = defaultsDeep(mixinOptions, {
    loadAllActions: false,
    actionVisibility: 'public',
    adapter: null,
    entityChangedEventType: 'emit',
    eventChangedName: '',
    cache: {
      enabled: false,
      keys: undefined
    },
    reconnectOnError: true,
    reconnectTimeout: 2000,
    throwErrorIfNotFound: true
  })

  const schema = {
    settings: {
      idFieldName: '_id',
      pageSize: 10,
      maxPageSize: 1000,
      lookups: null,
      fields: null
    },
    methods: {
      ...createDbMethods(mixinOptions)
    },
    ...createHooks(mixinOptions)
  }

  const actionFactories = initActionFactories(mixinOptions)

  // If the "loadAllActions" property is set to "true", we load all action factories with the default options
  const loadedActions = {}
  if (mixinOptions.loadAllActions) {
    Object.values(actionFactories).map(actionFactory => {
      Object.entries(actionFactory()).forEach(([key, action]) => {
        loadedActions[key] = action
      })
    })

    schema.actions = loadedActions
  }

  return {
    mixin: schema,
    action: actionFactories
  }
}
