const { compact, clone, isFunction, promisify, isString, isObject } = require('@weave-js/utils');

const processEntitySchemaObject = (service, entitySchema) => {
  return Object
    .entries(entitySchema)
    .map(([name, schema]) => {
      console.log(name);
      if (schema === false) {
        return;
      }

      const property = clone(schema);
      console.log(property);

      if (property.resolver) {
        if (isString) {
          property.resolver = {
            action: property.resolver
          };
        } else if (isFunction(property.resolver)) {
          property.resolver = {
            handler: promisify(property.resolver)
          };
        } else if (isObject(property.resolver)) {
          if (!property.resolver.action && !property.resolver.handler) {
            throw new Error('Invalid resolver definition. "action" and "handler"');
          }
        } else {
          // !!!todo: pass service to access the service name
          throw new Error(`Invalid 'populate' definition in '${service.name}' service. It should be a 'Function', 'String' or 'Object'.`);
        }
      }

      return property;
    });
};

const processEntitySchema = (service, mixinOptions) => {
  if (mixinOptions.fields) {
    service.log.debug('Process entity schema...');
    service.$entity = processEntitySchemaObject(service, mixinOptions.fields);
  }
};

module.exports = { processEntitySchema };
