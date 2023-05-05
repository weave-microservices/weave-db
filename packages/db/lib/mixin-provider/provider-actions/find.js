module.exports = (mixinOptions) => (actionOptions = {
  name: 'find',
  cache: {
    keys: ['lookup', 'query']
  },
  visibility: mixinOptions.actionVisibility
}) => {
  const actionDefinition = {
    visibility: actionOptions.visibility,
    params: {
      query: { type: 'any', optional: true },
      sort: { type: 'any', optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true },
      limit: { type: 'number', optional: true, convert: true },
      offset: { type: 'number', optional: true, convert: true }
    },
    handler (context) {
      return this.find(context);
    }
  };

  // Cache settings
  if (mixinOptions.cache.enabled) {
    actionDefinition.cache = {
      keys: actionOptions.cache.keys
    };
  }

  return {
    [actionOptions.name]: actionDefinition
  };
};
