module.exports = () => {
  return {
    cache: {
      keys: ['lookup', 'query']
    },
    params: {
      query: { type: 'any', optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true }
    },
    handler (context) {
      // sanitize the given parameters
      const data = this.sanitizeParams(context, context.data);

      // send params to the adapter
      return this.adapter.findOne(data.query)
        .then(entity => this.transformDocuments(context, data, entity));
    }
  };
};
