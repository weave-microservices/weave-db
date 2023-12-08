const { createBroker } = require('@weave-js/core');
const { createDbMixinProvider, InMemoryAdapter } = require('../../../lib/index');

require('../../setup')('actions');

describe('should build my service only with defined actions', () => {
  const { mixin, action } = createDbMixinProvider({
    adapter: InMemoryAdapter({ collectionName: 'actions_test' })
  });
  const broker = createBroker({
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: [mixin],
    actions: {
      // @ts-ignore
      ...action.count()
    }
  });

  beforeAll(() => broker.start());

  afterAll(() => broker.stop());

  it('should only define count action', () => {
    const actions = broker.registry.actionCollection.list({});
    expect(actions.length).toBe(1);
    expect(actions[0].name).toBe('test.count');

    return broker.call('test.count').then(result => {
      expect(result).toBe(0);
    });
  });
});

describe('should build an insert service', () => {
  const { mixin, action } = createDbMixinProvider({
    adapter: InMemoryAdapter({ collectionName: 'actions_test' })
  });
  const broker = createBroker({
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: [mixin],
    actions: {
      ...action.insert(),
      ...action.insertMany(),
      ...action.count()
    }
  });

  beforeAll(() => broker.start());

  afterAll(() => broker.stop());

  it('should insert a document', () => {
    const actions = broker.registry.actionCollection.list({});
    expect(actions.length).toBe(3);

    return broker.call('test.insert', { entity: {
      name: 'test',
      tel: '123345'
    }}).then(result => {
      expect(result._id).toBeDefined();
    });
  });

  it('should only define count action', () => {
    const actions = broker.registry.actionCollection.list({});
    expect(actions.length).toBe(3);

    return broker.call('test.count').then(result => {
      expect(result).toBe(1);
    });
  });
});
