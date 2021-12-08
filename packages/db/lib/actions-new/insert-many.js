module.exports = (mixinOptions) => (actionOptions = {
  name: 'insertMany'
}) => {
  return {
    [actionOptions.name]: {
      params: {
        entities: { type: 'array', itemType: { type: 'any' }}
      },
      handler (context) {
        return this.insertMany(context)
      }
    }
  }
}
