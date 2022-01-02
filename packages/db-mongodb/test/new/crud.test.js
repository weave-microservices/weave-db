const { createCrudTests } = require('@weave-js/db-tests/actions/crud')
const { MongoClient } = require('mongodb')
const MongoDbAdapter = require('../../lib')

const connectionString = 'mongodb://localhost:27017/weave-db-test'

const mongoDbAdapter = MongoDbAdapter({
  url: connectionString
})

const setup = () => {
  afterAll(async () => {
    const client = await MongoClient.connect(connectionString)
    const db = client.db()
    await db.collection('crud_test').deleteMany({})
    await client.close()
  })
}

createCrudTests({ adapter: mongoDbAdapter, setup })
