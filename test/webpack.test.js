/* eslint-env mocha */
const chai = require('chai')
const MemoryFS = require('memory-fs')
const webpack = require('webpack')

const { ajs, bjs, packageJson, sampleConfig } = require('./fixtures')
const webpackRunner = require('../lib/webpack')(webpack)
const Rapido = require('../lib')

chai.use(Rapido.chaiPlugin)
const { expect } = chai

describe('Webpack bundle size', function () {
  before(function () {
    this.fs = new MemoryFS()

    this.fs.mkdirSync('/tmp')
    this.fs.mkdirSync('/tmp/rapido-webpack')

    this.fs.writeFileSync('/tmp/rapido-webpack/package.json', packageJson)
    this.fs.writeFileSync('/tmp/rapido-webpack/a.js', ajs)
    this.fs.writeFileSync('/tmp/rapido-webpack/b.js', bjs)

    Rapido.webpack = webpack
  })

  describe('stats parser', () => {
    it('should return the bundle sizes', function () {
      const { fs } = this
      sampleConfig.filesystem = fs
      return webpackRunner(sampleConfig).then(result => {
        expect(result).to.have.property('assets')
        expect(result).to.have.property('chunks')
        expect(result).to.have.property('modules')
      })
    })
  })

  describe('rapido integration', () => {
    before(() => Rapido.runBuild(sampleConfig))

    it('should return the main bundle\'s size', () => {
      const mainSize = Rapido.assetSize('main.bundle.js')
      expect(mainSize).to.be.a('number')
      expect(mainSize).to.be.below(5)
    })

    it('should return the a.js module size', () => {
      const ajsSize = Rapido.moduleSize('a.js')
      expect(ajsSize).to.be.a('number')
      expect(ajsSize).to.be.below(1)
    })
  })

  // TODO - Add chai support
  describe('chai plugin integration', () => {
    it('should check the main bundle\'s size', () => {
      expect('main.bundle.js').to.be.built() // Checks in the assets array
      expect('main.bundle.js').to.have.bundleSize.under(10)
    })
  })
})
