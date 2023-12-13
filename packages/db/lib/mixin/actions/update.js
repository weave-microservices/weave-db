module.exports = () => {
  return {
    params: {
      id: { type: 'any' },
      entity: { type: 'any' },
      options: { type: 'object', optional: true }
    },
    handler (context) {
      const { id, entity, options } = context.data;
      return this.update(context, id, entity, options);
    }
  };
};
