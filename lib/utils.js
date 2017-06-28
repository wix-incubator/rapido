const { parse } = require('url')

const getFileData = fullURL => {
  const pathname = parse(fullURL).pathname.split('/')
  return { path: pathname.slice(0, -1).join('/'), name: pathname[pathname.length - 1] }
}

module.exports = {
  getFileData
}
