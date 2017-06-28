const CDP = require('chrome-remote-interface')
const chromeLauncher = require('chrome-launcher')
const { TimelineParser, NetworkParser } = require('./parser')

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
    this.chaiZariz = require('./chai-plugin')(this)
  }

  load (url) {
    const { writeFiles } = this
    this.url = url
    // Launch a headless Chrome instance
    return chromeLauncher.launch({
      chromeFlags: ['--headless']
    }).then(chrome => {
      // Connect to the newly opened chrome instance
      return Promise.all([chrome, CDP({ port: chrome.port })])
    }).then(([chrome, client]) => {
      const { Page, Tracing, Network } = client

      // Collect the data from the timeline tracing and the network and push it to the correct array
      Tracing.dataCollected(({ value }) => this._events.timeline.push(...TimelineParser.parse(value, url, writeFiles)))
      Network.requestWillBeSent(netEvent => this._events.network.push(NetworkParser.parse(netEvent, 'requestWillBeSent')))
      Network.responseReceived(netEvent => this._events.network.push(NetworkParser.parse(netEvent, 'responseReceived')))
      Network.loadingFinished(netEvent => this._events.network.push(NetworkParser.parse(netEvent, 'loadingFinished')))

      return Promise.all([
        { Page, Tracing, Network },
        client,
        chrome,
        Page.enable(),
        Network.enable()
      ])
    }).then(([domains, client, chrome]) => {
      const { Page } = domains
      // Navigate to the page
      return Promise.all([domains, client, chrome, Page.navigate({ url })])
    }).then(([{ Page, Network, Tracing }, client, chrome]) => {
      // Supply the functions to start and end the data tracing (for more control)
      const startTracing = ({ isOnLoad = false }) => {
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
          return client.close()
        }).then(() => {
          return chrome.kill()
        })
      }

      // Supply the remote chrome port for other remote chrome stuff
      return { port: chrome.port, startTracing }
    })
  }

  // Event getters
  get timeline () { return this._events.timeline }
  get networkEvents () { return NetworkParser.parse(this._events.network) }
}

module.exports = Zariz
