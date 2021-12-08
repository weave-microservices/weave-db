const { EntityNotFoundError } = require('../errors')

module.exports = (mixinOptions) => (actionOptions = {
  name: 'remove'
}) => {
  return {
    [actionOptions.name]: {
      params: {
        id: { type: 'any' }
      },
      handler (context) {
        const { id } = context.data
        return this.adapter.removeById(id)
          .then(entity => {
            if (!entity) {
              return Promise.reject(new EntityNotFoundError(id))
            }

            return this.transformDocuments(context, context.data, entity)
              .then(data => this.entityChanged('Removed', data, context).then(() => data))
          })
      }
    }
  }
}
