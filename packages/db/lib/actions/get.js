const { DocumentNotFoundError } = require('../errors')

/**
 * Get entity by id.
 * @actions
 * @cached
 * @param {Object} query - Query object. Passes to adapter.
 * @returns {Number} List of found entities.
*/
module.exports = () => {
  return {
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
}
