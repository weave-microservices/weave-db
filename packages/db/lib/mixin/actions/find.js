module.exports = () => {
  return {
    cache: {
      keys: ['lookup', 'query', 'fields', 'limit', 'offset', 'sort']
    },
    params: {
      query: { type: 'any', optional: true },
      sort: { type: 'any', optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true },
      limit: { type: 'number', optional: true, convert: true },
      offset: { type: 'number', optional: true, convert: true }
    },
    handler (context) {
      const data = this.sanitizeParams(context, context.data);
      return this.find(context, data);
    }
  };
};
