module.exports = () => {
  return {
    params: {
      entity: { type: 'any' }
    },
    handler (context) {
      const { entity } = context.data
      return this.validateEntity(entity)
        .then(entity => this.adapter.insert(entity))
        .then(data => this.entityChanged('Inserted', data, context).then(() => data))
    }
  }
}
