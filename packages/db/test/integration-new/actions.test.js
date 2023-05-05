const { createBroker } = require('@weave-js/core');
const { createDbMixinProvider } = require('../../lib/index');

const { mixin, action } = createDbMixinProvider({
  entityName: 'actions_test'
});

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
