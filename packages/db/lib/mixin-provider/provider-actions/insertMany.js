const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema');

module.exports = (mixinOptions, serviceSchema) => (actionOptions = {
  name: 'insertMany',
  visibility: mixinOptions.actionVisibility
}) => {
  const entitySchema = mixinOptions.entitySchema || serviceSchema.entitySchema;
  const entityValidationSchema = getEntityValidationSchema(entitySchema, { isArray: true });

  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        entities: entityValidationSchema
      },
      handler (context) {
        return this.insertMany(context);
      }
    }
  };
};
