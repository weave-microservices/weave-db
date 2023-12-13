/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2020 Fachwerk
 */

const { AdapterBase } = require('@weave-js/db');
const adapterBase = require('@weave-js/db/lib/adapter-base');
const { MongoClient, ObjectId } = require('mongodb');

/**
 * @typedef {import('@weave-js/db').BaseAdapter} BaseAdapter
 */

/**
 * @typedef {object} MongoDbAdapterOptions - Options for the MongoDB adapter
 * @property {string} url - MongoDB connection url
 * @property {string} [database] - MongoDB database name
 * @property {boolean} [transform] - Whether to transform the data or not
 * @property {import('mongodb').MongoClientOptions} [options] - Whether to use unified topology or not
*/

/**
 * @typedef {BaseAdapter} Adapter - MongoDB adapter
 * @property {MongoClient} client - MongoDB client
*/

/**
 * Create a MongoDb adapter instance
 * @param {MongoDbAdapterOptions} options - Options
 * @returns {Adapter} - Adapter
*/
module.exports = (options) => {
  options = Object.assign({
    transform: true,
    collectionName: undefined
  }, options);

  /** @type {} */
  const baseAdapter = AdapterBase(options);

  /** @typedef {Adapter} */
  const adapter = {
    decorateSchema (schema) {
      schema.actions.aggregate = {
        params: {
          pipeline: { type: 'array' }
        },
        handler (context) {
          return this.adapter.collection.aggregate(context.data.pipeline).toArray();
        }
      };
      return schema;
    },
    init (broker, service) {
      const entityName = service.schema.collectionName;

      if (!entityName) {
        throw new Error('Collection name is missing!');
      }

      this.$service = service;
      this.$collectionName = entityName;
      this.$entityName = entityName;
      this.$idField = service.schema.settings.idFieldName || '_id';
      this.log = broker.createLogger('MONGODB ADAPTER');
    },
    async connect () {
      /** @type {MongoClient} */
      try {
        const client = await MongoClient.connect(options.url, options.options);
        // this.client = new MongoClient(this.uri, this.opts);// await this.mongoClient.connect();
        await client.connect();

        this.db = this.$service.db = client.db ? client.db(options.database) : client;
        this.collection = this.$service.db.collection(this.$collectionName);
        this.client = client;
        this.log.debug('Database connection established');
        return { dbInstance: this.db };
      } catch (error) {
        this.log.error('Database connection failed', { error });
        throw error;
      }
    },
    async disconnect () {
      return this.client.close();
    },
    count (params) {
      const query = params.query || {};
      if (query[this.$idField]) {
        query[this.$idField] = this.stringToObjectId(query[this.$idField]);
      }
      return this.collection
        .countDocuments(query);
    },
    async insert (entity) {
      const result = await this.collection.insertOne(entity);
      if (!result.acknowledged) {
        throw new Error('MongoDb insert failed.');
      }

      const copy = Object.assign({}, entity);
      copy[this.$idField] = this.objectIdToString(result.insertedId);
      return copy;
    },
    async insertMany (entities, returnEntities = true) {
      const result = await this.collection.insertMany(entities);
      if (!result.acknowledged) {
        throw new Error('MongoDb insert failed.');
      }

      if (returnEntities) {
        const results = [...entities];
        return Object.values(result.insertedIds).map((id, index) => {
          const entity = results[index];
          entity[this.$idField] = this.objectIdToString(id);
          return entity;
        });
      }

      return entities.insertedIds.map(id => this.objectIdToString(id));
    },
    findOne (rawQuery) {
      const query = Object.assign({}, rawQuery);
      if (query[this.$idField]) {
        query[this.$idField] = this.stringToObjectId(query[this.$idField]);
      }
      return this.collection.findOne(query);
    },
    findById (id) {
      return this.collection
        .findOne({ [this.$idField]: this.stringToObjectId(id) });
    },
    findByIds (ids) {
      return this.collection
        .find({
          [this.$idField]: {
            $in: ids.map(id => this.stringToObjectId(id))
          }
        })
        .toArray();
    },
    find (params) {
      return new Promise((resolve, reject) => {
        const buffer = [];
        const query = params.query || {};

        if (query[this.$idField]) {
          query[this.$idField] = this.stringToObjectId(query[this.$idField]);
        }

        // Init cursor
        let cursor = this.collection.find(query, params.projection);

        // handle projection
        if (params.projection) {
          cursor = cursor.project(params.projection);
        }

        // handle limit
        if (params.limit) {
          cursor = cursor.limit(Number(params.limit));
        }

        // handle offset
        if (params.offset) {
          cursor = cursor.skip(params.offset);
        }

        // Handle sort
        if (params.sort) {
          cursor = cursor.sort(params.sort);
        }

        const stream = cursor.stream();

        if (params.asStream === true) {
          resolve(stream);
        } else {
          stream.on('data', (data) => {
            buffer.push(data);
          });

          stream.on('end', () => {
            return resolve(buffer);
          });

          stream.on('error', (error) => {
            return reject(error);
          });
        }
      });
    },
    findAsStream (query, options) {
      return this.find({ asStream: true, query, ...options });
    },
    updateById (id, entity) {
      return this.collection
        .findOneAndUpdate(
          { [this.$idField]: this.stringToObjectId(id) },
          entity,
          { returnDocument: 'after' }
        );
    },
    removeById (id) {
      return this.collection
        .findOneAndDelete({ [this.$idField]: this.stringToObjectId(id) });
    },
    async clear () {
      return await this.collection.deleteMany({})
        .then(result => result.deletedCount);
    },
    entityToObject (entity) {
      const data = Object.assign({}, entity);

      if (data[this.$idField]) {
        data[this.$idField] = this.objectIdToString(entity[this.$idField]);
      }

      return data;
    },
    objectIdToString (objectId) {
      if (objectId && objectId.toHexString) {
        return objectId.toHexString();
      }
      return objectId;
    },
    stringToObjectId (value) {
      if (typeof value === 'string' && ObjectId.isValid(value)) {
        return new ObjectId(value);
      }
      return value;
    }
  };

  return Object.assign(baseAdapter, adapter);
};
