module.exports = (mixinOptions) => (actionOptions = {
  name: 'list',
  cache: {
    keys: [
      'query',
      'sort',
      'lookup',
      'fields',
      'page',
      'pageSize'
    ]
  },
  pageSize: 10,
  maxPageSize: 1000,
  visibility: mixinOptions.actionVisibility
}) => {
  const actionDefinition = {
    visibility: actionOptions.visibility,
    params: {
      query: { type: 'any', optional: true },
      sort: { type: 'any', optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true },
      page: { type: 'number', optional: true, convert: true, min: 1, integer: true },
      pageSize: { type: 'number', optional: true, convert: true, integer: true }
    },
    handler (context) {
      return this.list(context, actionOptions);
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