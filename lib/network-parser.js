const { getFileData } = require('./utils')

module.exports = {
  parse: data => data.map(o => {
    const { duration } = o
    const url = o.name
    const file = getFileData(url)
    return { duration, url, file }
  })
}
