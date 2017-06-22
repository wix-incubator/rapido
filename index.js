const path = require('path')
const fs = require('fs')
const getTimeline = require('./lib')

getTimeline('http://wix.com').then(timeline => {
  fs.writeFileSync(path.join(__dirname, 'timeline.json'), JSON.stringify(timeline, null, 2))
})
