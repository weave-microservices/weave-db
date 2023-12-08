module.exports = () => {
  return {
    params: {
      query: { type: 'any', optional: true }
    },
    handler (context) {
      const data = this.sanitizeParams(context, context.data);

      if (data.limit) {
        data.limit = null;
      }

      if (data.offset) {
        data.offset = null;
      }

      return this.adapter.count(data);
    }
  };
};
