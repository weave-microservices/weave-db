const { isFunction, isObject, dotSet, dotGet, flattenDeep, promisify } = require('@weave-js/utils')
const { EntityNotFoundError } = require('./errors')

module.exports.createDbMethods = (mixinOptions) => {
  return {
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

      // If we use Id mapping and want only specific fields, we need to add the id field to the fieldlist.
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
    count (context) {
      const data = this.sanitizeParams(context, context.data)

      if (data.limit) {
        data.limit = null
      }

      if (data.offset) {
        data.offset = null
      }

      return this.adapter.count(data)
    },
    async findOne (context) {
      // sanitize the given parameters
      const data = this.sanitizeParams(context, context.data)

      // send params to the adapter
      const entity = await this.adapter.findOne(data.query)
      return this.transformDocuments(context, data, entity)
    },
    findStream (context) {
      return this.adapter.findAsStream(context.data.query, context.data.filterOptions)
    },
    async find (context) {
      const data = this.sanitizeParams(context, context.data)
      const entities = await this.adapter.find(data)
      return this.transformDocuments(context, data, entities)
    },
    async get (context) {
      const data = this.sanitizeParams(context, context.data)

      let result = await this.getById(data.id)

      if (!result) {
        throw new EntityNotFoundError(data.id)
      }

      result = await this.transformDocuments(context, data, result)

      // map the results by ID into a result object
      if (Array.isArray(result) && data.mapIds) {
        const results = {}

        result.forEach(entity => {
          results[entity[this.settings.idFieldName]] = entity
        })

        return results
      }

      return result
    },
    async insert (context) {
      // const { entity } = context.data
      // return this.validateEntity(entity)
      //   .then(entity => this.adapter.insert(entity))
      //   .then(data => this.entityChanged('Inserted', data, context).then(() => data))
      const entity = await this.validateEntity(context.data.entity)
      const insertResult = await this.adapter.insert(entity)
      await this.entityChanged('Inserted', insertResult, context)
      return insertResult
    },
    async insertMany (context) {
      const entities = await Promise.all(context.data.entities.map((entity) => this.validateEntity(entity)))
      const insertResult = await this.adapter.insertMany(entities)
      await this.entityChanged('Inserted', insertResult, context)
      return insertResult
    },
    async list (context) {
      const data = this.sanitizeParams(context, context.data)
      const countParams = Object.assign({}, data)

      // Remove params for count action
      if (countParams.limit) {
        countParams.limit = null
      }

      if (countParams.offset) {
        countParams.offset = null
      }

      const [results, count] = await Promise.all([this.adapter.find(data), this.adapter.count(countParams)])
      const entity = await this.transformDocuments(context, data, results)

      return {
        rows: entity,
        totalRows: count,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: Math.floor((count + data.pageSize - 1) / data.pageSize)
      }
    },
    getById (id) { // by ids
      return Promise.resolve(id)
        .then(id => {
          // Handle ID
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

        const transformResponse = (lookedUpDocs) => {
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
          }, rule.params || {})

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
      this.log.verbose('Entity changed')

      return this.clearCache().then(() => {
        const hookName = `entity${type}`
        if (isFunction(this.schema[hookName])) {
          this.schema[hookName].call(this, data, context)
        }
        return Promise.resolve()
      })
    },
    clearCache () {
      this.log.verbose(`Clear cache for service: ${this.name}`)
      this.runtime.eventBus.broadcast(`$cache.clear.${this.name}`)

      if (this.runtime.cache) {
        return this.runtime.cache.clear(`${this.name}.*`)
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
  }
}
