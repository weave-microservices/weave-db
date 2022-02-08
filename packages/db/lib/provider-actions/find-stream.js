module.exports = (/* mixinOptions, schema */) => (actionOptions = {
  name: 'findStream'
}) => {
  return {
    [actionOptions.name]: {
      params: {
        query: { type: 'object' },
        filterOptions: { type: 'object', optional: true }
      },
      handler (context) {
        return this.findStream(context)
      }
    }
  }
}
