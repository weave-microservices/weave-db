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
 * @property {boolean} [autoHint] - Try to automatically find a index hint for queries
 * @property {string} [defaultHint] - Default index hint
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
    collectionName: undefined,
    autoHint: false,
    defaultHint: '_id_'
  }, options);

  const baseAdapter = AdapterBase(options);

  /** @typedef {Adapter} */
  const adapter = {
    decorateSchema (schema) {
      schema.actions.aggregate = {
        params: {
          pipeline: { type: 'array' },
          options: { type: 'object', optional: true }
        },
        handler (context) {
          const aggregateOptions = context.data.options || {};

          return this.adapter.collection
            .aggregate(context.data.pipeline, options)
            .toArray();
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

        try {
          this.indexes = await this.collection.listIndexes().toArray();
          this.log.debug('');
        } catch (indexFetchError) {
          this.log.error('Failed to fetch indexes', { indexFetchError });
        }

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
      const countOptions = params.options || {};

      if (query[this.$idField]) {
        query[this.$idField] = this.stringToObjectId(query[this.$idField]);
      }

      if (options.autoHint && !countOptions.hint) {
        countOptions.hint = this.tryGetHint(query);
      }

      return this.collection
        .countDocuments(query, countOptions);
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
        const queryOptions = params.options || {};

        if (query[this.$idField]) {
          query[this.$idField] = this.stringToObjectId(query[this.$idField]);
        }

        // Init cursor
        let cursor = this.collection.find(query, params.projection);

        // // handle projection
        // if (params.projection) {
        //   cursor = cursor.project(params.projection);
        // }

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

        if (options.autoHint && !queryOptions.hint) {
          queryOptions.hint = this.tryGetHint(query);
        }

        if (queryOptions.hint) {
          cursor = cursor.hint(queryOptions.hint);
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
    findAsStream (params) {
      return this.find({ asStream: true, ...params });
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
    /**
     * Convert a string to an ObjectId
     * @param {string} objectIdString ObjectId String
     * @returns {import('mongodb').ObjectId | string} ObjectId
     */
    stringToObjectId (objectIdString) {
      if (typeof objectIdString === 'string' && ObjectId.isValid(objectIdString)) {
        return new ObjectId(objectIdString);
      }
      return objectIdString;
    },
    /**
     * Try to get the index hint from the query params
     * @param {Object} query Query
     * @param {Object} options Options
     * @returns {string} Index hint
     */
    tryGetHint (query) {
      const isQueryEmpty = Object.keys(query).length === 0;

      /** @type {string} */
      let hint = options.defaultHint;

      if (!isQueryEmpty) {
        const index = this.indexes.find((index) => {
          const indexKeys = Object.keys(index.key);
          return indexKeys.every((key) => query[key]);
        });

        if (index) {
          hint = index.name;
        }
      }

      return hint;
    }
  };

  return Object.assign(baseAdapter, adapter);
};
