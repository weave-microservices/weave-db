module.exports = (mixinOptions) => (actionOptions = {
  name: 'get',
  cache: {
    keys: ['id', 'fields', 'lookup']
  },
  visibility: mixinOptions.actionVisibility
}) => {
  const actionDefinition = {
    visibility: actionOptions.visibility,
    params: {
      id: { type: 'any' },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      mapIds: { type: 'boolean', optional: true }
    },
    handler (context) {
      return this.get(context);
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
