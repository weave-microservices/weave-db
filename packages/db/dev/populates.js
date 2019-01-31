
const { Weave } = require('@weave-js/core')
const WeaveDbMixin = require('../lib')

const broker = Weave({
    nodeId: 'populates - 1'
})

broker.createService({
    name: 'test',
    mixins: [WeaveDbMixin()],
    model: {
        name: 'tests'
    },
    afterConnect () {
        this.adapter.count()
            .then(res => {
                if (res === 0) {
                    this.adapter.insert({
                        name: 'kevin'
                    })
                }
            })
    }
})

broker.start()
