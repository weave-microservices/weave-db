const { isObject } = require('@weave-js/utils');
const { generateValidationSchemaItem } = require('./sanitizeValidationSchema');

const getEntityValidationSchema = (entitySchemaFields, options = { isArray: false }) => {
  const validationSchema = {};

  if (!entitySchemaFields || Object.keys(entitySchemaFields).length === 0) {
    return { type: 'any' };
  }

  if (entitySchemaFields) {
    Object.entries(entitySchemaFields).map(([fieldName, fieldSchema]) => {
      if (fieldSchema === false) {
        return;
      }

      const schema = generateValidationSchemaItem(fieldSchema, options);
      if (schema !== null) {
        validationSchema[fieldName] = schema;
      }
    });
  }

  let wrappedValidationSchema;
  if (validationSchema && isObject(validationSchema)) {
    if (options.isArray) {
      wrappedValidationSchema = {
        type: 'array', itemType: { type: 'object', props: validationSchema }
      };
    } else {
      wrappedValidationSchema = {
        type: 'object', props: validationSchema
      };
    }
  } else {
    if (options.isArray) {
      wrappedValidationSchema = { type: 'array', itemType: { type: 'any' }};
    } else {
      wrappedValidationSchema = { type: 'any' };
    }
  }

  return wrappedValidationSchema;
};

module.exports = { getEntityValidationSchema };
