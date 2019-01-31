const { WeaveError } = require('@weave-js/core').Errors

class DocumentNotFoundError extends WeaveError {
    constructor (id) {
        super('Document not found', 404, null, { id })
    }
}

module.exports = {
    DocumentNotFoundError
}
