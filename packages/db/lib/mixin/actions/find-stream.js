module.exports = () => {
  return {
    params: {
      query: { type: 'object' },
      filterOptions: { type: 'object', optional: true }
    },
    handler (context) {
      return this.adapter.findAsStream(context.data.query, context.data.filterOptions);
    }
  };
};
