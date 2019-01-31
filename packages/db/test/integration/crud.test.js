const { Weave, Errors } = require('@weave-js/core')
const DbService = require('../../lib/index')
const DbAdapter = require('../../lib/nedb-adapter')
const { DocumentNotFoundError } = require('../../lib/errors')

const docs = [
    { name: 'Testfile.txt', content: 'Hello World', size: 2 },
    { name: 'Weave_doc.pdf', content: 'Weave documentation file', size: 220 },
    { name: 'WeaveLogo.jpeg', content: null, size: 220 },
    { name: 'Blabla.pdf', content: 'Blabla', size: 220 }
]

const equalAtLeast = (obj, origin) => {
    Object.keys(origin).map(key => {
        expect(origin[key]).toEqual(obj[key])
    })
}

describe('db-service CRUD methods', () => {
    const broker = Weave({
        logLevel: 'error'
    })
    broker.createService({
        name: 'test',
        mixins: DbService(),
        adapter: DbAdapter(),
        model: {
            name: 'test'
        },
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
                expect(result).toBe(4)
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

    it('should throw an error if a document does not exist.', () => {
        return broker.call('test.get', { id: 99999999999 })
            .catch(error => {
                expect(error).toBeInstanceOf(DocumentNotFoundError)
            })
    })

    it('should throw an error if a document does not exist.', () => {
        return broker.call('test.get', { id: 99999999999 })
            .catch(error => {
                expect(error).toBeInstanceOf(DocumentNotFoundError)
            })
    })
})
