const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema')

module.exports = (mixinOptions) => (actionOptions = {
  name: 'insertMany'
}) => {
  const entityValidationSchema = getEntityValidationSchema(mixinOptions.entitySchema, { isArray: true })

  return {
    [actionOptions.name]: {
      params: {
        entities: entityValidationSchema
      },
      handler (context) {
        return this.insertMany(context)
      }
    }
  }
}
