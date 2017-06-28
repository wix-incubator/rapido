/* eslint-env mocha */
const chai = require('chai')
const Zariz = require('../lib')
const { chaiZariz } = Zariz

chai.use(chaiZariz)
const { expect } = chai

describe('Chai plugin', () => {
  before(() => {
    return Zariz.load('http://jonathano.com/test-page.html').then(client => {
      return client.startTracing({ isOnLoad: true })
    }).then(client => {
      return client.endTracing()
    })
  })

  it('should correctly check for data without duration checking', () => {
    expect('jquery.min.js').to.load()
    expect('jquery.min.js').to.evaluate()
    expect('jquery.min.js').to.compile()
  })

  it('should correcly check load data', () => {
    expect('jquery.min.js').to.load.under(500)
  })

  it('should correctly check evaluation data', () => {
    expect('jquery.min.js').to.evaluate.under(40)
  })

  it('should correctly check compilation data', () => {
    expect('jquery.min.js').to.compile.under(10)
  })
})

