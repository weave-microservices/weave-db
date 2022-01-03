# Usage

```js
const { createBroker, Errors } = require('@weave-js/core')
const { DbMixinProvider } = require('@weave-js/db')

const broker = createBroker({
    nodeId: 'customer'
})

const { mixin, action } = DbMixinProvider({
    loadAllActions: true
})

broker.createService({
    name: 'test',
    mixins: mixin,
    collectionName: 'crud_test',
    actions: {
        ...action.find(),
        ...action.get({
            visibility: 'private'
        })
    }
})

broker.start()
```