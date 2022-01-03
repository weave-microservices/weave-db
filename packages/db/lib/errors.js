/*
 * Author: Kevin Ries (kevin@fachw3rk.de)
 * -----
 * Copyright 2019 Fachwerk
 */

const { WeaveError } = require('@weave-js/core').Errors

class EntityNotFoundError extends WeaveError {
  constructor (id) {
    super('Entity not found', 404, 'ENTITY_NOT_FOUND', { id })
  }
}

class DocumentNotFoundError extends WeaveError {
  constructor (id) {
    super('Document not found', 404, null, { id })
  }
}

module.exports = {
  EntityNotFoundError,
  DocumentNotFoundError
}
