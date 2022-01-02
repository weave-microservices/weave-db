const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema')

module.exports = (mixinOptions) => (actionOptions = {
  name: 'insert',
  returnEntity: true
}) => {
  const entityValidationSchema = getEntityValidationSchema(mixinOptions.entitySchema)
  return {
    [actionOptions.name]: {
      params: {
        entity: entityValidationSchema
      },
      handler (context) {
        return this.insert(context, actionOptions.returnEntity)
      }
    }
  }
}
