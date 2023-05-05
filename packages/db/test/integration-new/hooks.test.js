const { Weave, Errors } = require('@weave-js/core');
const { createDbMixinProvider } = require('../../lib/index');
const { EntityNotFoundError } = require('../../lib/errors');
require('../setup')('hooks');

const { mixin } = createDbMixinProvider({
  loadAllActions: true
});

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

describe('db-service CRUD methods', () => {
  let flow = [];
  const broker = Weave({
    nodeId: 'hooks',
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: mixin,
    collectionName: 'hooks_test',
    entityInserted (doc, a) {
      flow.push('inserted');
    },
    entityUpdated () {
      flow.push('updated');
    },
    entityRemoved () {
      flow.push('removed');
    }
  });

  beforeEach(() => {
    flow = [];
  });

  beforeAll(() => {
    return broker.start();
  });

  afterAll(() => {
    return broker.stop();
  });

  it('should insert a new doc', (done) => {
    broker.call('test.insert', { entity: docs[0] })
      .then(result => {
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        docs[0]._id = result._id;
        equalAtLeast(result, docs[0]);
        expect(flow.join(',')).toBe('inserted');
        done();
      });
  });

  it('should insert multiple docs', (done) => {
    broker.call('test.insertMany', { entities: [docs[1], docs[3], docs[2]] })
      .then(results => {
        expect(results).toBeDefined();
        expect(results.length).toBe(3);
        expect(results[0]._id).toBeDefined();
        expect(results[1]._id).toBeDefined();
        expect(results[2]._id).toBeDefined();

        docs[1]._id = results[0]._id;
        docs[3]._id = results[1]._id;
        docs[2]._id = results[2]._id;

        equalAtLeast(results[0], docs[1]);
        equalAtLeast(results[1], docs[3]);
        equalAtLeast(results[2], docs[2]);
        expect(flow.join(',')).toBe('inserted');
        done();
      });
  });

  it('should throw an error on insert if parameter "entity" is missing.', (done) => {
    broker.call('test.insert', {})
      .catch(error => {
        expect(error).toBeInstanceOf(Errors.WeaveParameterValidationError);
        expect(error.code).toBe(422);
        expect(flow.join(',')).toBe('');
        done();
      });
  });

  it('should return the number of docs.', (done) => {
    broker.call('test.count')
      .then(result => {
        expect(result).toBeGreaterThanOrEqual(4);
        done();
      });
  });

  it('should return the number of docs by condition.', (done) => {
    broker.call('test.count', { query: { _id: docs[0]._id }})
      .then(result => {
        expect(result).toBe(1);
        done();
      });
  });

  it('should return a doc by ID.', (done) => {
    broker.call('test.get', { id: docs[0]._id })
      .then(result => {
        equalAtLeast(result, docs[0]);
        done();
      });
  });

  it('should return multiple docs by ID.', (done) => {
    broker.call('test.get', { id: [docs[0]._id, docs[2]._id] })
      .then(results => {
        expect(results.length).toBe(2);
        equalAtLeast(results[0], docs[0]);
        equalAtLeast(results[1], docs[2]);
        done();
      });
  });

  it('should throw an error if a document does not exist.', (done) => {
    broker.call('test.get', { id: 99999999999 })
      .catch(error => {
        expect(error).toBeInstanceOf(EntityNotFoundError);
        done();
      });
  });

  it('should find docs by query.', (done) => {
    broker.call('test.find', { query: { _id: docs[1]._id }})
      .then(results => {
        expect(results.length).toBe(1);
        equalAtLeast(results[0], docs[1]);
        done();
      })
      .catch(error => {
        expect(error).toBeInstanceOf(EntityNotFoundError);
      });
  });

  it('should find a single doc by query.', (done) => {
    broker.call('test.findOne', { query: { name: 'Weave_doc.pdf' }})
      .then(result => {
        equalAtLeast(result, docs[1]);
        done();
      });
  });

  it('should find docs paginated.', (done) => {
    broker.call('test.list')
      .then(results => {
        expect(results.page).toBe(1);
        expect(results.pageSize).toBe(10);
        expect(results.rows.length).toBe(4);
        expect(results.totalPages).toBe(1);
        expect(results.totalRows).toBe(4);
        done();
      });
  });

  it('should find docs paginated with query.', (done) => {
    broker.call('test.list', { query: { name: 'Testfile.txt' }})
      .then(results => {
        expect(results.page).toBe(1);
        expect(results.pageSize).toBe(10);
        expect(results.rows.length).toBe(1);
        expect(results.totalPages).toBe(1);
        expect(results.totalRows).toBe(1);
        equalAtLeast(results.rows[0], docs[0]);
        done();
      });
  });

  it('should find docs paginated with query.', (done) => {
    broker.call('test.list', { pageSize: 1, page: 2 })
      .then(results => {
        expect(results.page).toBe(2);
        expect(results.pageSize).toBe(1);
        expect(results.rows.length).toBe(1);
        expect(results.totalPages).toBe(4);
        expect(results.totalRows).toBe(4);
        // equalAtLeast(results.rows[0], docs[1])
        done();
      });
  });

  it('should update a doc.', (done) => {
    broker.call('test.find', { query: { _id: docs[1]._id }})
      .then(results => {
        expect(results.length).toBe(1);
        equalAtLeast(results[0], docs[1]);
        done();
      });
  });
});
