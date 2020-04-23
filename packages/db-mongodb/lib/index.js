/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2020 Fachwerk
 */

const { MongoClient, ObjectID } = require('mongodb')

function MongoDbAdapter (options) {
  options = Object.assign({
    transform: true,
    options: {
      useUnifiedTopology: true
    }
  }, options)

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
      return this.collection.insertOne(entity)
        .then(result => result.insertedCount > 0 ? result.ops[0] : null)
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
        .find({
          [this.$idField]: {
            $in: ids.map(id => this.stringToObjectID(id))
          }
        })
        .toArray()
    },
    find (params) {
      return new Promise((resolve, reject) => {
        const buffer = []
        const query = params.query || {}

        if (query[this.$idField]) {
          query[this.$idField] = this.stringToObjectID(query[this.$idField])
        }

        let cursor = this.collection.find(query, params.projection)

        if (params.limit) {
          cursor = cursor.limit(Number(params.limit))
        }

        if (params.offset) {
          cursor = cursor.skip(params.offset)
        }

        if (params.sort) {
          cursor = cursor.sort(params.sort)
        }

        const stream = cursor.stream()

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
      return this.collection
        .findOneAndUpdate(
          { [this.$idField]: this.stringToObjectID(id) },
          entity,
          { returnOriginal: false }
        )
        .then(result => result.value)
    },
    removeById (id) {
      return this.collection
        .findOneAndDelete({ [this.$idField]: this.stringToObjectID(id) })
        .then(result => result.value)
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
