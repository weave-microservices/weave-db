const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema');

/**
 * @typedef {object} DBActionOptions Db Insert action options
 * @property {'public'|'private'|'protected'=} [visibility] Action visibility
 */

/**
 * @typedef {object} DBInsertActionOptions Db Insert action options
 * @property {string} [name=insert] Action name
 * @property {boolean} [returnEntity=true] Action name
 * @property {object} validatorOptions Validator options
 */

/**
 * Generates insert action factory function
 * @param {import('../createDbMixinProvider').DBMixinOptions} mixinOptions Mixin options
 * @returns {function(DBInsertActionOptions & DBActionOptions):object} "Insert" action factory
*/
module.exports = (mixinOptions, serviceSchema) => (actionOptions = {
  name: 'insert',
  returnEntity: true,
  validatorOptions: mixinOptions.validatorOptions,
  visibility: mixinOptions.actionVisibility
}) => {
  const entitySchema = mixinOptions.entitySchema || serviceSchema.entitySchema;
  const entityValidationSchema = getEntityValidationSchema(entitySchema, { action: 'insert' });
  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        entity: entityValidationSchema
      },
      validatorOptions: actionOptions.validatorOptions,
      handler (context) {
        return this.insert(context, actionOptions.returnEntity);
      }
    }
  };
};
