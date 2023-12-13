
/**
 * Get entity by id.
 * @actions
 * @cached
 * @param {Object} query - Query object. Passes to adapter.
 * @returns {any} List of found entities.
*/
module.exports = () => {
  return {
    cache: {
      keys: ['id', 'fields', 'lookup']
    },
    params: {
      id: { type: 'any' },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      mapIds: { type: 'boolean', optional: true }
    },
    handler (context) {
      const data = this.sanitizeParams(context, context.data);
      return this.get(context, data);
    }
  };
};
