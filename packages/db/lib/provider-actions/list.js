module.exports = (mixinOptions) => (actionOptions = {
  name: 'list',
  cache: {
    keys: ['lookup', 'query', 'page', 'pageSize']
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
      page: { type: 'number', optional: true, convert: true },
      pageSize: { type: 'number', optional: true, convert: true }
    },
    handler (context) {
      return this.list(context)
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
