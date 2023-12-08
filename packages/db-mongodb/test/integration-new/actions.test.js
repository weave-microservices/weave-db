const { createBroker } = require('@weave-js/core');
const { DbMixinProvider } = require('@weave-js/db');
const MongoDbAdapter = require('../../lib/index');
const { mixin, actions } = DbMixinProvider();

require('../setup')('actions');

describe('should build my service only with defined actions', () => {
  const broker = createBroker({
    logger: {
      enabled: false
    }
  });

  broker.createService({
    name: 'test',
    mixins: mixin,
    adapter: MongoDbAdapter(),
    collectionName: 'actions_test',
    actions: {
      ...actions.count()
    }
  });

  beforeAll(() => broker.start());

  afterAll(() => broker.stop());

  it('should only define count action', () => {
    const actions = broker.registry.getActionList();
    expect(actions[0].name).toBe('test.count');

    broker.call('test.count').then(result => {
      expect(result).toBe(0);
    });
  });
});
