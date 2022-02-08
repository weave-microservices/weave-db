const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema')

module.exports = (mixinOptions) => (actionOptions = {
  name: 'insert',
  returnEntity: true,
  visibility: mixinOptions.actionVisibility
}) => {
  const entityValidationSchema = getEntityValidationSchema(mixinOptions.entitySchema)
  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        entity: entityValidationSchema
      },
      handler (context) {
        return this.insert(context, actionOptions.returnEntity)
      }
    }
  }
}
