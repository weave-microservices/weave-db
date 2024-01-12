module.exports = () => {
  return {
    params: {
      query: { type: 'any', optional: true },
      options: { type: 'object', optional: true }
    },
    cache: {
      keys: ['query']
    },
    handler (context) {
      return this.count(context);
    }
  };
};
