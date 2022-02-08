const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema')

module.exports = (mixinOptions) => (actionOptions = {
  name: 'update',
  visibility: mixinOptions.actionVisibility
}) => {
  const entityValidationSchema = getEntityValidationSchema(mixinOptions.entitySchema)
  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
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
