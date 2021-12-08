const { createBroker } = require('@weave-js/core')

const broker = createBroker({
    nodeId: 'test'
})

broker.createService({
    name: 'test',
    mixins: [requirt]
})