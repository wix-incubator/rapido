const CDP = require('chrome-remote-interface')
const chromeLauncher = require('chrome-launcher')

const { isUrl, timlineFilter, killProcess, getRemoteDebuggingPort } = require('./utils')
const { TimelineParser, NetworkParser } = require('./parser')
const makeWebpackRunner = require('./webpack')

// Honsetly this is done just for the scoping
class Rapido {
  constructor () {
    // Event arrays
    this._events = {
      timeline: [],
      network: []
    }

    // Webpack stats
    this._webpackStats = {
      assets: {},
      chunks: {},
      modules: {}
    }

    // Chai plugin
    this.rapidoChai = this.chaiPlugin = require('./chai-plugin')(this)

    // Selenium integration
    this.seleniumDriver = null

    // Webpack integration
    this.webpack = null

    const promisedPort = (port, pid) => Promise.resolve({ port: () => Promise.resolve(port), kill: () => killProcess(pid) })
    const promisedSelenium = (driver, port) => Promise.resolve({ port: () => Promise.resolve(port), kill: () => driver.quit() })
    const promisedChromeLaunch = () => chromeLauncher.launch({ chromeFlags: ['--headless'] }).then(({ port, kill }) => ({ port: () => Promise.resolve(port), kill }))

    // Return the port of an already open Chrome instance, open a new one or return the port of a Selenium WebDriver instance
    this._resolveChrome = ({ port, pid }) => {
      if (this.seleniumDriver) return promisedSelenium(this.seleniumDriver, port)
      else if (port) return promisedPort(port, pid)
      else return promisedChromeLaunch()
    }
  }

  getSeleniumPort (driver) {
    return getRemoteDebuggingPort(driver)
  }

  load (url, options) {
    // If Rapido is using Selenium, the first argument a Selenium instance
    if (typeof url !== 'string') this.seleniumDriver = url
    // Launch a headless Chrome instance
    const config = Object.assign({}, { port: null, pid: null }, options)
    return this._resolveChrome(config).then(chrome => {
      // Connect to the newly opened chrome instance
      return Promise.all([chrome.port(), chrome])
    }).then(([port, chrome]) => {
      return Promise.all([chrome, CDP({ port })])
    }).then(([chrome, client]) => {
      const { Page, Tracing, Runtime } = client

      // Collect the data from the timeline tracing and the network and push it to the correct array
      Tracing.dataCollected(({ value }) => this._events.timeline.push(...TimelineParser.parse(value, url)))

      return Promise.all([
        { Page, Tracing, Runtime },
        client,
        chrome,
        Page.enable()
      ])
    }).then(([domains, client, chrome]) => {
      const { Page } = domains
      // Navigate to the page if selenium is not used
      const navigate = () => this.seleniumDriver ? Promise.resolve() : Page.navigate({ url })
      return Promise.all([domains, client, chrome, navigate()])
    }).then(([{ Page, Tracing, Runtime }, client, chrome]) => {
      // Map the name of a property to its value
      const mapNameToValue = (prev, curr) => {
        const { name, value } = curr
        prev[name] = value.value
        return prev
      }

      // Get the load data from the brwoser's performance API, since this is not achieveable using the devtools protocol
      const getDataFromRuntime = () => {
        const expression = 'performance.getEntriesByType(\'resource\').map(o => ({ name: o.name, duration: o.duration }))'
        if (!this.seleniumDriver) {
          return Runtime.evaluate({ expression }).then(({ result }) => {
            const { objectId } = result
            return Runtime.getProperties({ objectId, ownProperties: true })
          }).then(({ result }) => {
            const objectIds = result.filter(n => !isNaN(+n.name)).map(o => o.value.objectId)
            const actions = objectIds.map(objectId => Runtime.getProperties({ objectId, ownProperties: true }))
            return Promise.all(actions)
          }).then((results) => {
            return results.map(o => {
              return o.result
                .filter(k => k.name !== '__proto__')
                .reduce(mapNameToValue, {})
            })
          })
        } else {
          return this.seleniumDriver.executeScript(`const perfs = ${expression}; return perfs`)
        }
      }

      // Supply the functions to start and end the data tracing (for more control)
      const startTracing = ({ isOnLoad = true }) => {
        return Tracing.start({ categories: 'devtools.timeline' }).then(() => {
          return isOnLoad ? Page.loadEventFired() : Promise.resolve()
        }).then(() => {
          return { endTracing }
        })
      }

      const endTracing = () => {
        return Tracing.end().then(() => {
          return Tracing.tracingComplete()
        }).then(() => {
          return getDataFromRuntime()
        }).then((results) => {
          this._events.network = results
          return client.close()
        }).then(() => {
          return chrome.kill()
        }).then(() => {
          return { timeline: this.timeline, network: this.network }
        })
      }

      // Supply the remote chrome port for other remote chrome stuff
      return { port: chrome.port, startTracing }
    })
  }

  // Get load / evaluation / compilation time of resources easily
  loadTimeOf (resource) { return this.network.filter(ne => isUrl(resource) ? ne.url === resource : ne.file.name === resource)[0].duration }
  evaluationTimeOf (script) { return this.timeline.filter(timlineFilter('EvaluateScript', script))[0].duration }
  compilationTimeOf (script) { return this.timeline.filter(timlineFilter('V8Compile', script))[0].duration }

  // Webpack functions
  runBuild (config) {
    const { webpack } = this
    const webpackRunner = makeWebpackRunner(webpack)
    return webpackRunner(config).then(({ assets, chunks, modules }) => {
      this._webpackStats.assets = assets
      this._webpackStats.chunks = chunks
      this._webpackStats.modules = modules
      return { assets, chunks, modules }
    })
  }

  assetSize (asset) {
    const key = Object.keys(this.assets).filter(a => a === asset)[0]
    return this.assets[key]
  }

  moduleSize (mod) {
    const hasPath = mod.includes(require('path').sep)
    const key = Object.keys(this.modules).filter(a => {
      if (hasPath) return a === mod
      const file = a.split(require('path').sep).reverse()[0]
      return a === file
    })[0]
    return this.modules[key]
  }

  // TODO - Add support for chunk size

  // Event and webpack getters
  get timeline () { return this._events.timeline }
  get network () { return NetworkParser.parse(this._events.network) }
  get assets () { return this._webpackStats.assets }
  get chunks () { return this._webpackStats.chunks }
  get modules () { return this._webpackStats.modules }
}

module.exports = Rapido
