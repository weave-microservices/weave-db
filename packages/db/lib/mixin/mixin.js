/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2019 Fachwerk
 */

// npm packages
const { promisify, isFunction, isObject, dotGet, dotSet, flattenDeep } = require('@weave-js/utils');

// own modules
const NeDbAdapter = require('../adapter');
const { WeaveParameterValidationError } = require('@weave-js/core/lib/errors');
const { createActions } = require('./register-actions');

module.exports = (mixinOptions) => {
  return {
    settings: {
      idFieldName: '_id',
      pageSize: 10,
      maxPageSize: 1000,
      lookups: null,
      fields: null
    },
    actions: {
      ...createActions(mixinOptions)
    },
    methods: {
      connect () {
        const self = this;
        return this.adapter.connect().then((adapterResult) => {
          try {
            if (isFunction(self.schema.afterConnect)) {
              self.schema.afterConnect.call(this, adapterResult);
            }
          } catch (error) {
            this.log.error('afterConnect error: ', error);
          }
        });
      },
      disconnect () {
        return this.adapter.disconnect();
      },
      sanitizeParams (context, data) {
        const sanitizedData = Object.assign({}, data);

        if (typeof sanitizedData.limit === 'string') {
          sanitizedData.limit = Number(sanitizedData.limit);
        }

        if (typeof sanitizedData.offset === 'string') {
          sanitizedData.offset = Number(sanitizedData.offset);
        }

        if (typeof sanitizedData.page === 'string') {
          sanitizedData.page = Number(sanitizedData.page);
        }

        if (typeof sanitizedData.pageSize === 'string') {
          sanitizedData.pageSize = Number(sanitizedData.pageSize);
        }

        if (typeof sanitizedData.lookup === 'string') {
          sanitizedData.lookup = sanitizedData.lookup.split(' ');
        }

        // If we use ID mapping and want only specific fields, we need to add the id field to the fieldlist.
        if (sanitizedData.mapIds === true) {
          if (Array.isArray(sanitizedData.fields) > 0 && !sanitizedData.fields.includes(this.settings.idFieldName)) {
            sanitizedData.fields.push(this.settings.idFieldName);
          }
        }

        // handle list action
        if (context.action.name.endsWith('.list')) {
          if (!sanitizedData.page) {
            sanitizedData.page = 1;
          }

          if (!sanitizedData.pageSize) {
            sanitizedData.pageSize = this.settings.pageSize;
          }

          sanitizedData.limit = sanitizedData.pageSize;
          sanitizedData.offset = (sanitizedData.page - 1) * sanitizedData.pageSize;
        }

        return sanitizedData;
      },
      getById (id) { // by ids
        return Promise.resolve(id)
          .then(id => {
            if (Array.isArray(id)) {
              return this.adapter.findByIds(id);
            }

            return this.adapter.findById(id);
          });
      },
      transformDocuments (context, data, entities) {
        let isEntity = false;

        // if "docs" is a single object - wrap it in an array
        if (!Array.isArray(entities)) {
          if (isObject(entities)) {
            isEntity = true;
            entities = [entities];
          } else {
            return Promise.resolve(entities);
          }
        }

        return Promise.resolve(entities)
          .then((entities) => entities.map(entity => this.adapter.entityToObject(entity)))
          .then((json) => data.lookup ? this.lookupDocs(context, json, data.lookup) : json)
          .then((json) => this.filterFields(json, data.fields ? data.fields : this.settings.fields))
          .then((json) => isEntity ? json[0] : json);
      },
      lookupDocs (context, entities, lookupFields) {
        if (!this.settings.lookups || !Array.isArray(lookupFields) || lookupFields.length === 0) {
          return Promise.resolve(entities);
        }

        if (entities === null || !isObject(entities) || !Array.isArray(entities)) {
          return Promise.resolve(entities);
        }

        const promises = [];

        Object.keys(this.settings.lookups).forEach(key => {
          let rule = this.settings.lookups[key];

          if (lookupFields.indexOf(key) === -1) {
            return;
          }

          if (isFunction(rule)) {
            rule = {
              handler: promisify(rule)
            };
          }

          if (typeof rule === 'string') {
            rule = {
              action: rule
            };
          }

          const arr = Array.isArray(entities) ? entities : [entities];
          const idList = flattenDeep(arr.map(entity => dotGet(entity, key)));

          const transformResponse = lookedUpDocs => {
            arr.forEach(entity => {
              const id = dotGet(entity, key);

              if (Array.isArray(id)) {
                dotSet(entity, key, id.map(id => lookedUpDocs[id]).filter(Boolean));
              } else {
                const value = lookedUpDocs === null ? null : lookedUpDocs[id];
                dotSet(entity, key, value);
              }
            });
          };

          if (rule.handler) {
            let ruleResult = rule.handler.call(this, context, arr, idList, rule);

            if (isFunction(rule.transformation)) {
              ruleResult = ruleResult.then(rule.transformation);
            }

            promises.push(ruleResult);
          } else {
            const data = Object.assign({
              id: idList,
              mapIds: true
            }, rule.params || {});

            promises.push(context.call(rule.action, data).then(transformResponse));
          }
        });

        return Promise.all(promises)
          .then(() => {
            return entities;
          });
      },
      filterFields (entities, fields) {
        return Promise.resolve(entities)
          .then((entities) => {
            if (Array.isArray(fields)) {
              if (Array.isArray(entities)) {
                return entities.map((entity) => {
                  const result = {};

                  fields.forEach(field => (dotSet(result, field, dotGet(entity, field))));

                  if (Object.keys(result).length > 0) {
                    return result;
                  }
                });
              } else {
                const result = {};

                fields.forEach(field => (dotSet(result, field, dotGet(entities, field))));

                if (Object.keys(result).length > 0) {
                  return result;
                }
              }
            }

            return entities;
          });
      },
      entityChanged (type, data, context) {
        this.log.verbose('Entity changed');

        return this.clearCache().then(() => {
          const hookName = `entity${type}`;
          if (isFunction(this.schema[hookName])) {
            this.schema[hookName].call(this, data, context);
          }
          return Promise.resolve();
        });
      },
      clearCache () {
        this.log.verbose(`Clear cache for service: ${this.name}`);
        this.runtime.eventBus.broadcast(`$cache.clear.${this.name}`);

        if (this.runtime.cache) {
          return this.runtime.cache.clear(`${this.name}.*`);
        }

        return Promise.resolve();
      },
      validateEntity (entity) {
        if (!isFunction(this.entityValidator)) {
          return Promise.resolve(entity);
        }

        const entities = Array.isArray(entity) ? entity : [entity];

        return Promise.all(entities.map(e => this.entityValidator(e))).then(() => entity);
      }
    },
    created () {
      if (this.schema.adapter) {
        this.adapter = this.schema.adapter;
      } else {
        this.adapter = NeDbAdapter();
      }

      this.adapter.init(this.runtime, this);
      this.log.info(`Weave Database module initialized for service "${this.name}"`);

      // Wrap up entity validation
      if (this.runtime.validator && this.schema.entitySchema && isObject(this.schema.entitySchema)) {
        const check = this.runtime.validator.compile(this.schema.entitySchema);

        // wrap entity validator function and attach to service
        this.entityValidator = (entity) => {
          const result = check(entity);

          if (result === true) {
            return Promise.resolve();
          }

          return Promise.reject(new WeaveParameterValidationError('Entity validation error!', result));
        };
      }
    },
    started () {
      // todo: validate adapter.
      if (this.adapter) {
        const self = this;
        return new Promise(resolve => {
          const connecting = () => {
            this.connect()
              .then((adapterResult) => {
                resolve(adapterResult);
              }).catch(error => {
                setTimeout(() => {
                  self.log.error('Connection error', error);
                  self.log.info('Trying to reconnect...');
                  connecting();
                }, 2000);
              });
          };
          connecting();
        });
      }

      return Promise.reject(new Error('Please set the database adapter in schema!'));
    },
    stopped () {
      return this.disconnect();
    }
  };
};
