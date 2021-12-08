module.exports = (mixinOptions) => (actionOptions = {
  name: 'findOne'
}) => {
  return {
    [actionOptions.name]: {
      cache: {
        keys: ['lookup', 'query']
      },
      params: {
        query: { type: 'any', optional: true },
        lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
        fields: { type: 'array', itemType: { type: 'string' }, optional: true }
      },
      handler (context) {
        return this.findOne(context)
      }
    }
  }
}
