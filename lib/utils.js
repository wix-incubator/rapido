const { parse } = require('url')
const { execSync } = require('child_process')

const getFileData = fullURL => {
  const pathname = parse(fullURL).pathname.split('/')
  return { path: pathname.slice(0, -1).join('/'), name: pathname[pathname.length - 1] }
}

const shouldRunOn = (obj, utils) => {
  const action = utils.flag(obj, 'rapido.action')
  return action && (action === 'load' || utils.flag(obj, 'rapido.timelineName'))
}

const timlineFilter = (timelineName, comparisonValue) => {
  return f => {
    const findValue = isUrl(comparisonValue) ? f.fullURL === comparisonValue : f.script === comparisonValue
    return f.name === timelineName && findValue
  }
}

const isUrl = str => !!parse(str).protocol

const killProcess = pid => new Promise((resolve, reject) => {
  if (!pid) return resolve()
  const isWindows = process.platform === 'win32'
  try {
    (isWindows ? execSync(`taskkill /pid ${pid} /T /F`) : process.kill(pid))
    resolve()
  } catch (err) { reject(err) }
})

module.exports = {
  isUrl,
  getFileData,
  shouldRunOn,
  killProcess,
  timlineFilter
}
