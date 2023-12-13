module.exports = () => {
  return {
    params: {
      id: { type: 'any' }
    },
    handler (context) {
      const { id } = context.data;
      return this.remove(context, id);
    }
  };
};
