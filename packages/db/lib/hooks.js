const { WeaveParameterValidationError } = require('@weave-js/core/lib/errors')
const { isObject } = require('@weave-js/utils')
const NeDbAdapter = require('./adapter')

/**
 * Create service hooks
 * @param {import('./db-mixin-provider').DBMixinOptions} mixinOptions Mixin options
 * @returns {Object} Hooks
 */
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
        const check = this.runtime.validator.compile(this.schema.entitySchema)

        // wrap entity validator function and attach to service
        this.entityValidator = (entity) => {
          const result = check(entity)

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
        const tryConnect = () => {
          this.connect()
            .then((adapterResult) => {
              resolve(adapterResult)
            }).catch(error => {
              if (mixinOptions.reconnectOnError) {
                setTimeout(() => {
                  self.log.error('Connection error', error)
                  self.log.info('Trying to reconnect...')
                  tryConnect()
                }, mixinOptions.reconnectTimeout)
              }
            })
        }
        tryConnect()
      })
    },
    stopped () {
      return this.disconnect()
    }
  }
}
