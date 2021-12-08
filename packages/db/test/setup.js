const fs = require('fs')
module.exports = (filePrefix) => {
  // delete db files after testing

  afterAll(() => {
    try {
      const files = ['actions.db', 'test.db', 'threads.db', 'users.db', 'files.db']
      files.forEach(file => fs.unlink(`${process.cwd()}/${filePrefix}_${file}`, () => {}))
    } catch (e) {}
  })
}
