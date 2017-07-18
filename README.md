<h1 align="center">
  Rapido
</h1>

<p align="center">
  <a href="https://github.com/standard/standard" alt="JavaScript Style Guide">
    <img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" />
  </a>
</p>

> A site performance test kit, built using Chrome's DevTools.

## Features
 - Measures the load time of resources requested by the page
 - Measures the evaluation and compile time of the page's scripts
 - Easy to use [Chai](http://chaijs.com) plugin for incorporating performance testing into your testing workflow
 - More to come!

## Install
```bash
npm install --save-dev rapidojs
```

## Example usage
Without the chai plugin:
```javascript
const Rapido = require('rapidojs')
const path = require('path')
const fs = require('fs')

Rapido.load(url).then(client => {
  return client.startTracing()
}).then(client => {
  return client.endTracing()
}).then(({ timeline, network }) => {
  const st = obj => JSON.stringify(obj, null, 2)
  fs.writeFileSync(path.join(__dirname, 'script-timeline.json'), st(timeline))
  fs.writeFileSync(path.join(__dirname, 'network-data.json'), st(network))
})
```

With the chai plugin:
```javascript
const chai = require('chai')
const Rapido = require('rapidojs')

chai.use(Rapido.chaiPlugin)

/**
 * If chaiPlugin is too much of a generic name for
 * you and you like deconstruction, this is also doable:
 */
const { rapidoChai } = Rapido
chai.use(rapidoChai)

const { expect } = chai

describe('Load performance testing', () => {
  before(() => {
    return Rapido.load('http://example.com').then(client => {
      return client.startTracing()
    }).then(client => {
      return client.endTracing()
    })
  })

  it('should load a.js under 500ms and evaluate it under 100ms', () => {
    expect('a.js').to.load.under(500)
    expect('a.js').to.evaluate.under(100)
  })

  it('should load b.js and evaluate it under 600ms', () => {
    expect('b.js').to.load()
    expect('b.js').to.evaluate.under(600)
  })

  it('should load the roboto font', () => {
    expect('roboto.ttf').to.load()
    expect('roboto.otf').to.load()
    expect('roboto.woff').to.load()
    expect('roboto.woff2').to.load()
  })
})
```

With Selenium WebDriver:
```javascript
const { Builder, Capabilities, By } = require('selenium-webdriver')
const Rapido = require('rapidojs')

const driver = new Builder()
  .withCapabilities(Capabilities.chrome())
  .build()

Rapido.getSeleniumPort(driver).then(port => {
  return Promise.all([port, driver.get('http://example.com')]) // Pass the port to Rapido
}).then(([port]) => {
  return Rapido.load(driver, { port })
}).then(client => {
  return client.startTracing({ isOnLoad: false })
}).then(client => {
  return driver.findElement(By.id('open-modal')).click().then(() => {
    return driver.findElement(By.id('search')).sendKeys('rapidojs')
  }).then(() => {
    return driver.wait(until.titleIs('rapidojs - search'), 1000)
  }).then(() => {
    return client.endTracing()
  })
}).then(() => {
  // Rapido is now populated with timeline and network events!
})
```

## Connecting to an open Chrome instance
You can connect to an already open Chrome instance by supplying a port to the `Rapido.load` function's configuration object:
```javascript
Rapido.load('http://example.com', { port: 9222 })
```
But beware! Without supplying the pid of the Chrome instance it will be left open after Rapido is done using it. You can provide it in the configuration object too:
```javascript
Rapido.load('http://example.com', { port: 9222, pid: 86956 })
```

## Connecting to Selenium WebDriver
You can connect to a Chrome instance that's connected to a Selenium WebDriver insatnce like so:
```javascript
const driver = new selenium.Builder()
  .withCapabilities(selenium.Capabilities.chrome())
  .build()

Rapido.getSeleniumPort(driver).then(port => {
  return Promise.all([port, driver.get('http://example.com')])
}).then(([port]) => {
  // This line is populating the Rapido instance with the currently open tab's info
  return Rapido.load(driver, { port })
})
```

## API
*Note - all of the methods regarding evaluation / v8 compilation time support only JavaScript files at the moment, although CSS support is in the works.*
### Library
#### Site performance
```js
Rapido.load(url | SeleniumWebDriver, { port, pid })
```
Launches a new headless Chrome instance and loads the given url into it. Returns a `Promise` with an object with the remote debugging port of the new instance and a function, `startTracing`. This function also accepts a configuration object with an option to connect to an already open Chrome instacne, provided its remote debugging port (and optionally, its pid).

```js
Rapido.loadTimeOf(resource)
Rapido.evaluationTimeOf(script)
Rapido.compilationTimeOf(script)
```
Returns the load / evaluation / compilation time of a resource / a script.

```js
client.startTracing({ isOnLoad = true })
```
Starts tracing the browser's timeline. Receives a parameter called isOnLoad which is meant to indicate to Rapido whether this is being called straight after the `.load` call or not, which defaults to `true`. Returns a `Promise` an object with a function called `endTracing`.

```js
client.endTracing()
```
Ends tracing the browser's timeline. Returns a `Promise` with an object with the timline and the network arrays.

```js
Rapido.timeline
```
The script timeline events (evaluation and compilation).

```js
Rapido.network
```
The network events.

#### Webpack configuration
```js
Rapido.webpack
```
In order to use the webpack build features of Rapido, it is required to pass the webpack module to Rapido (required for multiple webpack version support).

```js
Rapido.runBuild(webpackConfig | webpackConfigPath)
```
Runs the webpack build with the specified webpack configuraation and returns a promise with a resolved object of the bundles (called assets), modules and chunks created during the build. Also, populates the assets, modules and chunks objects of the Rapido instance.

```js
Rapido.bundleSizeOf(name)
```
Returns the size in kb of the given bundle.

```js
Rapido.moduleSizeOf(name | url)
```
Returns the size in kb of the given module (searched by name or by path).

### Chai plugin
**IMPORTANT - The chai plugin cannot be used without loading the site / webpack config in node!**
```js
expect(url | filename).to.load()
```
Expects the url / filename to load, without any testing of the load time.

```js
expect(url | filename).to.evaluate()
expect(url | filename).to.compile()
```
Expects the url / filename to be evaluated or compiled, without testing the time these operations take.<br />

```js
expect(url | filename).to.load.under(ms)
expect(url | filename).to.evaluate.under(ms)
expect(url | filename).to.compile.under(ms)
```
Expects the url/filename to load / evaluate / compile under the given amount of milliseconds.

```js
expect(path | filename).to.be.built()
```
Expectes the module on the path / with the given filename / module name to be built.

## Testing
Running the tests:
```bash
npm test
```

## TODO
 - [x] Trace the browser's timeline
 - [x] Get the duration of network events
 - [x] Add a function to get a file's time easily
 - [x] Add an option to connect to an already launched Chrome instance
 - [x] Add Selenium WebDriver support
 - [x] Add support to get webpack bundle size
 - [ ] Add support to get file size from the network events
 - [ ] Add support for CSS parsing
