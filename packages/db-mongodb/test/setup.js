const fs = require('fs')
const path = require('path')
const files = ['test.db', 'threads.db', 'users.db', 'files.db']

const cwd = process.cwd()

module.exports = (filePrefix) => {
  // delete db files after testing
  files.forEach(file => fs.unlink(path.join(cwd, `${filePrefix}_${file}`), () => {}))

  afterAll(() => {
    try {
      files.forEach(file => fs.unlink(path.join(cwd, `${filePrefix}_${file}`), () => {}))
    } catch (e) {}
  })
}
