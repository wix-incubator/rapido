const url = require('url')

const shouldRunOn = (obj, utils) => utils.flag(obj, 'zariz.evaluate') || utils.flag(obj, 'zariz.load') || utils.flag(obj, 'zariz.compile')
const isURL = str => !!url.parse(str).protocol

const chaiZariz = {
  plugin: (chai, utils) => {
    const { Assertion } = chai

    // Evaluate/load/compile chainable methods
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
        const scripts = chaiZariz.timeline.filter(f => f.name === timelineName).map(f => isURL(this._obj) ? f.fullURL : f.script)
        const pastPostfix = name[name.length - 1] === 'e' ? 'd' : 'ed'
        this.assert(
          scripts.indexOf(script) !== -1,
          `Expected #{this} to be ${name + pastPostfix}`,
          `Expected #{this} to not be ${name + pastPostfix}`
        )
      }, function () {
        utils.flag(this, `zariz.${name}`, true)
        utils.flag(this, 'zariz.action', name)
        utils.flag(this, 'zariz.timelineName', timelineName)
      })
    }

    // Evaluate/load/compile under n miliseconds method
    Assertion.addMethod('under', function (num) {
      if (shouldRunOn(this, utils)) {
        const timelineName = utils.flag(this, 'zariz.timelineName')
        const action = utils.flag(this, 'zariz.action')
        const events = chaiZariz.timeline.filter(f => {
          const findValue = isURL(this._obj) ? f.fullURL === this._obj : f.script === this._obj
          return f.name === timelineName && findValue
        })
        const shouldLoadUnderNum = events.every(f => f.duration < num)
        this.assert(
          shouldLoadUnderNum,
          `Expected #{this} to ${action} in <#{exp}ms. Actual value: #{act}`,
          `Expected #{this} to ${action} in >#{exp}ms. Actual value: #{act}`,
          num,
          events[0].duration
        )
      } else {
        throw new Error('Cannot use .under assertion without zariz.')
      }
    })
  },
  timeline: []
}

module.exports = chaiZariz
