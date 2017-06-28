/* eslint-env mocha */
const { expect } = require('chai')
const Zariz = require('../lib')

describe('Full browser', function () {
  this.timeout(5 * 1000)

  it('should return correct stats', () => {
    return Zariz.load('http://wix.com').then(client => {
      return client.startTracing({ isOnLoad: true })
    }).then(client => {
      return client.endTracing()
    }).then(() => {
      const { timeline } = Zariz
      const jqueryEvalTime = timeline.filter(f => f.name === 'EvaluateScript')[0].duration
      const jqueryCompileTime = timeline.filter(f => f.name === 'V8Compile')[0].duration
      expect(jqueryEvalTime).to.be.below(50) // Make sure that the evaluation time of minified jQuery is less than 50ms
      expect(jqueryCompileTime).to.be.below(5) // Make sure that the compilation of minified jQuery is less than 2ms
    })
  })
})
