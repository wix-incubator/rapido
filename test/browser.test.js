/* eslint-env mocha */
const chromeLauncher = require('chrome-launcher')
const { expect } = require('chai')
const Rapido = require('../lib')

describe('Full browser', () => {
  it('should return correct stats', () => {
    return Rapido.load('http://jonathano.com/test-page.html').then(client => {
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
    const loadTime = Rapido.loadTimeOf('jquery.min.js')
    const evalTime = Rapido.evaluationTimeOf('jquery.min.js')
    const compileTime = Rapido.compilationTimeOf('jquery.min.js')
    expect(loadTime).to.be.a('number')
    expect(evalTime).to.be.a('number')
    expect(compileTime).to.be.a('number')
  })

  it('should connect to an already open Chrome instance', () => {
    return chromeLauncher.launch({
      chromeFlags: ['--headless']
    }).then(({ port, pid }) => {
      return Rapido.load('http://jonathano.com/test-page.html', { port, pid })
    }).then(client => {
      return client.startTracing({ isOnLoad: true })
    }).then(client => {
      return client.endTracing()
    }).then(() => {
      expect(Rapido.timeline).to.exist
      expect(Rapido.network).to.exist
    })
  })
})
