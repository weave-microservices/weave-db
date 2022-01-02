const { isObject } = require('@weave-js/utils')

const getEntityValidationSchema = (entitySchema, isArray = false) => {
  let entityValidationSchema
  if (entitySchema && isObject(entitySchema)) {
    if (isArray) {
      entityValidationSchema = {
        type: 'array', itemType: { type: 'object', props: entitySchema }
      }
    } else {
      entityValidationSchema = {
        type: 'object', props: entitySchema
      }
    }
  } else {
    if (isArray) {
      entityValidationSchema = { type: 'array', itemType: { type: 'any' }}
    } else {
      entityValidationSchema = { type: 'any' }
    }
  }

  return entityValidationSchema
}

module.exports = { getEntityValidationSchema }
