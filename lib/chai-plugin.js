const url = require('url')
const { getFileData } = require('./utils')

const shouldRunOn = (obj, utils) => {
  const action = utils.flag(obj, 'zariz.action')
  return action && (action === 'load' || utils.flag(obj, 'zariz.timelineName'))
}

const isURL = str => !!url.parse(str).protocol

// Inject the zariz instance used for the plugin
module.exports = Zariz => {
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
        const scripts = Zariz.timeline.filter(f => f.name === timelineName).map(f => isURL(this._obj) ? f.fullURL : f.script)
        this.assert(
          scripts.indexOf(script) !== -1,
          `Expected #{this} to be ${name}d`,
          `Expected #{this} to not be ${name}d`
        )
      }, function () {
        utils.flag(this, 'zariz.action', name)
        utils.flag(this, 'zariz.timelineName', timelineName)
      })
    }

    // Load chainable method
    Assertion.addChainableMethod('load', function () {
      const { networkEvents } = Zariz
      const resource = this._obj
      if (isURL(resource)) {
        const urls = networkEvents.map(e => e.url)
        this.assert(
          urls.indexOf(resource) !== -1,
          'Expected #{this} to be loaded',
          'Expected #{this} to not be loaded'
        )
      } else {
        const files = networkEvents.map(e => e.file.name)
        this.assert(
          files.indexOf(resource) !== -1,
          'Expected #{this} to be loaded',
          'Expected #{this} to not be loaded'
        )
      }
    }, function () {
      utils.flag(this, 'zariz.action', 'load')
    })

    // Evaluate/load/compile under n miliseconds method
    Assertion.addMethod('under', function (num) {
      if (shouldRunOn(this, utils)) {
        const action = utils.flag(this, 'zariz.action')
        const timelineName = utils.flag(this, 'zariz.timelineName')

        const filterTimeline = f => {
          const findValue = isURL(this._obj) ? f.fullURL === this._obj : f.script === this._obj
          return f.name === timelineName && findValue
        }

        const events = action !== 'load'
          ? Zariz.timeline.filter(filterTimeline)
          : Zariz.networkEvents.filter(e => isURL(this._obj) ? e.url === this._obj : e.file.name === this._obj)
        const shouldLoadUnderNum = events.every(f => f.duration < num)

        this.assert(
          shouldLoadUnderNum,
          `Expected #{this} to ${action} in <#{exp}ms. Actual time: #{act}ms`,
          `Expected #{this} to ${action} in >#{exp}ms. Actual time: #{act}ms`,
          num,
          events[0].duration
        )
      } else {
        // If Zariz was not introduced to chai, use this the same way as .below
        new Assertion(this._obj).to.be.below(num)
      }
    })
  }
}
