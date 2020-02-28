/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2018 Fachwerk
 */

const { MongoClient, ObjectID } = require('mongodb')

function MongoDbAdapter (options) {
  let transformer

  options = Object.assign({
    transform: true,
    options: {
      useUnifiedTopology: true
    }
  }, options)

  function transform (entity) {
    return new Promise((resolve, reject) => {
      if (!transformer) {
        return resolve(entity)
      }
      return resolve(transformer.transform(entity))
    })
  }

  return {
    init (broker, service) {
      if (!service.schema.collectionName) {
        throw new Error('Collection name is missing!')
      }

      this.$service = service
      this.$collectionName = service.schema.collectionName
      this.$idField = service.schema.settings.idFieldName || '_id'

      this.log = broker.createLogger('MONGODB_ADAPTER')
    },
    connect () {
      return MongoClient.connect(options.url, options.options).then(client => {
        this.client = client
        this.db = this.$service.db = client.db ? client.db(options.database) : client
        this.collection = this.$service.db.collection(this.$collectionName)
        this.log.debug('Database connection etablished')

        return { dbInstance: this.db }
      })
    },
    disconnect () {
      return new Promise((resolve, reject) => {
        this.client.close((error) => {
          if (error) return reject(error)
          return resolve()
        })
      })
    },
    count (params) {
      const query = params.query || {}
      return this.collection
        .find(query)
        .count()
    },
    insert (entity) {
      return Promise.resolve(entity)
        .then(ent => transform(ent))
        .then(entity => this.collection.insertOne(entity))
    },
    findOne (query) {
      return this.collection.findOne(query)
    },
    findById (id) {
      return this.collection
        .findOne({ [this.$idField]: this.stringToObjectID(id) })
    },
    findByIds (ids) {
      return this.collection
        .find({ [this.$idField]: { $in: ids.map(id => this.stringToObjectID(id)) }})
        .toArray()
    },
    find (params) {
      return new Promise((resolve, reject) => {
        const buffer = []
        const query = params.query || {}

        if (query[this.$idField]) {
          query[this.$idField] = this.stringToObjectID(query[this.$idField])
        }

        let q = this.collection
          .find(query, params.projection)

        if (params.limit) {
          q = q.limit(Number(params.limit))
        }

        if (params.offset) {
          q = q.skip(params.offset)
        }

        if (params.sort) {
          q = q.sort(params.sort)
        }

        const stream = q.stream()

        if (params.asStream === true) {
          return stream
        } else {
          stream.on('data', (data) => {
            buffer.push(data)
          })
          stream.on('end', () => {
            return resolve(buffer)
          })
          stream.on('error', (error) => {
            return reject(error)
          })
        }
      })
    },
    updateById (id, entity) {
      return Promise.resolve(entity)
        .then(entity => transform(entity))
        .then(entity => this.collection.updateOne({ [this.$idField]: this.stringToObjectID(id) }, { $set: entity }))
    },
    removeById (id) {
      return this.collection
        .remove({ [this.$idField]: this.stringToObjectID(id) })
    },
    entityToObject (entity) {
      const data = Object.assign({}, entity)
      if (data[this.$idField]) {
        data[this.$idField] = this.objectIDToString(entity[this.$idField])
      }

      return data
    },
    objectIDToString (objectId) {
      if (objectId && objectId.toHexString) {
        return objectId.toHexString()
      }
      return objectId
    },
    stringToObjectID (value) {
      if (typeof value === 'string') {
        return new ObjectID(value)
      }
      return value
    }
  }
}

module.exports = MongoDbAdapter
