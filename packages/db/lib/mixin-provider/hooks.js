const { WeaveParameterValidationError } = require('@weave-js/core/lib/errors');
const { isObject } = require('@weave-js/utils');
const NeDbAdapter = require('../adapter');
const { processEntitySchema } = require('./utils/processEntitySchema');

/**
 * Create service hooks
 * @param {import('./createDbMixinProvider').DBMixinOptions} mixinOptions Mixin options
 * @returns {Object} Hooks
 */
function createHooks (mixinOptions) {
  return {
    created () {
      const self = this;
      processEntitySchema(self, mixinOptions);

      this.adapter = mixinOptions.adapter;

      if (!this.adapter) {
        throw new Error('No adapter defined!');
      }

      this.adapter.init(this.runtime.broker, this);
      this.log.info(`Weave Database module initialized for service "${this.name}"`);

      // Wrap up entity validation
      // if (this.runtime.validator && this.schema.entitySchema && isObject(this.schema.entitySchema)) {
      //   const validate = this.runtime.validator.compile(this.schema.entitySchema);

      //   // wrap entity validator function and attach to service
      //   this.entityValidator = (entity) => {
      //     const result = validate(entity);

      //     if (result === true) {
      //       return Promise.resolve();
      //     }

      //     return Promise.reject(new WeaveParameterValidationError('Entity validation error!', result));
      //   };
      // }
    },
    started () {
      // todo: validate adapter.
      return new Promise((resolve) => {
        const tryConnect = () => {
          this.connect()
            .then((adapterResult) => {
              resolve(adapterResult);
            }).catch(error => {
              if (mixinOptions.reconnectOnError) {
                setTimeout(() => {
                  self.log.error('Connection error', error);
                  self.log.info('Trying to reconnect...');
                  tryConnect();
                }, mixinOptions.reconnectTimeout);
              }
            });
        };
        tryConnect();
      });
    },
    stopped () {
      return this.disconnect();
    }
  };
}

module.exports = { createHooks };
