const { DocumentNotFoundError } = require('./errors')

exports.createActions = (mixinOptions) => {
  const actions = Object.create(null)

  /**
   * Get count of entities by query.
   * @param {Object} query - Query object. Passes to adapter.
   * @returns {Number} List of found entities.
  */
  actions.count = {
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
  }

  /**
   * Get entity by id.
   * @actions
   * @cached
   * @param {Object} query - Query object. Passes to adapter.
   * @returns {Number} List of found entities.
  */
  actions.get = {
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
  }

  actions.findOne = {
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
  }

  actions.find = {
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
  }

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
  actions.list = {
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
  }

  actions.findStream = {
    params: {
      query: { type: 'object' },
      filterOptions: { type: 'object', optional: true }
    },
    handler (context) {
      return this.adapter.findAsStream(context.data.query, context.data.filterOptions)
    }
  }

  actions.insert = {
    params: {
      entity: { type: 'any' }
    },
    handler (context) {
      const { entity } = context.data
      return this.validateEntity(entity)
        .then(entity => this.adapter.insert(entity))
        .then(data => this.entityChanged('Inserted', data, context).then(() => data))
    }
  }

  actions.insertMany = {
    params: {
      entities: { type: 'array', itemType: { type: 'any' }}
    },
    handler (context) {
      const { entities } = context.data

      return Promise.all(entities.map((entity) => this.validateEntity(entity)))
        .then(res => this.adapter.insertMany(res))
        .then(data => this.entityChanged('Inserted', data, context).then(() => data))
    }
  }

  actions.update = {
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
  }

  actions.remove = {
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

  return actions
}