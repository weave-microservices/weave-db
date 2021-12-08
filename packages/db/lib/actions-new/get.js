module.exports = (mixinOptions) => (actionOptions = {
  name: 'get'
}) => {
  return {
    [actionOptions.name]: {
      cache: {
        keys: ['id', 'fields', 'lookup']
      },
      params: {
        id: { type: 'any' },
        fields: { type: 'array', itemType: { type: 'string' }, optional: true },
        lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
        mapIds: { type: 'boolean', optional: true }
      },
      handler (context) {
        return this.get(context)
      }
    }
  }
}
