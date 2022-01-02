const { createCrudTests } = require('@weave-js/db-tests/actions/crud')
// const { MongoClient } = require('mongodb')
const SequelizeDbAdapter = require('../lib')

const connectionString = 'mongodb://localhost:27017/weave-db-test'

const sequelizeDbAdapter = SequelizeDbAdapter('sqlite::memory:')

const setup = () => {
  afterAll(async () => {
    // const client = await MongoClient.connect(connectionString)
    // const db = client.db()
    // await db.collection('crud_test').deleteMany({})
    // await client.close()
  })
}

createCrudTests({ adapter: sequelizeDbAdapter, setup })
