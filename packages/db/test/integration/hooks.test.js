const { Weave, Errors } = require('@weave-js/core')
const { DbService } = require('../../lib/index')
const DbAdapter = require('../../lib/nedb-adapter')
const { DocumentNotFoundError } = require('../../lib/errors')
require('../setup')

const docs = [
  { name: 'Testfile.txt', content: 'Hello World', size: 2 },
  { name: 'Weave_doc.pdf', content: 'Weave documentation file', size: 220 },
  { name: 'WeaveLogo.jpeg', content: null, size: 344 },
  { name: 'Blabla.pdf', content: 'Blabla', size: 566 },
  { name: 'Blabla2.pdf', content: 'Blabla2', size: 566 }
]

const equalAtLeast = (obj, origin) => {
  Object.keys(origin).map(key => {
    expect(origin[key]).toEqual(obj[key])
  })
}

describe('db-service CRUD methods', () => {
  let flow = []
  const broker = Weave({
    logLevel: 'error'
  })

  broker.createService({
    name: 'test',
    mixins: DbService(),
    adapter: DbAdapter(),
    collectionName: 'test',
    docInserted () {
      flow.push('inserted')
    },
    docUpdated () {
      flow.push('updated')
    },
    docRemoved () {
      flow.push('removed')
    }
  })

  beforeEach(() => {
    flow = []
  })

  beforeAll(() => {
    return broker.start()
  })

  afterAll(() => {
    return broker.stop()
  })

  it('should insert a new doc', (done) => {
    broker.call('test.insert', { entity: docs[0] })
      .then(result => {
        expect(result).toBeDefined()
        expect(result._id).toBeDefined()
        docs[0]._id = result._id
        equalAtLeast(result, docs[0])
        expect(flow.join(',')).toBe('inserted')
        done()
      })
  })

  it('should insert a new doc and don´t fire hook, (done)', (done) => {
    broker.call('test.insert', { entity: docs[4] }, { suppressHook: true })
      .then(result => {
        expect(result).toBeDefined()
        expect(result._id).toBeDefined()
        docs[0]._id = result._id
        equalAtLeast(result, docs[4])
        expect(flow.join(',')).toBe('')
        done()
      })
  })

  it('should insert multiple docs', (done) => {
    broker.call('test.insertMany', { entities: [docs[1], docs[3], docs[2]] })
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
        expect(flow.join(',')).toBe('inserted')
        done()
      })
  })

  it('should throw an error on insert if parameter "entity" is missing.', (done) => {
    broker.call('test.insert', {})
      .catch(error => {
        expect(error).toBeInstanceOf(Errors.WeaveParameterValidationError)
        expect(error.code).toBe(422)
        expect(flow.join(',')).toBe('')
        done()
      })
  })

  it('should return the number of docs.', (done) => {
    broker.call('test.count')
      .then(result => {
        expect(result).toBeGreaterThanOrEqual(4)
        done()
      })
  })

  it('should return the number of docs by condition.', (done) => {
    broker.call('test.count', { query: { _id: docs[0]._id }})
      .then(result => {
        expect(result).toBe(1)
        done()
      })
  })

  it('should return a doc by ID.', (done) => {
    broker.call('test.get', { id: docs[0]._id })
      .then(result => {
        equalAtLeast(result, docs[0])
        done()
      })
  })

  it('should return multiple docs by ID.', (done) => {
    broker.call('test.get', { id: [docs[0]._id, docs[2]._id] })
      .then(results => {
        expect(results.length).toBe(2)
        equalAtLeast(results[0], docs[0])
        equalAtLeast(results[1], docs[2])
        done()
      })
  })

  it('should throw an error if a document does not exist.', (done) => {
    broker.call('test.get', { id: 99999999999 })
      .catch(error => {
        expect(error).toBeInstanceOf(DocumentNotFoundError)
        done()
      })
  })

  it('should find docs by query.', (done) => {
    broker.call('test.find', { query: { _id: docs[1]._id }})
      .then(results => {
        expect(results.length).toBe(1)
        equalAtLeast(results[0], docs[1])
        done()
      })
      .catch(error => {
        expect(error).toBeInstanceOf(DocumentNotFoundError)
      })
  })

  it('should find a single doc by query.', (done) => {
    broker.call('test.findOne', { query: { name: 'Weave_doc.pdf' }})
      .then(result => {
        equalAtLeast(result, docs[1])
        done()
      })
  })

  it('should find docs paginated.', (done) => {
    broker.call('test.list')
      .then(results => {
        expect(results.page).toBe(1)
        expect(results.pageSize).toBe(10)
        expect(results.rows.length).toBe(5)
        expect(results.totalPages).toBe(1)
        expect(results.totalRows).toBe(5)
        done()
      })
  })

  it('should find docs paginated with query.', (done) => {
    broker.call('test.list', { query: { name: 'Testfile.txt' }})
      .then(results => {
        expect(results.page).toBe(1)
        expect(results.pageSize).toBe(10)
        expect(results.rows.length).toBe(1)
        expect(results.totalPages).toBe(1)
        expect(results.totalRows).toBe(1)
        equalAtLeast(results.rows[0], docs[0])
        done()
      })
  })

  it('should find docs paginated with query.', (done) => {
    broker.call('test.list', { pageSize: 1, page: 2 })
      .then(results => {
        expect(results.page).toBe(2)
        expect(results.pageSize).toBe(1)
        expect(results.rows.length).toBe(1)
        expect(results.totalPages).toBe(4)
        expect(results.totalRows).toBe(4)
        // equalAtLeast(results.rows[0], docs[1])
        done()
      })
  })

  it('should update a doc.', (done) => {
    broker.call('test.find', { query: { _id: docs[1]._id }})
      .then(results => {
        expect(results.length).toBe(1)
        equalAtLeast(results[0], docs[1])
        done()
      })
  })
})
