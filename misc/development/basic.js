const { createBroker } = require('@weave-js/core');
const { createDbMixinProvider } = require('../../packages/db/lib');
const repl = require('@weave-js/repl');

const broker = createBroker();

const { mixin, action } = createDbMixinProvider({
    entityName: 'actions_test'
  });

broker.createService({
    name: 'db',
    mixins: mixin,
    actions: {
        ...action.count(),
        ...action.find(),
        ...action.findOne(),
        ...action.insert(),
    }
});

broker.start().then(() => repl(broker));