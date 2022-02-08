const { DocumentNotFoundError } = require('../errors')

module.exports = () => {
  return {
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
}
