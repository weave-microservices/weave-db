const NeDB = require('nedb-core')

function WeaveDbAdapter (options) {
    let db

    function validateMode (model) {
        if (typeof model === 'string') {
            return true
        }
        if (typeof model === 'object') {
            if (!model.name) throw new Error('Model needs a name!')
        }
    }

    return {
        init (broker, service) {
            if (!service.schema.model) {
                throw new Error('Model not defined!')
            }
            this.model = service.schema.model
            this.$idFieldName = service.schema.settings.idFieldName || '_id'
        },
        connect () {
            return new Promise((resolve, reject) => {
                try {
                    this.db = new NeDB({
                        filename: `${this.model.name}.db`,
                        autoload: true
                    })

                    resolve(this)
                } catch (error) {
                    reject(error)
                }
            })
        },
        disconnect () {
            return Promise.resolve(this)
        },
        count (filterParams) {
            const query = filterParams.query || {}
            console.log(query)
            return new Promise((resolve, reject) => {
                this.db.count(query, (error, count) => {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(count)
                })
            })
        },
        insert (entity) {
            return new Promise((resolve, reject) => {
                return this.db.insert(entity, (error, newDoc) => {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(newDoc)
                })
            })
        },
        insertMany (entities) {
            return this.insert(entities)
        },
        findById (id) {
            return new Promise((resolve, reject) => {
                this.db.findOne({ [this.$idFieldName]: id }).exec((error, docs) => {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(docs)
                })
            })
        },
        findByIds (ids) {
            return new Promise((resolve, reject) => {
                this.db.find({ [this.$idFieldName]: { $in: ids }}).exec((error, docs) => {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(docs)
                })
            })
        },
        find (params) {
            return new Promise((resolve, reject) => {
                const query = params.query || {}

                let q = this.db.find(query)

                if (query[this.$idFieldName]) {
                    // query[this.$idField] = stringToObjectID(query[this.$idField])
                }

                if (params.limit) {
                    q = q.limit(Number(params.limit))
                }

                if (params.offset) {
                    q = q.skip(params.offset)
                }

                if (params.sort) {
                    q = q.sort(params.sort)
                }

                q.exec((error, docs) => {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(docs)
                })
            })
        },
        updateById (id, entity) {
            return this.db.get(model).find({ id }).assign(entity).write()
        },
        removeById (id) {
            return this.db.get(model).remove({ id }).write()
        }
    }
}

module.exports = WeaveDbAdapter
