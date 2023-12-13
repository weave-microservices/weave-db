module.exports = () => {
  return {
    params: {
      entities: { type: 'array', itemType: { type: 'any' }}
    },
    handler (context) {
      const { entities } = context.data;
      return this.insertMany(context, entities);
    }
  };
};
