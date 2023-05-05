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
      keys: ['lookup', 'query', 'page', 'pageSize']
    },
    params: {
      query: { type: 'any', optional: true },
      sort: { type: 'any', optional: true },
      lookup: { type: 'array', itemType: { type: 'string' }, optional: true },
      fields: { type: 'array', itemType: { type: 'string' }, optional: true },
      page: { type: 'number', optional: true, convert: true },
      pageSize: { type: 'number', optional: true, convert: true }
    },
    handler (context) {
      const data = this.sanitizeParams(context, context.data);
      const countParams = Object.assign({}, data);

      // Remove params for count action
      if (countParams.limit) {
        countParams.limit = null;
      }

      if (countParams.offset) {
        countParams.offset = null;
      }

      return Promise.all([this.adapter.find(data), this.adapter.count(countParams)])
        .then(results => this.transformDocuments(context, data, results[0])
          .then(entity => {
            return {
              rows: entity,
              totalRows: results[1],
              page: data.page,
              pageSize: data.pageSize,
              totalPages: Math.floor((results[1] + data.pageSize - 1) / data.pageSize)
            };
          }));
    }
  };
};
