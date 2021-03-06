/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2019 Fachwerk
 */

// npm packages
const { promisify, isFunction, isObject, dotGet, dotSet, flattenDeep } = require('@weave-js/utils')

// own modules
const NeDbAdapter = require('./nedb-adapter')
const { WeaveParameterValidationError } = require('@weave-js/core/lib/errors')
const { DocumentNotFoundError } = require('./errors')

module.exports = () => {
  return {
    settings: {
      idFieldName: '_id',
      pageSize: 10,
      maxPageSize: 1000,
      lookups: null,
      fields: null
    },
    actions: {
      /**
       * Get count of entities by query.
       * @param {Object} query - Query object. Passes to adapter.
       * @returns {Number} List of found entities.
      */
      count: {
        params: {
          query: { type: 'any', optional: true }
        },
        handler (context) {
          const data = this.sanitizeParams(context, context.data)

          if (data.limit) {
            data.limit = null
          }

          if (data.offset) {
            data.offset = null
          }

          return this.adapter.count(data)
        }
      },
      /**
       * Get entity by id.
       * @actions
       * @cached
       * @param {Object} query - Query object. Passes to adapter.
       * @returns {Number} List of found entities.
      */
      get: {
        cache: {
          keys: ['id', 'fields', 'lookup']
        },
        params: {
          id: { type: 'any' },
          fields: { type: 'array', itemType: { type: 'string' }, optional: true },
          lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
          mapIds: { type: 'boolean', optional: true }
        },
        handler (context) {
          const data = this.sanitizeParams(context, context.data)

          return this.getById(data.id)
            .then(entities => {
              if (!entities) {
                return Promise.reject(new DocumentNotFoundError(data.id))
              }

              return this.transformDocuments(context, data, entities)
            })
            .then(entities => {
              if (Array.isArray(entities) && data.mapIds) {
                const result = {}

                entities.forEach(entity => {
                  result[entity[this.settings.idFieldName]] = entity
                })

                return result
              }

              return entities
            })
        }
      },
      find: {
        cache: {
          keys: ['lookup', 'query']
        },
        params: {
          query: { type: 'any', optional: true },
          sort: { type: 'any', optional: true },
          lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
          fields: { type: 'array', itemType: { type: 'string' }, optional: true },
          limit: { type: 'number', optional: true, convert: true },
          offset: { type: 'number', optional: true, convert: true }
        },
        handler (context) {
          const data = this.sanitizeParams(context, context.data)

          return this.adapter.find(data)
            .then(entities => this.transformDocuments(context, data, entities))
        }
      },
      findOne: {
        cache: {
          keys: ['lookup', 'query']
        },
        params: {
          query: { type: 'any', optional: true },
          lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
          fields: { type: 'array', itemType: { type: 'string' }, optional: true }
        },
        handler (context) {
          // sanitize the given parameters
          const data = this.sanitizeParams(context, context.data)

          // send params to the adapter
          return this.adapter.findOne(data.query)
            .then(entity => this.transformDocuments(context, data, entity))
        }
      },
      /**
       * List entities by query and paginate results.
       *
       * @actions
       * @cached
       *
       * @param {Array<String>?} lookup - Lookup fields from other services.
       * @param {Array<String>?} fields - Fields filter.
       * @param {Number} limit - Max count of rows.
       * @param {Number} offset - Count of skipped rows.
       * @param {String} sort - Sorted fields.
       * @param {String} search - Search text.
       * @param {String} searchFields - Fields for searching.
       * @param {Object} query - Query object. Passes to adapter.
       * @returns {Object} List of found entities.
      */
      list: {
        cache: {
          keys: ['lookup', 'query', 'page', 'pageSize']
        },
        params: {
          query: { type: 'any', optional: true },
          sort: { type: 'any', optional: true },
          lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
          fields: { type: 'array', itemType: { type: 'string' }, optional: true },
          page: { type: 'number', optional: true, convert: true },
          pageSize: { type: 'number', optional: true, convert: true }
        },
        handler (context) {
          const data = this.sanitizeParams(context, context.data)
          const countParams = Object.assign({}, data)

          // Remove params for count action
          if (countParams.limit) {
            countParams.limit = null
          }

          if (countParams.offset) {
            countParams.offset = null
          }

          return Promise.all([this.adapter.find(data), this.adapter.count(countParams)])
            .then(results => this.transformDocuments(context, data, results[0])
              .then(entity => {
                return {
                  rows: entity,
                  totalRows: results[1],
                  page: data.page,
                  pageSize: data.pageSize,
                  totalPages: Math.floor((results[1] + data.pageSize - 1) / data.pageSize)
                }
              }))
        }
      },
      findStream: {
        params: {
          query: { type: 'object' },
          filterOptions: { type: 'object', optional: true }
        },
        handler (context) {
          return this.adapter.findAsStream(context.data.query, context.data.filterOptions)
        }
      },
      insert: {
        params: {
          entity: { type: 'any' }
        },
        handler (context) {
          const { entity } = context.data
          return this.validateEntity(entity)
            .then(entity => this.adapter.insert(entity))
            .then(data => this.entityChanged('Inserted', data, context).then(() => data))
        }
      },
      insertMany: {
        params: {
          entities: { type: 'array', itemType: { type: 'any' }}
        },
        handler (context) {
          const { entities } = context.data

          return Promise.all(entities.map((entity) => this.validateEntity(entity)))
            .then(res => this.adapter.insertMany(res))
            .then(data => this.entityChanged('Inserted', data, context).then(() => data))
        }
      },
      update: {
        params: {
          id: { type: 'any' },
          entity: { type: 'any' },
          options: { type: 'object', optional: true }
        },
        handler (context) {
          const { id, entity } = context.data
          return this.adapter.updateById(id, entity)
            .then(entity => {
              if (!entity) {
                return Promise.reject(new DocumentNotFoundError(id))
              }

              return this.transformDocuments(context, context.data, entity)
            })
            .then(data => this.entityChanged('Updated', data, context).then(() => data))
        }
      },
      remove: {
        params: {
          id: { type: 'any' }
        },
        handler (context) {
          const { id } = context.data
          return this.adapter.removeById(id)
            .then(entity => {
              if (!entity) {
                return Promise.reject(new DocumentNotFoundError(id))
              }

              return this.transformDocuments(context, context.data, entity)
                .then(data => this.entityChanged('Removed', data, context).then(() => data))
            })
        }
      }
    },
    methods: {
      connect () {
        const self = this
        return this.adapter.connect().then((adapterResult) => {
          try {
            if (isFunction(self.schema.afterConnect)) {
              self.schema.afterConnect.call(this, adapterResult)
            }
          } catch (error) {
            this.log.error('afterConnect error: ', error)
          }
        })
      },
      disconnect () {
        return this.adapter.disconnect()
      },
      sanitizeParams (context, data) {
        const sanitizedData = Object.assign({}, data)

        if (typeof sanitizedData.limit === 'string') {
          sanitizedData.limit = Number(sanitizedData.limit)
        }

        if (typeof sanitizedData.offset === 'string') {
          sanitizedData.offset = Number(sanitizedData.offset)
        }

        if (typeof sanitizedData.page === 'string') {
          sanitizedData.page = Number(sanitizedData.page)
        }

        if (typeof sanitizedData.pageSize === 'string') {
          sanitizedData.pageSize = Number(sanitizedData.pageSize)
        }

        if (typeof sanitizedData.lookup === 'string') {
          sanitizedData.lookup = sanitizedData.lookup.split(' ')
        }

        // If we use ID mapping and want only specific fields, we need to add the id field to the fieldlist.
        if (sanitizedData.mapIds === true) {
          if (Array.isArray(sanitizedData.fields) > 0 && !sanitizedData.fields.includes(this.settings.idFieldName)) {
            sanitizedData.fields.push(this.settings.idFieldName)
          }
        }

        if (context.action.name.endsWith('.list')) {
          if (!sanitizedData.page) {
            sanitizedData.page = 1
          }

          if (!sanitizedData.pageSize) {
            sanitizedData.pageSize = this.settings.pageSize
          }

          sanitizedData.limit = sanitizedData.pageSize
          sanitizedData.offset = (sanitizedData.page - 1) * sanitizedData.pageSize
        }

        return sanitizedData
      },
      getById (id) { // by ids
        return Promise.resolve(id)
          .then(id => {
            if (Array.isArray(id)) {
              return this.adapter.findByIds(id)
            }

            return this.adapter.findById(id)
          })
      },
      transformDocuments (context, data, entities) {
        let isEntity = false

        // if "docs" is a single object - wrap it in an array
        if (!Array.isArray(entities)) {
          if (isObject(entities)) {
            isEntity = true
            entities = [entities]
          } else {
            return Promise.resolve(entities)
          }
        }

        return Promise.resolve(entities)
          .then(entities => entities.map(entity => this.adapter.entityToObject(entity)))
          .then(json => data.lookup ? this.lookupDocs(context, json, data.lookup) : json)
          .then(json => this.filterFields(json, data.fields ? data.fields : this.settings.fields))
          .then(json => isEntity ? json[0] : json)
      },
      lookupDocs (context, entities, lookupFields) {
        if (!this.settings.lookups || !Array.isArray(lookupFields) || lookupFields.length === 0) {
          return Promise.resolve(entities)
        }

        if (entities === null || !isObject(entities) || !Array.isArray(entities)) {
          return Promise.resolve(entities)
        }

        const promises = []

        Object.keys(this.settings.lookups).forEach(key => {
          let rule = this.settings.lookups[key]

          if (lookupFields.indexOf(key) === -1) {
            return
          }

          if (isFunction(rule)) {
            rule = {
              handler: promisify(rule)
            }
          }

          if (typeof rule === 'string') {
            rule = {
              action: rule
            }
          }

          const arr = Array.isArray(entities) ? entities : [entities]
          const idList = flattenDeep(arr.map(entity => dotGet(entity, key)))

          const transformResponse = lookedUpDocs => {
            arr.forEach(entity => {
              const id = dotGet(entity, key)

              if (Array.isArray(id)) {
                dotSet(entity, key, id.map(id => lookedUpDocs[id]).filter(Boolean))
              } else {
                const value = lookedUpDocs === null ? null : lookedUpDocs[id]
                dotSet(entity, key, value)
              }
            })
          }

          if (rule.handler) {
            let ruleResult = rule.handler.call(this, context, arr, idList, rule)

            if (isFunction(rule.transformation)) {
              ruleResult = ruleResult.then(rule.transformation)
            }

            promises.push(ruleResult)
          } else {
            const data = Object.assign({
              id: idList,
              mapIds: true
            }, rule.data || {})

            promises.push(context.call(rule.action, data).then(transformResponse))
          }
        })

        return Promise.all(promises)
          .then(() => {
            return entities
          })
      },
      filterFields (entities, fields) {
        return Promise.resolve(entities)
          .then((entities) => {
            if (Array.isArray(fields)) {
              if (Array.isArray(entities)) {
                return entities.map((entity) => {
                  const result = {}

                  fields.forEach(field => (dotSet(result, field, dotGet(entity, field))))

                  if (Object.keys(result).length > 0) {
                    return result
                  }
                })
              } else {
                const result = {}

                fields.forEach(field => (dotSet(result, field, dotGet(entities, field))))

                if (Object.keys(result).length > 0) {
                  return result
                }
              }
            }

            return entities
          })
      },
      entityChanged (type, data, context) {
        this.log.debug('Entity changed')

        return this.clearCache().then(() => {
          const hookName = `entity${type}`
          if (isFunction(this.schema[hookName])) {
            this.schema[hookName].call(this, data, context)
          }
          return Promise.resolve()
        })
      },
      clearCache () {
        this.log.debug(`Clear cache for service: ${this.name}`)
        this.broker.broadcast(`$cache.clear.${this.name}`)

        if (this.broker.cache) {
          return this.broker.cache.clear(`${this.name}.*`)
        }

        return Promise.resolve()
      },
      validateEntity (entity) {
        if (!isFunction(this.entityValidator)) {
          return Promise.resolve(entity)
        }

        const entities = Array.isArray(entity) ? entity : [entity]

        return Promise.all(entities.map(e => this.entityValidator(e))).then(() => entity)
      }
    },
    created () {
      if (this.schema.adapter) {
        this.adapter = this.schema.adapter
      } else {
        this.adapter = NeDbAdapter()
      }

      this.adapter.init(this.broker, this)
      this.log.debug(`Weave Database module initialized for service "${this.name}"`)

      // Wrap up entity validation
      if (this.broker.validator && this.schema.entitySchema && isObject(this.schema.entitySchema)) {
        const check = this.broker.validator.compile(this.schema.entitySchema)

        // wrap entity validator function and attach to service
        this.entityValidator = (entity) => {
          const result = check(entity)

          if (result === true) {
            return Promise.resolve()
          }

          return Promise.reject(new WeaveParameterValidationError('Entity validation error!', result))
        }
      }
    },
    started () {
      // todo: validate adapter.
      if (this.adapter) {
        const self = this
        return new Promise(resolve => {
          const connecting = () => {
            this.connect()
              .then((adapterResult) => {
                resolve(adapterResult)
              }).catch(error => {
                setTimeout(() => {
                  self.log.info('Connection error', error)
                  self.log.info('Trying to reconnect...')
                  connecting()
                }, 2000)
              })
          }
          connecting()
        })
      }

      return Promise.reject(new Error('Please set the database adapter in schema!'))
    },
    stopped () {
      return this.disconnect()
    }
  }
}
