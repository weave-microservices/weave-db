module.exports = () => {
  return {
    params: {
      entities: { type: 'array', itemType: { type: 'any' }}
    },
    handler (context) {
      const { entities } = context.data

      return Promise.all(entities.map((entity) => this.validateEntity(entity)))
        .then(res => this.adapter.insertMany(res))
        .then(data => this.entityChanged('Inserted', data, context).then(() => data))
    }
  }
}
