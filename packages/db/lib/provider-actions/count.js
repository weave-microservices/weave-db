module.exports = (/* mixinOptions, schema */) => (actionOptions = {
  name: 'count'
}) => {
  return {
    [actionOptions.name]: {
      params: {
        query: { type: 'any', optional: true }
      },
      handler (context) {
        return this.count(context)
      }
    }
  }
}
