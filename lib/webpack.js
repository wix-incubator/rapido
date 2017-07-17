const path = require('path')

// Sets the default webpack config path to the current directory's webpack config file
const defaultConfig = path.join(process.cwd(), 'webpack.config.js')

const parseStats = info => {
  const assets = info.assets.reduce((prev, curr) => {
    prev[curr.name] = +((curr.size / 1000).toFixed(2))
    return prev
  }, {})
  const chunks = info.chunks.reduce((prev, curr) => {
    prev[curr.hash] = {
      names: curr.names,
      size: +((curr.size / 1000).toFixed(2))
    }
    return prev
  }, {})
  const modules = info.modules.reduce((prev, curr) => {
    prev[curr.identifier] = +((curr.size / 1000).toFixed(2))
    return prev
  }, {})
  return { assets, chunks, modules }
}

const run = (webpack, configPath = defaultConfig) => {
  // We assume that the configuration is either a path string or an actual configuration object
  const config = typeof configPath === 'string'
    ? require(configPath)
    : configPath

  return new Promise((resolve, reject) => {
    const maskedConfig = Object.keys(config).reduce((prev, curr) => {
      if (config[curr] && curr !== 'filesystem') prev[curr] = config[curr]
      return prev
    }, {})
    const compiler = webpack(maskedConfig)
    // Add an option to set a custom filesystem (mainly for tests)
    if (config.filesystem) compiler.outputFileSystem = config.filesystem

    return compiler.run((err, stats) => {
      if (err) return reject(err)
      const info = stats.toJson({ source: false, chunkOrigins: true })
      if (stats.hasErrors()) return reject(new Error(info.errors[0]))
      const parsedStats = parseStats(info)
      return resolve(parsedStats)
    })
  })
}

module.exports = webpack => configPath => run(webpack, configPath)
