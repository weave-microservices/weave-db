module.exports = (mixinOptions) => (actionOptions = {
  name: 'list'
}) => {
  return {
    [actionOptions.name]: {
      cache: {
        keys: ['lookup', 'query', 'page', 'pageSize']
      },
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
  }
}
