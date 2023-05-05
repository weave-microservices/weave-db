module.exports = (mixinOptions) => (actionOptions = {
  name: 'findStream',
  visibility: mixinOptions.actionVisibility
}) => {
  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        query: { type: 'object' },
        filterOptions: { type: 'object', optional: true }
      },
      handler (context) {
        return this.findStream(context);
      }
    }
  };
};
