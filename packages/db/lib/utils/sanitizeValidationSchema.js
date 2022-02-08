
const { omit } = require('@weave-js/utils')

const generateValidationSchemaItem = (validationSchemaItem, options = {}) => {
  const schema = omit(validationSchemaItem, [
    'internalName',
    'internalType',
    'readonly'
  ])

  // Readonly fields are forbidden, so we need to remove the field from the validation schema.
  if (schema.readonly) {
    return null
  }

  // Remove primary key from insert actions.
  if (schema.primaryKey && options.action === 'insert') {
    return null
  }

  return schema
}

module.exports = { generateValidationSchemaItem }
