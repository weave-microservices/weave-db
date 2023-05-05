module.exports.initActionFactories = (mixinOptions, schema) => ({
  count: require('./count')(mixinOptions),
  findOne: require('./findOne')(mixinOptions),
  findStream: require('./findStream')(mixinOptions),
  find: require('./find')(mixinOptions),
  get: require('./get')(mixinOptions),
  insertMany: require('./insertMany')(mixinOptions, schema),
  insert: require('./insert')(mixinOptions, schema),
  list: require('./list')(mixinOptions),
  remove: require('./remove')(mixinOptions),
  update: require('./update')(mixinOptions, schema)
});
