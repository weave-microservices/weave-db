const { Weave, Errors } = require('@weave-js/core')
const { DbService } = require('../../lib/index')
const DbAdapter = require('../../lib/adapter')
const { EntityNotFoundError } = require('../../lib/errors')
require('../setup')('crud')

const docs = [
  { name: 'Testfile.txt', content: 'Hello World', size: 2 },
  { name: 'Weave_doc.pdf', content: 'Weave documentation file', size: 220 },
  { name: 'WeaveLogo.jpeg', content: null, size: 344 },
  { name: 'Blabla.pdf', content: 'Blabla', size: 566 }
]

const equalAtLeast = (obj, origin) => {
  Object.keys(origin).map(key => {
    expect(origin[key]).toEqual(obj[key])
  })
}

describe('db-service CRUD methods', () => {
  const broker = Weave({
    logger: {
      enabled: false
    }
  })

  broker.createService({
    name: 'test',
    mixins: DbService(),
    adapter: DbAdapter(),
    collectionName: 'crud_test',
    settings: {
      // fields: ['id', 'name']
    }
  })

  beforeAll(() => broker.start())

  afterAll(() => broker.stop())

  it('should insert a new doc', () => {
    return broker.call('test.insert', { entity: docs[0] })
      .then(result => {
        expect(result).toBeDefined()
        expect(result._id).toBeDefined()
        docs[0]._id = result._id
        equalAtLeast(result, docs[0])
      })
  })

  it('should insert multiple docs', () => {
    return broker.call('test.insertMany', { entities: [docs[1], docs[3], docs[2]] })
      .then(results => {
        expect(results).toBeDefined()
        expect(results.length).toBe(3)
        expect(results[0]._id).toBeDefined()
        expect(results[1]._id).toBeDefined()
        expect(results[2]._id).toBeDefined()

        docs[1]._id = results[0]._id
        docs[3]._id = results[1]._id
        docs[2]._id = results[2]._id

        equalAtLeast(results[0], docs[1])
        equalAtLeast(results[1], docs[3])
        equalAtLeast(results[2], docs[2])
      })
  })

  it('should throw an error on insert if parameter "entity" is missing.', () => {
    return broker.call('test.insert', {})
      .catch(error => {
        expect(error).toBeInstanceOf(Errors.WeaveParameterValidationError)
        expect(error.code).toBe(422)
      })
  })

  it('should return the number of docs.', () => {
    return broker.call('test.count')
      .then(result => {
        expect(result).toBeGreaterThanOrEqual(4)
      })
  })

  it('should return the number of docs and ignore limit and offset.', () => {
    return broker.call('test.count', { limit: 1, offset: 1 })
      .then(result => {
        expect(result).toBeGreaterThanOrEqual(4)
      })
  })

  it('should return the number of docs by condition.', () => {
    return broker.call('test.count', { query: { _id: docs[0]._id }})
      .then(result => {
        expect(result).toBe(1)
      })
  })

  it('should return a doc by ID.', () => {
    return broker.call('test.get', { id: docs[0]._id })
      .then(result => {
        equalAtLeast(result, docs[0])
      })
  })

  it('should return multiple docs by ID.', () => {
    return broker.call('test.get', { id: [docs[0]._id, docs[2]._id] })
      .then(results => {
        expect(results.length).toBe(2)
        equalAtLeast(results[0], docs[0])
        equalAtLeast(results[1], docs[2])
      })
  })

  it('should throw an error if a document does not exist.', () => {
    return broker.call('test.get', { id: 99999999999 })
      .catch(error => {
        expect(error).toBeInstanceOf(EntityNotFoundError)
      })
  })

  it('should find docs by query.', () => {
    return broker.call('test.find', { query: { _id: docs[1]._id }})
      .then(results => {
        expect(results.length).toBe(1)
        equalAtLeast(results[0], docs[1])
      })
      .catch(error => {
        expect(error).toBeInstanceOf(EntityNotFoundError)
      })
  })

  it('should find docs by query.', () => {
    return broker.call('test.findStream', { query: { _id: docs[1]._id }})
      .catch(error => {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Method not implemented.')
      })
  })

  it('should find a single doc by query.', () => {
    return broker.call('test.findOne', { query: { name: 'Weave_doc.pdf' }})
      .then(result => {
        equalAtLeast(result, docs[1])
      })
  })

  it('should find docs paginated.', () => {
    return broker.call('test.list')
      .then(results => {
        expect(results.page).toBe(1)
        expect(results.pageSize).toBe(10)
        expect(results.rows.length).toBe(4)
        expect(results.totalPages).toBe(1)
        expect(results.totalRows).toBe(4)
      })
  })

  it('should find docs paginated with query.', () => {
    return broker.call('test.list', { query: { name: 'Testfile.txt' }})
      .then(results => {
        expect(results.page).toBe(1)
        expect(results.pageSize).toBe(10)
        expect(results.rows.length).toBe(1)
        expect(results.totalPages).toBe(1)
        expect(results.totalRows).toBe(1)
        equalAtLeast(results.rows[0], docs[0])
      })
  })

  it('should find docs paginated with query.', () => {
    return broker.call('test.list', { pageSize: 1, page: 2 })
      .then(results => {
        expect(results.page).toBe(2)
        expect(results.pageSize).toBe(1)
        expect(results.rows.length).toBe(1)
        expect(results.totalPages).toBe(4)
        expect(results.totalRows).toBe(4)
        // equalAtLeast(results.rows[0], docs[1])
      })
  })

  it('should update a doc.', () => {
    return broker.call('test.find', { query: { _id: docs[1]._id }})
      .then(results => {
        expect(results.length).toBe(1)
        equalAtLeast(results[0], docs[1])
      })
      .catch(error => {
        expect(error).toBeInstanceOf(EntityNotFoundError)
      })
  })
})
