/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2019 Fachwerk
 */
const AdapterBase = require('../adapter-base');
const NeDB = require('nedb');

/**
 * @typedef {object} InMemoryadapterOptions
 * @property {string} [collectionName] - Name of the collection
 * @property {string} [idFieldName] - Name of the id field
 */

/**
 * Create In-Memory adapter instance
 * @param {InMemoryadapterOptions} options - Adapter options
 * @returns {any} - Adapter
 */
module.exports = (options = {}) => {
  return Object.assign(AdapterBase(), {
    init (broker, service) {
      const collectionName = options.collectionName ||
        service.settings.collectionName ||
        service.schema.entityName ||
        service.settings.entityName;

      if (!collectionName) {
        throw new Error('Collection name is missing!');
      }

      this.broker = broker;
      this.collectionName = collectionName;
      this.$idFieldName = service.schema.settings.idFieldName || '_id';
    },
    connect () {
      return new Promise((resolve, reject) => {
        try {
          this.db = new NeDB({
            filename: `${this.collectionName}.db`,
            autoload: true
          });

          resolve(this);
        } catch (error) {
          reject(error);
        }
      });
    },
    disconnect () {
      return Promise.resolve(this);
    },
    count (filterParams) {
      const query = filterParams.query || {};
      return new Promise((resolve, reject) => {
        this.db.count(query, (error, count) => {
          if (error) {
            return reject(error);
          }
          return resolve(count);
        });
      });
    },
    insert (entity) {
      return new Promise((resolve, reject) => {
        return this.db.insert(entity, (error, newEntity) => {
          if (error) {
            return reject(error);
          }
          return resolve(newEntity);
        });
      });
    },
    insertMany (entities) {
      return this.insert(entities);
    },
    findById (id) {
      return new Promise((resolve, reject) => {
        this.db.findOne({ [this.$idFieldName]: id }).exec((error, entity) => {
          if (error) {
            return reject(error);
          }
          return resolve(entity);
        });
      });
    },
    findByIds (ids) {
      return new Promise((resolve, reject) => {
        this.db.find({ [this.$idFieldName]: { $in: ids }}).exec((error, entities) => {
          if (error) {
            return reject(error);
          }
          return resolve(entities);
        });
      });
    },
    find (params) {
      return new Promise((resolve, reject) => {
        const query = params.query || {};

        let q = this.db.find(query);

        if (params.limit) {
          q = q.limit(Number(params.limit));
        }

        if (params.offset) {
          q = q.skip(params.offset);
        }

        if (params.sort) {
          q = q.sort(params.sort);
        }

        q.exec((error, entities) => {
          if (error) {
            return reject(error);
          }
          return resolve(entities);
        });
      });
    },
    findOne (query) {
      return new Promise((resolve, reject) => {
        this.db.findOne(query).exec((error, entities) => {
          if (error) {
            return reject(error);
          }
          return resolve(entities);
        });
      });
    },
    updateById (id, entity) {
      return this.db.find({ id }).assign(entity).write();
    },
    removeById (id) {
      return this.db.remove({ id }).write();
    },
    clear () {
      return this.db.remove({}).write();
    },
    entityToObject (entity) {
      return entity;
    }
  });
};
