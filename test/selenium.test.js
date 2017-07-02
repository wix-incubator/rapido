/* eslint-env mocha */
const { Builder, Capabilities } = require('selenium-webdriver')
const chai = require('chai')
const Rapido = require('../lib')

chai.use(Rapido.chaiPlugin)
const { expect } = chai

describe('Selenium WebDriver integration', function () {
  this.timeout(10 * 1000)

  before(function () {
    this.driver = new Builder()
      .withCapabilities(Capabilities.chrome())
      .build()
  })

  it('should work with Selenium WebDriver', function () {
    const { driver } = this
    return Rapido.getSeleniumPort(driver).then(port => {
      return Promise.all([port, driver.get('http://jonathano.com/test-page.html')])
    }).then(([port]) => {
      return Rapido.load(driver, { port })
    }).then(client => {
      return client.startTracing({ isOnLoad: false })
    }).then((client) => {
      return client.endTracing()
    }).then(() => {
      expect(Rapido.timeline).to.have.length.above(0)
      expect(Rapido.network).to.have.length.above(0)
    })
  })
})
