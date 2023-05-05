
/**
 * Create a action factory for 'count' action
 * @param {DBMixinOptions} mixinOptions Mixin options
 * @returns {function(any):Object} Action factory
*/
module.exports = (mixinOptions) => (actionOptions = {
  name: 'count',
  visibility: mixinOptions.actionVisibility
}) => {
  const actionDefinition = {
    visibility: actionOptions.visibility,
    params: {
      query: { type: 'any', optional: true }
    },
    handler (context) {
      return this.count(context);
    }
  };

  return {
    [actionOptions.name]: actionDefinition
  };
};
