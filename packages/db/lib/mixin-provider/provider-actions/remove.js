module.exports = (mixinOptions) => (actionOptions = {
  name: 'remove',
  visibility: mixinOptions.actionVisibility
}) => {
  return {
    [actionOptions.name]: {
      visibility: actionOptions.visibility,
      params: {
        id: { type: 'any' }
      },
      handler (context) {
        return this.remove(context);
      }
    }
  };
};
