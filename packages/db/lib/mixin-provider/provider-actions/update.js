const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema');

module.exports = (mixinOptions, serviceSchema) => (actionOptions = {
  name: 'update',
  visibility: mixinOptions.actionVisibility
}) => {
  const entitySchema = mixinOptions.entitySchema || serviceSchema.entitySchema;
  const entityValidationSchema = getEntityValidationSchema(entitySchema);
  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        id: { type: 'any' },
        entity: entityValidationSchema,
        options: { type: 'object', optional: true }
      },
      handler (context) {
        return this.update(context);
      }
    }
  };
};
