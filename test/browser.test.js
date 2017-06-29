/* eslint-env mocha */
const chromeLauncher = require('chrome-launcher')
const { expect } = require('chai')
const Zariz = require('../lib')

describe('Full browser', function () {
  this.timeout(5 * 1000)

  it('should return correct stats', () => {
    return Zariz.load('http://jonathano.com/test-page.html').then(client => {
      return client.startTracing({ isOnLoad: true })
    }).then(client => {
      return client.endTracing()
    }).then(({ timeline }) => {
      const jqueryEvalTime = timeline.filter(f => f.name === 'EvaluateScript')[0].duration
      const jqueryCompileTime = timeline.filter(f => f.name === 'V8Compile')[0].duration
      expect(jqueryEvalTime).to.be.below(50) // Make sure that the evaluation time of minified jQuery is less than 50ms
      expect(jqueryCompileTime).to.be.below(5) // Make sure that the compilation of minified jQuery is less than 2ms
    })
  })

  it('should return the script\'s evaluation time', () => {
    const loadTime = Zariz.loadTimeOf('jquery.min.js')
    const evalTime = Zariz.evaluationTimeOf('jquery.min.js')
    const compileTime = Zariz.compilationTimeOf('jquery.min.js')
    expect(loadTime).to.be.a('number')
    expect(evalTime).to.be.a('number')
    expect(compileTime).to.be.a('number')
  })

  it('should connect to an already open Chrome instance', () => {
    return chromeLauncher.launch({
      chromeFlags: ['--headless']
    }).then(({ port, pid }) => {
      return Zariz.load('http://jonathano.com/test-page.html', { port, pid })
    }).then(client => {
      return client.startTracing({ isOnLoad: true })
    }).then(client => {
      return client.endTracing()
    }).then(() => {
      expect(Zariz.timeline).to.exist
      expect(Zariz.network).to.exist
    })
  })
})
