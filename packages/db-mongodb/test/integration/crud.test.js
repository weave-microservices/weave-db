const MongoDbAdapter = require('../../lib');
const { createBroker } = require('@weave-js/core');
const { DbMixin } = require('@weave-js/db');

const connectionString = 'mongodb://localhost:27017/weave-db-test';

function idIsString (entity) {
  expect(typeof entity._id).toBe('string');
}

describe('MongoDB adapter', () => {
  const broker = createBroker({
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: DbMixin(),
    adapter: MongoDbAdapter({
      url: connectionString,
      autoHint: true
    }),
    collectionName: 'crud_test',
    actions: {
      clear () {
        return this.adapter.clear({});
      }
    },
    async started () {
      await this.adapter.collection.createIndex({ name: 1, age: 1 });
      await this.adapter.collection.createIndex({ name: 1 });
    }
  });

  beforeAll(() => broker.start());

  afterAll(async () => {
    await broker.call('test.clear');
    broker.stop();
  });

  it('should connect to the database', async () => {
    const insertResult = await broker.call('test.insert', { entity: { name: 'Test' }});
    idIsString(insertResult);
    const findResult = await broker.call('test.find', { options: { hint: { name: 1 }}});
    expect(findResult.length).toBe(1);
    findResult.forEach(idIsString);
    const findOneResult = await broker.call('test.findOne', { query: { _id: insertResult._id }});
    idIsString(findOneResult);
    const countResult = await broker.call('test.count', {
      query: { name: 'Test' }
    });
    expect(countResult).toBe(1);
    console.log(insertResult);
    return await broker.call('test.clear');
  });
});
