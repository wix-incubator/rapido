const CDP = require('chrome-remote-interface')
const chromeLauncher = require('chrome-launcher')
const { TimelineParser, NetworkParser } = require('./parser')
const { isUrl, timlineFilter, killProcess } = require('./utils')

// Honsetly this is done just for the scoping
class Zariz {
  constructor () {
    // Configuration
    this.url = ''

    // Event arrays
    this._events = {
      timeline: [],
      network: []
    }

    // Chai plugin
    this.chaiZariz = this.chaiPlugin = require('./chai-plugin')(this)

    // Return the port of an already open Chrome instance
    this._resolveChrome = ({ port, pid }) => {
      const alternativeChrome = { port, kill: () => killProcess(pid) }
      return port ? Promise.resolve(alternativeChrome) : chromeLauncher.launch({ chromeFlags: ['--headless'] })
    }
  }

  load (url, options) {
    this.url = url
    // Launch a headless Chrome instance
    const config = Object.assign({}, { port: null, pid: null }, options)
    return this._resolveChrome(config).then(chrome => {
      // Connect to the newly opened chrome instance
      return Promise.all([chrome, CDP({ port: chrome.port })])
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
      // Navigate to the page
      return Promise.all([domains, client, chrome, Page.navigate({ url })])
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

  // Event getters
  get timeline () { return this._events.timeline }
  get network () { return NetworkParser.parse(this._events.network) }
}

module.exports = Zariz
