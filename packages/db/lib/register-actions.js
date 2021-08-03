const serviceActions = require('./actions')

exports.createActions = (mixinOptions) => {
  const actions = Object.create(null)

  /**
   * Get count of entities by query.
   * @param {Object} query - Query object. Passes to adapter.
   * @returns {Number} List of found entities.
  */
  actions.count = serviceActions.count()
  actions.get = serviceActions.get()
  actions.findOne = serviceActions.findOne()
  actions.find = serviceActions.find()
  actions.list = serviceActions.list()
  actions.findStream = serviceActions.findStream()
  actions.insert = serviceActions.insert()
  actions.insertMany = serviceActions.insertMany()
  actions.update = serviceActions.update()
  actions.remove = serviceActions.remove()

  return actions
}
