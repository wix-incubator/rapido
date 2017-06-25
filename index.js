const path = require('path')
const fs = require('fs')
const getTimeline = require('./lib')

getTimeline({
  url: 'http://wix.com',
  writeFiles: true
}).then(({ screenshots, timeline }) => {
  const stringifiedTimeline = JSON.stringify(timeline, null, 2)
  fs.writeFileSync(path.join(__dirname, 'wix-profile.json'), stringifiedTimeline)
}).catch(err => {
  console.log(err)
})
