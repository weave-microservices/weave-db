const { Weave } = require('@weave-js/core')
const { DbService } = require('../../lib/index')
require('../setup')('lookups')

const files = [
  { name: 'TestFile.mp3' },
  { name: 'Invoice.doc' },
  { name: 'user.csv' }
]

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

describe('db-service lookup test', () => {
  const broker = Weave({
    logger: {
      enabled: false
    }
  })

  broker.createService({
    name: 'file',
    mixins: DbService(),
    collectionName: 'lookups_files',
    settings: {
      fields: ['_id', 'title', 'content', 'clicks', 'author'],
      lookups: {
        author: 'user.get'
      }
    }
  })

  broker.createService({
    name: 'thread',
    mixins: DbService(),
    collectionName: 'lookups_threads',
    settings: {
      fields: ['_id', 'title', 'content', 'clicks', 'author', 'attachments'],
      lookups: {
        author: 'user.get'
      }
    }
  })

  broker.createService({
    name: 'user',
    mixins: DbService(),
    collectionName: 'lookups_users',
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
      return Promise.all([
        broker.call('user.insertMany', { entities: users }),
        broker.call('file.insertMany', { entities: files })
      ]).then(([resultsUser, resultsFiles]) => {
        resultsUser.forEach((user, i) => (users[i]._id = user._id))
        resultsFiles.forEach((file, i) => (files[i]._id = file._id))

        threads[0].author = users[1]._id
        threads[0].attachments = {
          files: [files[0]._id]
        }

        threads[1].author = users[0]._id
        threads[1].attachments = {
          files: [files[0]._id]
        }

        threads[2].author = users[2]._id
        threads[2].attachments = {
          files: [files[2]._id]
        }

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

describe('db-service nested lookup test', () => {
  const broker = Weave({
    logger: {
      enabled: false
    }
  })

  broker.createService({
    name: 'file',
    mixins: DbService(),
    collectionName: 'lookups_files',
    settings: {
      fields: ['_id', 'name']
    }
  })

  broker.createService({
    name: 'thread',
    mixins: DbService(),
    collectionName: 'lookups_threads',
    settings: {
      fields: ['_id', 'title', 'content', 'clicks', 'author', 'attachments'],
      lookups: {
        author: 'user.get',
        'attachments.files': 'file.get'
      }
    }
  })

  broker.createService({
    name: 'user',
    mixins: DbService(),
    collectionName: 'lookups_users',
    settings: {
      fields: ['_id', 'username', 'firstname', 'lastname', 'threads'],
      lookups: {
        threads: function (context, docs) {
          return Promise.all(
            docs.map(doc => {
              return context.call('thread.find', { query: { author: doc._id }, lookup: ['attachments.files'] })
                .then(results => {
                  doc.threads = results
                  doc
                })
            })
          )
        }
      }
    }
  })
  
  beforeAll(() => broker.start())
  afterAll(() => broker.stop())
  it('should get the looked up docs as array', () => {
    return broker.call('user.get', { id: users[1]._id, lookup: ['threads'] })
      .then(result => {
        expect(result.threads).toBeDefined()
        expect(result.threads).toBeInstanceOf(Array)
        expect(result.threads.length).toBe(1)
        expect(result.threads[0].attachments.files[0]).toEqual(files[0])
      })
  })

  it('should get only nested fields', () => {
    return broker.call('thread.get', { id: threads[1]._id, lookup: ['author'], fields: ['_id', 'author._id', 'author.username', 'author.firstname'] })
      .then(result => {
        expect(result.author).toBeDefined()
        expect(result.author._id).toBeDefined()
        expect(result.author.username).toBe('maxi123')
        expect(result.author.firstname).toBe('Max')
      })
  })
})
