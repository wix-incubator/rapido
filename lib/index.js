const CDP = require('chrome-remote-interface')
const chromeLauncher = require('chrome-launcher')
const { TimelineParser, NetworkParser } = require('./parser')
const { parseScreenshot } = TimelineParser

module.exports = ({ url, port, writeFiles = false }) => {
  const config = Object.assign({}, { chromeFlags: ['--headless'] }, port ? { port } : {})
  return chromeLauncher.launch(config).then(chrome => {
    return Promise.all([chrome, CDP({ port: port || chrome.port })])
  }).then(([chrome, client]) => {
    const { Page, Tracing, Network } = client
    const events = []
    Tracing.dataCollected(({ value }) => events.push(...TimelineParser.parse(value, url, writeFiles)))

    const networkEvents = []
    Network.requestWillBeSent(netEvent => networkEvents.push(NetworkParser.parse(netEvent, 'requestWillBeSent')))
    Network.responseReceived(netEvent => networkEvents.push(NetworkParser.parse(netEvent, 'responseReceived')))
    Network.loadingFinished(netEvent => networkEvents.push(NetworkParser.parse(netEvent, 'loadingFinished')))

    return Promise.all([
      Page.enable(),
      Network.enable()
    ]).then(() => {
      return Page.navigate({ url })
    }).then(() => {
      return Tracing.start({ categories: 'devtools.timeline,disabled-by-default-devtools.screenshot', options: 'sampling-frequency=10000' })
    }).then(() => {
      return Page.loadEventFired()
    }).then(() => {
      return Tracing.end()
    }).then(() => {
      return Tracing.tracingComplete()
    }).then(() => {
      return client.close()
    }).then(() => {
      return chrome.kill()
    }).then(() => {
      const screenshots = events.filter(e => e.name === 'Screenshot').map((frame, i) => parseScreenshot(frame, i, url, writeFiles))
      return { screenshots, timeline: events.filter(e => e.name !== 'Screenshot'), networkEvents: NetworkParser.parse(networkEvents) }
    })
  })
}
