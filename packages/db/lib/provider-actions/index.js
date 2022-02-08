module.exports.initActionFactories = (mixinOptions, schema) => ({
  count: require('./count')(mixinOptions, schema),
  findOne: require('./find-one')(mixinOptions, schema),
  findStream: require('./find-stream')(mixinOptions, schema),
  find: require('./find')(mixinOptions, schema),
  get: require('./get')(mixinOptions, schema),
  insertMany: require('./insert-many')(mixinOptions, schema),
  insert: require('./insert')(mixinOptions, schema),
  list: require('./list')(mixinOptions, schema),
  remove: require('./remove')(mixinOptions, schema),
  update: require('./update')(mixinOptions, schema)
})
