module.exports = (mixinOptions) => (actionOptions = {
  name: 'insert'
}) => {
  return {
    [actionOptions.name]: {
      params: {
        entity: { type: 'any' }
      },
      handler (context) {
        return this.insert(context)
      }
    }
  }
}
