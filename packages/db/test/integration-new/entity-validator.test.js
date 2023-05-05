const { Weave, Errors } = require('@weave-js/core');
const { createDbMixinProvider } = require('../../lib/index');
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

describe('db-service entity validation (strict mode - remove)', () => {
  const { mixin } = createDbMixinProvider({
    loadAllActions: true
  });

  const broker = Weave({
    nodeId: 'entity-validator',
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: mixin,
    entitySchema: {
      id: { type: 'string', primaryKey: true, internalName: '_id' },
      name: { type: 'string' },
      content: { type: 'string' },
      size: {
        type: 'number'
      }
    },
    settings: {
      collectionName: 'crud_test'
    }
  });

  beforeAll(() => broker.start());

  afterAll(() => broker.stop());

  it('should pass', () => {
    return broker.call('test.insert', { entity: docs[0] })
      .then((result) => {
        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        docs[0]._id = result._id;
        equalAtLeast(result, docs[0]);
      });
  });

  it('should fail', () => {
    return broker.call('test.insert', { entity: {
      name: 123
    }}).catch(error => {
      const item = error.data;
      expect(item[0].message).toBe('The parameter "entity.name" have to be a string.');
      expect(item[0].passed).toBe(123);
      expect(item[1].message).toBe('The Field "entity.content" is required.');
      expect(item[2].message).toBe('The Field "entity.size" is required.');
    });
  });

  it('should remove superfluous parameters that have not been defined. (strict mode - remove)', () => {
    const entity = {
      ...docs[0],
      userId: 10,
      address: {
        street: 'abc'
      }
    };
    return broker.call('test.insert', { entity })
      .then(result => {
        expect(result.userId).toBeUndefined();
        expect(result.address).toBeUndefined();
      });
  });
});

describe('db-service entity validation (strict mode - error)', () => {
  const { mixin } = createDbMixinProvider({
    loadAllActions: true,
    entitySchema: {
      id: { type: 'string', primaryKey: true, internalName: '_id' },
      name: { type: 'string' },
      content: { type: 'string' },
      size: {
        type: 'number'
      },
      settings: {
        type: 'object', props: {
          enabled: { type: 'boolean' },
          colors: { type: 'string' }
        },
        optional: true
      }
    },
    validatorOptions: {
      strict: true,
      strictMode: 'error'
    }
  });

  const broker = Weave({
    nodeId: 'entity-validator2',
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: mixin,
    settings: {
      collectionName: 'crud_test'
    }
  });

  beforeAll(() => broker.start());

  afterAll(() => broker.stop());

  it('should throw an error if parameters are passed that have not been defined. (strict mode - error)', () => {
    const entity = {
      ...docs[0],
      userId: 10,
      address: {
        street: 'abc'
      }
    };
    return broker.call('test.insert', { entity })
      .catch((error) => {
        const validationResult = error.data[0];
        expect(error).toBeInstanceOf(Errors.WeaveParameterValidationError);
        expect(validationResult.action).toBe('test.insert');
        expect(validationResult.message).toBe('The object "entity" contains forbidden keys: "_id, userId, address".');
        expect(validationResult.expected).toBe('name, content, size, settings');
        expect(validationResult.passed).toBe('_id, userId, address');
        expect(validationResult.field).toBe('entity');
      });
  });

  it('should throw an error if parameters are passed that have not been defined (nested). (strict mode - error)', () => {
    const entity = {
      ...docs[0],
      settings: {
        group: 'admin'
      }
    };
    return broker.call('test.insert', { entity })
      .catch((error) => {
        expect(error).toBeInstanceOf(Errors.WeaveParameterValidationError);
        expect(error.data[0].type).toBe('required');
        expect(error.data[0].message).toBe('The Field "entity.settings.enabled" is required.');
        expect(error.data[0].field).toBe('entity.settings.enabled');

        expect(error.data[1].type).toBe('required');
        expect(error.data[1].message).toBe('The Field "entity.settings.colors" is required.');
        expect(error.data[1].field).toBe('entity.settings.colors');

        expect(error.data[2].type).toBe('objectStrict');
        expect(error.data[2].message).toBe('The object "entity.settings" contains forbidden keys: "group".');
        expect(error.data[2].expected).toBe('enabled, colors');
        expect(error.data[2].field).toBe('entity.settings');
      });
  });
});

// describe('db-service custom validation method', () => {
//   const broker = Weave({
//     logger: {
//       enabled: false
//     }
//   })

//   const service = broker.createService({
//     name: 'test',
//     mixins: mixin,
//     adapter: DbAdapter(),
//     collectionName: 'crud_test',
//     methods: {
//       entityValidator: jest.fn((entity) => {
//         return true
//       })
//     }
//   })

//   beforeAll(() => broker.start())

//   afterAll(() => broker.stop())

//   it('should pass', () => {
//     return broker.call('test.insert', { entity: {
//       name: 'Kevin'
//     }})
//       .then(result => {
//         expect(service.schema.methods.entityValidator).toHaveBeenCalledTimes(1)
//       })
//   })
// })
