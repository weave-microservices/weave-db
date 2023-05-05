const { Weave, Errors } = require('@weave-js/core');
const { DbService } = require('../../lib/index');
const DbAdapter = require('../../lib/adapter');
const { DocumentNotFoundError } = require('../../lib/errors');
require('../setup')('crud');

const docs = [
  { name: 'Testfile.txt', content: 'Hello World', size: 2 },
  { name: 'Weave_doc.pdf', content: 'Weave documentation file', size: 220 },
  { name: 'WeaveLogo.jpeg', content: null, size: 344 },
  { name: 'Blabla.pdf', content: 'Blabla', size: 566 }
];

const equalAtLeast = (obj, origin) => {
  Object.keys(origin).map(key => {
    expect(origin[key]).toEqual(obj[key]);
  });
};

describe('db-service entity validation methods', () => {
  const broker = Weave({
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: DbService(),
    adapter: DbAdapter(),
    collectionName: 'crud_test',
    entitySchema: {
      name: 'string'
    }
  });

  beforeAll(() => broker.start());

  afterAll(() => broker.stop());

  it('should pass', () => {
    return broker.call('test.insert', { entity: docs[0] })
      .then(result => {
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        docs[0]._id = result._id;
        equalAtLeast(result, docs[0]);
      });
  });

  it('should insert multiple docs', () => {
    return broker.call('test.insert', { entity: {
      name: 123
    }}).catch(error => {
      const item = error.data[0];
      expect(item.message).toBe('The parameter "name" have to be a string.');
      expect(item.passed).toBe(123);
    });
  });
});

describe('db-service custom validation method', () => {
  const broker = Weave({
    logger: {
      enabled: false
    }
  });

  const service = broker.createService({
    name: 'test',
    mixins: DbService(),
    adapter: DbAdapter(),
    collectionName: 'crud_test',
    methods: {
      entityValidator: jest.fn((entity) => {
        return true;
      })
    }
  });

  beforeAll(() => broker.start());

  afterAll(() => broker.stop());

  it('should pass', () => {
    return broker.call('test.insert', { entity: {
      name: 'Kevin'
    }})
      .then(result => {
        expect(service.schema.methods.entityValidator).toHaveBeenCalledTimes(1);
      });
  });
});
