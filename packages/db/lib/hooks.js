const { WeaveParameterValidationError } = require('@weave-js/core/lib/errors')
const { isObject } = require('@weave-js/utils')
const NeDbAdapter = require('./adapter')

module.exports.createHooks = (mixinOptions) => {
  return {
    created () {
      if (this.schema.adapter) {
        this.adapter = this.schema.adapter
      } else {
        this.adapter = NeDbAdapter()
      }

      this.adapter.init(this.runtime, this)
      this.log.info(`Weave Database module initialized for service "${this.name}"`)

      // Wrap up entity validation
      if (this.runtime.validator && this.schema.entitySchema && isObject(this.schema.entitySchema)) {
        const validate = this.runtime.validator.compile(this.schema.entitySchema)

        // wrap entity validator function and attach to service
        this.entityValidator = (entity) => {
          const result = validate(entity)

          if (result === true) {
            return Promise.resolve()
          }

          return Promise.reject(new WeaveParameterValidationError('Entity validation error!', result))
        }
      }
    },
    started () {
      // todo: validate adapter.
      const self = this
      return new Promise((resolve) => {
        const connecting = () => {
          this.connect()
            .then((adapterResult) => {
              resolve(adapterResult)
            }).catch((error) => {
              setTimeout(() => {
                self.log.error('Connection error', error)
                self.log.info('Trying to reconnect...')
                connecting()
              }, 2000)
            })
        }
        connecting()
      })
    },
    stopped () {
      return this.disconnect()
    }
  }
}
