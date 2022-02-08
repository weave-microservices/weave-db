const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema')

module.exports = (mixinOptions) => (actionOptions = {
  name: 'insertMany',
  visibility: mixinOptions.actionVisibility
}) => {
  const entityValidationSchema = getEntityValidationSchema(mixinOptions.entitySchema, true)

  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        entities: entityValidationSchema
      },
      handler (context) {
        return this.insertMany(context)
      }
    }
  }
}
