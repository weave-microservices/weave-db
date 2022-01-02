module.exports = (mixinOptions) => (actionOptions = {
  name: 'remove'
}) => {
  return {
    [actionOptions.name]: {
      params: {
        id: { type: 'any' }
      },
      handler (context) {
        return this.remove(context)
      }
    }
  }
}
