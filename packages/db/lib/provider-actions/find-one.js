module.exports = (mixinOptions) => (actionOptions = {
  name: 'findOne',
  cache: {
    keys: ['lookup', 'query']
  }
}) => {
  const actionDefinition = {
    params: {
      query: { type: 'any', optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true }
    },
    handler (context) {
      return this.findOne(context)
    }
  }

  // Cache settings
  if (mixinOptions.cache.enabled) {
    actionDefinition.cache = {
      keys: actionOptions.cache.keys
    }
  }

  return {
    [actionOptions.name]: actionDefinition
  }
}
