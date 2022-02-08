/**
 * Create a action factory for 'count' action
 * @param {import("../db-mixin-provider").DBMixinOptions} mixinOptions Mixin options
 * @returns {function(any):Object} Action factory
*/
module.exports = (mixinOptions) => (actionOptions = {
  name: 'count',
  visibility: mixinOptions.actionVisibility
}) => {
  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        query: { type: 'any', optional: true }
      },
      handler (context) {
        return this.count(context)
      }
    }
  }
}
