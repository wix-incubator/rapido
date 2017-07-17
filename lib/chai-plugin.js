const { isUrl, shouldRunOn, timlineFilter, moduleFilter } = require('./utils')
const { sep } = require('path')

// Inject the rapido instance used for the plugin
module.exports = Rapido => {
  return (chai, utils) => {
    const { Assertion } = chai

    // Evaluate/compile chainable methods
    const chainableData = [{
      name: 'evaluate',
      timelineName: 'EvaluateScript'
    }, {
      name: 'compile',
      timelineName: 'V8Compile'
    }]

    for (const { name, timelineName } of chainableData) {
      Assertion.addChainableMethod(name, function () {
        const script = this._obj
        const scripts = Rapido.timeline.filter(f => f.name === timelineName).map(f => isUrl(this._obj) ? f.fullURL : f.script)
        this.assert(
          scripts.indexOf(script) !== -1,
          `Expected #{this} to be ${name}d`,
          `Expected #{this} to not be ${name}d`
        )
      }, function () {
        utils.flag(this, 'rapido.action', name)
        utils.flag(this, 'rapido.timelineName', timelineName)
      })
    }

    // Load chainable method
    Assertion.addChainableMethod('load', function () {
      const { network } = Rapido
      const resource = this._obj
      if (isUrl(resource)) {
        const urls = network.map(e => e.url)
        this.assert(
          urls.indexOf(resource) !== -1,
          'Expected #{this} to be loaded',
          'Expected #{this} to not be loaded'
        )
      } else {
        const files = network.map(e => e.file.name)
        this.assert(
          files.indexOf(resource) !== -1,
          'Expected #{this} to be loaded',
          'Expected #{this} to not be loaded'
        )
      }
    }, function () {
      utils.flag(this, 'rapido.action', 'load')
    })

    const underTime = function (action, num) {
      const timelineName = utils.flag(this, 'rapido.timelineName')

      const events = action !== 'load'
        ? Rapido.timeline.filter(timlineFilter(timelineName, this._obj))
        : Rapido.network.filter(e => isUrl(this._obj) ? e.url === this._obj : e.file.name === this._obj)
      const shouldLoadUnderNum = events.every(f => f.duration < num)

      this.assert(
        shouldLoadUnderNum,
        `Expected #{this} to ${action} in <#{exp}ms. Actual time: #{act}ms`,
        `Expected #{this} to ${action} in >#{exp}ms. Actual time: #{act}ms`,
        num,
        events[0].duration
      )
    }

    const underSize = function (action, num) {
      const size = utils.flag(this, 'rapido.size')
      this.assert(
        size <= num,
        `Expected #{this}'s ${action} size to be <#{exp}kb. Actual size: #{act}kb'`,
        `Expected #{this}'s ${action} size to be >#{exp}kb. Actual size: #{act}kb'`,
        num,
        size
      )
    }

    // Evaluate/load/compile under n milliseconds method
    Assertion.addMethod('under', function (num) {
      if (shouldRunOn(this, utils)) {
        const action = utils.flag(this, 'rapido.action')
        if (action !== 'bundle') underTime.call(this, action, num)
        else underSize.call(this, action, num)
      } else {
        // If rapido was not introduced to chai, use this the same way as .below
        new Assertion(this._obj).to.be.below(num)
      }
    })

    // Make sure a bundle has been built
    Assertion.addMethod('built', function () {
      const { assets, modules } = Rapido
      const isInAssets = Object.keys(assets).some(a => a === this._obj)
      const filter = moduleFilter(this._obj)
      const isInModules = Object.keys(modules)
        .filter(m => !m.includes('external'))
        .some(filter)
      // TODO: Add support for chunks
      this.assert(
        isInAssets || isInModules,
        'Expected #{this} to be built. Actual result - not built',
        'Expected #{this} to be not built. Actual result - built',
        true,
        isInAssets || isInModules
      )
    })

    Assertion.addProperty('bundleSize', function () {
      const { assets } = Rapido // The bundles reside in the assets object
      const bundle = Object.keys(assets).filter(a => a === this._obj)[0]
      const size = assets[bundle]
      utils.flag(this, 'rapido.action', 'bundle')
      utils.flag(this, 'rapido.size', size)
    })
  }
}
