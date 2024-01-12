module.exports = () => {
  return {
    params: {
      query: { type: 'object' },
      options: { type: 'object', optional: true }
    },
    handler (context) {
      return this.adapter.findAsStream(context.data);
    }
  };
};
