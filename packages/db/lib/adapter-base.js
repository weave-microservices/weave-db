
module.exports = () => {
  return {
    init (broker, service) {
      return Promise.resolve(this)
    },
    connect () {
      return Promise.resolve(this)
    },
    disconnect () {
      return Promise.resolve(this)
    },
    count (filterParams) {
      throw new Error('Method not implemented.')
    },
    insert (entity) {
      throw new Error('Method not implemented.')
    },
    insertMany (entities) {
      throw new Error('Method not implemented.')
    },
    findById (id) {
      throw new Error('Method not implemented.')
    },
    findByIds (ids) {
      throw new Error('Method not implemented.')
    },
    find (params) {
      throw new Error('Method not implemented.')
    },
    findOne (query) {
      throw new Error('Method not implemented.')
    },
    updateById (id, entity) {
      throw new Error('Method not implemented.')
    },
    removeById (id) {
      throw new Error('Method not implemented.')
    },
    clear () {
      throw new Error('Method not implemented.')
    },
    entityToObject (doc) {
      throw new Error('Method not implemented.')
    },
    findAsStream (/* query, options */) {
      throw new Error('Method not implemented.')
    }
  }
}
