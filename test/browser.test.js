/* eslint-env mocha */
const { expect } = require('chai')
const { getSiteData } = require('./fixtures')

describe('Full browser', function () {
  this.timeout(5 * 1000)

  it('should return correct stats', () => {
    return getSiteData('http://jonathano.com/test-page.html').then(({ timeline }) => {
      const jqueryEvalTime = timeline.filter(f => f.name === 'EvaluateScript')[0].duration
      const jqueryCompileTime = timeline.filter(f => f.name === 'V8Compile')[0].duration
      expect(jqueryEvalTime).to.be.below(50) // Make sure that the evaluation time of minified jQuery is less than 50ms
      expect(jqueryCompileTime).to.be.below(2) // Make sure that the compilation of minified jQuery is less than 2ms
    })
  })
})
