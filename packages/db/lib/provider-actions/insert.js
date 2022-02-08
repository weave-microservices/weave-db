const { getEntityValidationSchema } = require('../utils/getEntityValidationSchema')

/**
 * @typedef {object} DBInsertActionOptions Db Insert action options
 * @property {string} [name=insert] Action name
 * @property {boolean} [returnEntity=true] Action name
 * @property {object} validatorOptions Validator options
 */

/**
 * Generates insert action factory function
 * @param {import('../db-mixin-provider').DBMixinOptions} mixinOptions Mixin options
 * @returns {function(DBInsertActionOptions)} "Insert" action factory
*/
module.exports = (mixinOptions) => (actionOptions = {
  name: 'insert',
  returnEntity: true,
  validatorOptions: mixinOptions.validatorOptions
}) => {
  const entityValidationSchema = getEntityValidationSchema(mixinOptions.entitySchema, { action: 'insert' })
  return {
    [actionOptions.name]: {
      params: {
        entity: entityValidationSchema
      },
      validatorOptions: actionOptions.validatorOptions,
      handler (context) {
        return this.insert(context, actionOptions.returnEntity)
      }
    }
  }
}
