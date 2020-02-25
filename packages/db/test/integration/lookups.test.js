const { Weave } = require('@weave-js/core')
const DbService = require('../../lib/index')
require('../setup')

const threads = [
  { title: 'How to use weave?', content: 'Hello World', clicks: 2 },
  { title: 'I love weave!', content: 'Weave documentation file', clicks: 3243423123 },
  { title: 'Microservices rules!', content: 'Weave documentation file', clicks: 12345 }

]

const users = [
  { username: 'maxi123', firstname: 'Max', lastname: 'Mustermann', password: 'sadakjhfewiugfashdasd' },
  { username: 'Methias', firstname: 'Walter', lastname: 'White', password: '30983124923490234u23490' },
  { username: 'Pinkman124', firstname: 'John', lastname: 'Wayne', password: 'gfdsgs4gdfgsdfhsgh' }
]

const equalAtLeast = (obj, origin) => {
  Object.keys(origin).map(key => {
    expect(origin[key]).toEqual(obj[key])
  })
}

describe.only('db-service populates test', () => {
  const broker = Weave({
    logLevel: 'error'
  })

  broker.createService({
    name: 'thread',
    mixins: DbService(),
    collectionName: 'threads',
    settings: {
      fields: ['_id', 'title', 'content', 'clicks', 'author'],
      lookups: {
        author: 'user.get'
      }
    }
  })

  broker.createService({
    name: 'user',
    mixins: DbService(),
    collectionName: 'users',
    settings: {
      fields: ['_id', 'username', 'firstname', 'lastname', 'threads'],
      lookups: {
        threads: function (context, docs, bla) {
          return Promise.all(
            docs.map(doc => {
              return context.call('thread.find', { query: { author: doc._id }})
                .then(results => {
                  doc.threads = results
                })
            })
          )
        }
      }
    }
  })
  beforeAll(() => {
    return broker.start().then(() => {
      return broker.call('user.insertMany', { entities: users }).then(results => {
        results.forEach((user, i) => (users[i]._id = user._id))

        threads[0].author = users[1]._id
        threads[1].author = users[0]._id
        threads[2].author = users[2]._id

        return broker.call('thread.insertMany', { entities: threads }).then(results => {
          results.forEach((thread, i) => (threads[i]._id = thread._id))
        })
      })
    })
  })

  afterAll(() => broker.stop())

  it('should get the number of docs', () => {
    return broker.call('thread.count')
      .then(results => {
        expect(results).toBeGreaterThanOrEqual(3)
      })
  })

  it('should get the looked up doc', () => {
    return broker.call('thread.get', { id: threads[1]._id, lookup: ['author'] })
      .then(result => {
        expect(result).toBeDefined()
        equalAtLeast(users[0], result.author)
      })
  })

  it('should get the looked up docs as array', () => {
    return broker.call('user.get', { id: users[1]._id, lookup: ['threads'] })
      .then(result => {
        expect(result.threads).toBeDefined()
        expect(result.threads).toBeInstanceOf(Array)
        expect(result.threads.length).toBe(1)
        equalAtLeast(result.threads[0], threads[0])
      })
  })
})
