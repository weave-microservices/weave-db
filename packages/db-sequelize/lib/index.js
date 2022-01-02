/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2021 Fachwerk
 */

const Sequelize = require('sequelize')
const op = Sequelize.Op

module.exports = (...options) => {
  return {
    init (broker, service) {
      if (!service.schema.model) {
        throw new Error('Model not defined!')
      }

      if (typeof service.schema.model !== 'object') {
        throw new Error('Model needs to be an object!')
      }

      if (!service.schema.model.name) {
        throw new Error('Model needs a name!')
      }

      this.broker = broker
      this.$service = service
      this.idFieldName = service.settings.idFieldName
      this.log = broker.getLogger('Sequelize DB adapter')
    },
    connect () {
      this.db = new Sequelize(...options)
      return this.db.authenticate()
        .then(() => {
          const modelDefinition = this.$service.schema.model
          this.model = this.db.define(modelDefinition.name, modelDefinition.schema, modelDefinition.options)
          return this.model.sync()
        })
    },
    disconnect () {
      return new Promise((resolve, reject) => {
        this.db.close((error) => {
          if (error) return reject(error)
          return resolve()
        })
      })
    },
    createMany (entities) {
      return this.model.bulkCreate(entities)
    },
    create (entity) {
      return this.model.create(entity)
    },
    count (params) {
      const options = {}
      if (params && params.query) {
        options.where = params.query
      }
      return this.model.count(options)
    },
    find (params) {
      const options = {}

      if (params.query) {
        options.where = params.query
      }

      if (params.limit) {
        options.limit = Number(params.limit) || 1000
      }
      if (params.offset) {
        options.offset = params.offset
      }

      if (params.order) {
        options.order = params.order
      }

      if (params.group) {
        options.group = params.group
      }

      if (params.distinct) {
        options.distinct = params.distinct
      }

      return this.model.findAll(options)
    },
    findOne (query) {
      throw new Error('Method not implemented.')
    },
    findById (id) {
      return this.model.findById(id)
    },
    findByIds (idList) {
      return this.model.findAll({
        where: {
          [this.idFieldName]: {
            [op.in]: idList
          }
        }
      })
    },
    updateById (id, updatedEntity) {
      return this.findById(id).then(entity => entity.update(updatedEntity))
    },
    removeById (id) {
      return this.model.destroy({ where: { [this.idFieldName]: id }})
    },
    entityToObject (model) {
      return model.get({ plain: true })
    }
  }
}
