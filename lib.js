const CDP = require('chrome-remote-interface')
const { URL } = require('url')

const parseValue = value => value.filter(k => k.name === 'EvaluateScript' && k.args.data.url).map(frame => {
  const { url, lineNumber, columnNumber } = frame.args.data
  const fullURL = url // The full URL of the script
  const duration = frame.dur / 1000 // Parsing duration in miliseconds
  const location = { lineNumber, columnNumber } // The location of the inline script in the index.html
  const pathname = (new URL(fullURL)).pathname.split('/') // The pathname of the script's URL
  const file = { path: pathname.slice(0, -1).join('/'), name: pathname[pathname.length - 1] }
  const script = file.name || `inline:${location.lineNumber}:${location.columnNumber}` // The filename of the script or its place in the page

  return { fullURL, duration, script, path: file.path || '/' }
})

module.exports = url => new Promise((resolve, reject) => {
  const chrome = CDP(async client => {
    const { Page, Tracing } = client

    const events = []
    Tracing.dataCollected(({ value }) => events.push(...parseValue(value)))

    await Page.enable()
    await Page.navigate({ url: 'http://wix.com' })
    await Tracing.start({ categories: 'devtools.timeline', options: 'sampling-frequency=10000' })
    await Page.loadEventFired()
    await Tracing.end()
    await Tracing.tracingComplete()
    resolve(events)
    client.close()
  })

  chrome.on('error', reject)
})
