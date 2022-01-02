const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema')

module.exports = (mixinOptions) => (actionOptions = {
  name: 'update'
}) => {
  const entityValidationSchema = getEntityValidationSchema(mixinOptions.entitySchema)
  return {
    [actionOptions.name]: {
      params: {
        id: { type: 'any' },
        entity: entityValidationSchema,
        options: { type: 'object', optional: true }
      },
      handler (context) {
        return this.update(context)
      }
    }
  }
}
