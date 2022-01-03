/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2020 Fachwerk
 */

const { AdapterBase } = require('@weave-js/db')
const { MongoClient, ObjectId } = require('mongodb')

module.exports = (options) => {
  options = Object.assign({
    transform: true,
    options: {
      useUnifiedTopology: true
    },
    collectionName: undefined
  }, options)

  return Object.assign(AdapterBase(), {
    init (broker, service) {
      if (options.collectionName || !service.schema.collectionName) {
        throw new Error('Collection name is missing!')
      }

      this.$service = service
      this.$collectionName = options.collectionName || service.schema.collectionName
      this.$idField = service.schema.settings.idFieldName || '_id'
      this.log = broker.createLogger('MONGODB ADAPTER')
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
      if (query[this.$idField]) {
        query[this.$idField] = this.stringToObjectId(query[this.$idField])
      }
      return this.collection
        .find(query)
        .count()
    },
    async insert (entity) {
      const result = await this.collection.insertOne(entity)
      if (!result.acknowledged) {
        throw new Error('MongoDb insert failed.')
      }

      const copy = Object.assign({}, entity)
      copy[this.$idField] = this.objectIdToString(result.insertedId)
      return copy
    },
    async insertMany (entities, returnEntities = true) {
      const result = await this.collection.insertMany(entities)
      if (!result.acknowledged) {
        throw new Error('MongoDb insert failed.')
      }

      if (returnEntities) {
        const results = [...entities]
        return Object.values(result.insertedIds).map((id, index) => {
          const entity = results[index]
          entity[this.$idField] = this.objectIdToString(id)
          return entity
        })
      }

      return entities.insertedIds.map(id => this.objectIdToString(id))
      // .then(result => result.insertedCount > 0 ? result.ops[0] : null)
    },
    findOne (query) {
      return this.collection.findOne(query)
    },
    findById (id) {
      return this.collection
        .findOne({ [this.$idField]: this.stringToObjectId(id) })
    },
    findByIds (ids) {
      return this.collection
        .find({
          [this.$idField]: {
            $in: ids.map(id => this.stringToObjectId(id))
          }
        })
        .toArray()
    },
    find (params) {
      return new Promise((resolve, reject) => {
        const buffer = []
        const query = params.query || {}

        if (query[this.$idField]) {
          query[this.$idField] = this.stringToObjectId(query[this.$idField])
        }

        // Init cursor
        let cursor = this.collection.find(query, params.projection)

        // handle projection
        if (params.projection) {
          cursor = cursor.project(params.projection)
        }

        // handle limit
        if (params.limit) {
          cursor = cursor.limit(Number(params.limit))
        }

        // handle offset
        if (params.offset) {
          cursor = cursor.skip(params.offset)
        }

        // Handle sort
        if (params.sort) {
          cursor = cursor.sort(params.sort)
        }

        const stream = cursor.stream()

        if (params.asStream === true) {
          resolve(stream)
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
    findAsStream (query, options) {
      return this.find({ asStream: true, query, ...options })
    },
    updateById (id, entity) {
      return this.collection
        .findOneAndUpdate(
          { [this.$idField]: this.stringToObjectId(id) },
          entity,
          { returnOriginal: false }
        )
        .then(result => result.value)
    },
    removeById (id) {
      return this.collection
        .findOneAndDelete({ [this.$idField]: this.stringToObjectId(id) })
        .then(result => result.value)
    },
    clear () {
      return this.collection
        .deleteMany({})
        .then(result => result.deletedCount)
    },
    entityToObject (entity) {
      const data = Object.assign({}, entity)

      if (data[this.$idField]) {
        data[this.$idField] = this.objectIdToString(entity[this.$idField])
      }

      return data
    },
    objectIdToString (objectId) {
      if (objectId && objectId.toHexString) {
        return objectId.toHexString()
      }
      return objectId
    },
    stringToObjectId (value) {
      if (typeof value === 'string' && ObjectId.isValid(value)) {
        return new ObjectId(value)
      }
      return value
    }
  })
}
