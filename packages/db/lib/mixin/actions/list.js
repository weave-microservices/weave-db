/**
 * List entities by query and paginate results.
 *
 * @actions
 * @cached
 *
 * @param {Array<String>?} lookup - Lookup fields from other services.
 * @param {Array<String>?} fields - Fields filter.
 * @param {Number} limit - Max count of rows.
 * @param {Number} offset - Count of skipped rows.
 * @param {String} sort - Sorted fields.
 * @param {String} search - Search text.
 * @param {String} searchFields - Fields for searching.
 * @param {Object} query - Query object. Passes to adapter.
 * @returns {Object} List of found entities.
*/
module.exports = () => {
  return {
    cache: {
      keys: ['lookup', 'query', 'page', 'pageSize', 'fields', 'sort']
    },
    params: {
      query: { type: 'any', optional: true },
      sort: { type: 'any', optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true },
      page: { type: 'number', optional: true, convert: true },
      pageSize: { type: 'number', optional: true, convert: true },
      options: { type: 'object', optional: true }
    },
    handler (context) {
      const data = this.sanitizeParams(context, context.data);
      return this.list(context, data);
    }
  };
};
