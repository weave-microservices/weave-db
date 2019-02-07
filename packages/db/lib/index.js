/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2019 Fachwerk
 */

// npm packages
const { isFunction, isObject } = require('lodash')
const { promisify } = require('fachwork')

// own modules
const NeDbAdapter = require('./nedb-adapter')
const { DocumentNotFoundError } = require('./errors')

module.exports = () => {
    return {
        settings: {
            idFieldName: '_id',
            pageSize: 10,
            maxPageSize: 1000,
            lookups: null,
            fields: null,
            entityValidator: null
        },
        actions: {
            /**
             * Get count of entities by query.
             *
             * @actions
             *
             * @param {Object} query - Query object. Passes to adapter.
             *
             * @returns {Number} List of found entities.
             */
            count: {
                params: {
                    query: { type: 'any', optional: true }
                },
                handler (context) {
                    const params = this.sanitizeParams(context, context.params)
                    if (params.limit) {
                        params.limit = null
                    }

                    if (params.offset) {
                        params.offset = null
                    }
                    return this.adapter.count(params)
                }
            },
            /**
             * Get entity by id.
             *
             * @actions
             * @cached
             *
             * @param {Object} query - Query object. Passes to adapter.
             *
             * @returns {Number} List of found entities.
             */
            get: {
                cache: {
                    keys: ['id']
                },
                params: {
                    id: { type: 'any' },
                    lookup: { type: 'array', contains: { type: 'string' }, optional: true },
                    mapIds: { type: 'boolean', optional: true }
                },
                handler (context) {
                    const { id, mapIds } = context.params
                    return this.model(context, { id })
                        .then(docs => {
                            if (!docs) {
                                return Promise.reject(new DocumentNotFoundError(id))
                            }
                            return this.transformDocuments(context, context.params, docs)
                        })
                        .then(docs => {
                            if (Array.isArray(docs) && mapIds) {
                                const result = {}
                                docs.forEach(doc => {
                                    result[doc[this.settings.idFieldName]] = doc
                                })
                                return result
                            }
                            return docs
                        })
                }
            },
            find: {
                cache: {
                    keys: ['lookup', 'query']
                },
                params: {
                    query: { type: 'any', optional: true },
                    sort: { type: 'any', optional: true },
                    lookup: { type: 'array', contains: { type: 'string' }, optional: true },
                    fields: { type: 'array', contains: { type: 'string' }, optional: true },
                    limit: { type: 'number', optional: true, convert: true },
                    offset: { type: 'number', optional: true, convert: true }
                },
                handler (context) {
                    const params = this.sanitizeParams(context, context.params)
                    return this.adapter.find(params)
                        .then(docs => this.transformDocuments(context, params, docs))
                }
            },
            findOne: {
                cache: {
                    keys: ['lookup', 'query']
                },
                params: {
                    query: { type: 'any', optional: true },
                    lookup: { type: 'array', contains: { type: 'string' }, optional: true },
                    fields: { type: 'array', contains: { type: 'string' }, optional: true }
                },
                handler (context) {
                    // sanitize the given parameters
                    const params = this.sanitizeParams(context, context.params)

                    // send params to the adapter
                    return this.adapter.findOne(params.query)
                        .then(doc => this.transformDocuments(context, params, doc))
                }
            },
            /**
             * List entities by query and paginate results.
             *
             * @actions
             * @cached
             *
             * @param {Array<String>?} lookup - Lookup fields from other services.
             * @param {Array<String>?} fields - Fields filter.
             * @param {Number} limit - Max count of rows.
             * @param {Number} offset - Count of skipped rows.
             * @param {String} sort - Sorted fields.
             * @param {String} search - Search text.
             * @param {String} searchFields - Fields for searching.
             * @param {Object} query - Query object. Passes to adapter.
             *
             * @returns {Object} List of found entities.
             */
            list: {
                cache: {
                    keys: ['lookup', 'query', 'page', 'pageSize']
                },
                params: {
                    query: { type: 'any', optional: true },
                    sort: { type: 'any', optional: true },
                    lookup: { type: 'array', contains: { type: 'string' }, optional: true },
                    fields: { type: 'array', contains: { type: 'string' }, optional: true },
                    page: { type: 'number', optional: true, convert: true },
                    pageSize: { type: 'number', optional: true, convert: true }
                },
                handler (context) {
                    const params = this.sanitizeParams(context, context.params)
                    const countParams = Object.assign({}, params)

                    // Remove params for count action
                    if (countParams.limit) {
                        countParams.limit = null
                    }

                    if (countParams.offset) {
                        countParams.offset = null
                    }

                    return Promise.all([
                        this.adapter.find(params),
                        this.adapter.count(countParams)
                    ])
                        .then(res => this.transformDocuments(context, params, res[0])
                            .then(doc => {
                                return {
                                    rows: doc,
                                    totalRows: res[1],
                                    page: params.page,
                                    pageSize: params.pageSize,
                                    totalPages: Math.floor((res[1] + params.pageSize - 1) / params.pageSize)
                                }
                            }))
                }
            },
            findStream: {
                params: {
                    query: { type: 'any' },
                    filterOptions: { type: 'any' }
                },
                handler (context) {
                    return this.adapter.findAllStream(context.params.query, context.params.filterOptions)
                }
            },
            insert: {
                params: {
                    entity: { type: 'any' }
                },
                handler (context) {
                    const { entity } = context.params
                    return this.validateEntity(entity)
                        .then(entity => this.adapter.insert(entity))
                        .then(data => this.entityChanged('Inserted', data, context).then(() => data))
                }
            },
            insertMany: {
                params: {
                    entities: { type: 'array', contains: { type: 'any' }}
                },
                handler (context) {
                    const { entities } = context.params
                    const entitySet = entities.map((entity) => {
                        return this.validateEntity(entity).then(res => {
                            return res
                        })
                    })
                    return Promise.all(entitySet).then(res => {
                        return this.adapter.insertMany(res)
                    })
                }
            },
            update: {
                params: {
                    id: { type: 'any' },
                    entity: { type: 'any' },
                    options: { type: 'object', optional: true }
                },
                handler (context) {
                    const { id, entity } = context.params
                    return this.adapter.updateById(id, entity)
                        .then(doc => {
                            if (!doc) {
                                return Promise.reject(new DocumentNotFoundError(id))
                            }
                            return this.transformDocuments(context, context.params, doc)
                        })
                        .then(data => this.entityChanged('Updated', data, context).then(() => data))
                }
            },
            remove: {
                params: {
                    id: { type: 'any' }
                },
                handler (context) {
                    const { id } = context.params
                    return this.adapter.removeById(id)
                        .then(doc => {
                            if (!doc) {
                                return Promise.reject(new DocumentNotFoundError(id))
                            }
                            return this.transformDocuments(context, context.params, doc)
                                .then(data => this.entityChanged('Removed', data, context).then(() => data))
                        })
                }
            }
        },
        methods: {
            connect () {
                const self = this
                return this.adapter.connect().then((adapterResult) => {
                    try {
                        if (isFunction(self.schema.afterConnect)) {
                            self.schema.afterConnect.call(this, adapterResult)
                        }
                    } catch (error) {
                        this.log.error('afterConnect error: ', error)
                    }
                })
            },
            disconnect () {
                return this.adapter.disconnect()
            },
            sanitizeParams (context, params) {
                const sanitizedParams = Object.assign({}, params)

                if (typeof sanitizedParams.limit === 'string') {
                    sanitizedParams.limit = Number(sanitizedParams.limit)
                }
                if (typeof sanitizedParams.offset === 'string') {
                    sanitizedParams.offset = Number(sanitizedParams.offset)
                }
                if (typeof sanitizedParams.page === 'string') {
                    sanitizedParams.page = Number(sanitizedParams.page)
                }
                if (typeof sanitizedParams.pageSize === 'string') {
                    sanitizedParams.pageSize = Number(sanitizedParams.pageSize)
                }
                if (typeof sanitizedParams.lookup === 'string') {
                    sanitizedParams.lookup = sanitizedParams.lookup.split(' ')
                }

                if (context.action.name.endsWith('.list')) {
                    if (!sanitizedParams.page) {
                        sanitizedParams.page = 1
                    }

                    if (!sanitizedParams.pageSize) {
                        sanitizedParams.pageSize = this.settings.pageSize
                    }
                    sanitizedParams.limit = sanitizedParams.pageSize
                    sanitizedParams.offset = (sanitizedParams.page - 1) * sanitizedParams.pageSize
                }
                return sanitizedParams
            },
            model (context, params) { // by ids
                return Promise.resolve(params)
                    .then(({ id }) => {
                        if (Array.isArray(id)) {
                            return this.adapter.findByIds(id)
                        }
                        return this.adapter.findById(id)
                    })
                    .then(data => this.filterFields(data, context.params.fields))
            },
            transformDocuments (context, params, docs) {
                let isDoc = false

                // if docs is a single doc - wrap it in an array
                if (!Array.isArray(docs)) {
                    if (isObject(docs)) {
                        isDoc = true
                        docs = [docs]
                    } else {
                        return Promise.resolve(docs)
                    }
                }
                return Promise.resolve(docs)
                    .then(docs => docs.map(doc => this.adapter.entityToObject(doc)))
                    .then(json => params.lookup ? this.lookupDocs(context, json, params.lookup) : json)
                    .then(json => this.filterFields(json, params.fields ? params.fields : this.settings.fields))
                    .then(json => isDoc ? json[0] : json)
            },
            lookupDocs (context, docs, lookupFields) {
                if (!this.settings.lookups || !Array.isArray(lookupFields) || lookupFields.length === 0) {
                    return Promise.resolve(docs)
                }

                if (docs === null || !isObject(docs) || !Array.isArray(docs)) {
                    return Promise.resolve(docs)
                }

                const promises = []
                Object.keys(this.settings.lookups).forEach(key => {
                    let rule = this.settings.lookups[key]

                    if (lookupFields.indexOf(key) === -1) {
                        return
                    }

                    if (isFunction(rule)) {
                        rule = {
                            handler: promisify(rule)
                        }
                    }

                    if (typeof rule === 'string') {
                        rule = {
                            action: rule
                        }
                    }

                    const getProperty = (object, key) => {
                        if (key.includes('.')) {
                            return key.split('.').reduce((obj, i) => obj[i], object)
                        }
                        return object[key]
                    }

                    const arr = Array.isArray(docs) ? docs : [docs]
                    const idList = arr.map(doc => getProperty(doc, key))

                    const transformResponse = lookedUpDocs => {
                        arr.forEach(doc => {
                            const id = doc[key]
                            doc[key] = lookedUpDocs === null ? null : lookedUpDocs[id]
                        })
                    }

                    if (rule.handler) {
                        let ruleResult = rule.handler.call(this, context, arr, idList, rule)
                        if (isFunction(rule.transformation)) {
                            ruleResult = ruleResult.then(rule.transformation)
                        }
                        promises.push(ruleResult)
                    } else {
                        const params = Object.assign({
                            id: idList,
                            mapIds: true
                        }, rule.params || {})
                        promises.push(context.call(rule.action, params).then(transformResponse))
                    }
                })
                return Promise.all(promises).then(() => docs)
            },
            filterFields (docs, fields) {
                return Promise.resolve(docs)
                    .then((docs) => {
                        if (Array.isArray(fields)) {
                            if (Array.isArray(docs)) {
                                return docs.map((entity) => {
                                    const result = {}
                                    fields.forEach(field => (result[field] = entity[field]))
                                    if (Object.keys(result).length > 0) {
                                        return result
                                    }
                                })
                            } else {
                                const result = {}
                                fields.forEach(field => (result[field] = docs[field]))
                                if (Object.keys(result).length > 0) {
                                    return result
                                }
                            }
                        }
                        return docs
                    })
            },
            entityChanged (type, data, context) {
                this.log.debug('Doc changed')
                return this.clearCache().then(() => {
                    const eventName = `doc${type}`
                    if (isFunction(this.schema[eventName])) {
                        this.schema[eventName].call(this, data, context)
                    }
                    return Promise.resolve()
                })
            },
            clearCache () {
                this.log.debug(`Clear Cache for service: ${this.name}`)
                this.broker.broadcast(`cache.clear.${this.name}`)
                if (this.broker.cache) {
                    this.broker.cache.clear(`${this.name}.*`)
                }
                return Promise.resolve()
            },
            validateEntity (entity) {
                if (!isFunction(this.settings.entityValidator)) {
                    return Promise.resolve(entity)
                }
                const entities = Array.isArray(entity) ? entity : [entity]
                return Promise.all(entities.map(ent => this.settings.entityValidator(ent))).then(() => entity)
            }
        },
        created () {
            if (this.schema.adapter) {
                this.adapter = this.schema.adapter
            } else {
                this.adapter = NeDbAdapter()
            }

            this.adapter.init(this.broker, this)
            this.log.debug(`Weave db initialized for service ${this.name}`)

            if (this.broker.validator && this.settings.entityValidator) {
                const check = this.broker.validator.compile(this.settings.entityValidator)
                this.settings.entityValidator = entity => {
                    const result = check(entity)
                    if (result === true) {
                        return Promise.resolve()
                    }
                    return Promise.reject(new Error('Entity validation error!', result))
                }
            }
        },
        started () {
            if (this.adapter) {
                const self = this
                return new Promise(resolve => {
                    const connecting = () => {
                        this.connect().then((adapterResult) => {
                            resolve(adapterResult)
                        }).catch(error => {
                            setTimeout(() => {
                                self.log.info('Connection error', error)
                                self.log.info('reconnecting...')
                                connecting()
                            }, 1000)
                        })
                    }
                    connecting()
                })
            }
            return Promise.reject(new Error('Please set the store adapter in schema!'))
        },
        stopped () {
            this.disconnect()
        }
    }
}
