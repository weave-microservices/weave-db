module.exports.initActionFactories = (mixinOptions) => ({
  count: require('./count')(mixinOptions),
  findOne: require('./find-one')(mixinOptions),
  findStream: require('./find-stream')(mixinOptions),
  find: require('./find')(mixinOptions),
  get: require('./get')(mixinOptions),
  insertMany: require('./insert-many')(mixinOptions),
  insert: require('./insert')(mixinOptions),
  list: require('./list')(mixinOptions),
  remove: require('./remove')(mixinOptions),
  update: require('./update')(mixinOptions)
})
