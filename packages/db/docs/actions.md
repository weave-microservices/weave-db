# Actions

The weave DB mixin provider comes with some predefined service actions. With the options, you can control, which actions get loaded by default.

The mixin provider include the following actions:

- insert
- insertMany
- get
- find
- findOne
- findStream
- list
- count
- update
- remove


## Load all actions

With the option `loadAllActions` set to `true`, all actions are loaded to the generated mixin. 

```js
const { DbMixinProvider } = require('@weave-js/db')

const { mixin } = DbMixinProvider({
  entityName: 'actions_test',
  loadAllActions: true
})
```

## Load only specific actions

If you just need sp

```js
const { DbMixinProvider } = require('@weave-js/db')

const { mixin, action } = DbMixinProvider({
  entityName: 'users'
})


module.exports = {
    name: 'user',
    actions: {
        ...action.find() // Only load the find action on this user service
    }
}
```

> Why the spread operator?