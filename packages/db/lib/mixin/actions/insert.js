module.exports = () => {
  return {
    params: {
      entity: { type: 'any' }
    },
    handler (context) {
      const { entity } = context.data;
      return this.insert(context, entity);
    }
  };
};
