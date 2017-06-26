const groupBy = require('lodash.groupby')

// Network action types
const REQUEST_WILL_BE_SENT = 'requestWillBeSent'
const RESPONSE_RECEIVED = 'responseReceived'
const LOADING_FINISHED = 'loadingFinished'

const parseRequestWillBeSent = ({ requestId, timestamp, request }, netType) => {
  const { url, method, initialPriority } = request
  return { netType, requestId, timestamp, url, method, initialPriority }
}

const parseResponseReceived = ({ requestId, type, response }, netType) => {
  const { status: statusCode, fromDiskCache, fromServiceWorker, mimeType, url } = response
  return { netType, type, requestId, statusCode, fromCache: fromDiskCache, fromServiceWorker, mimeType, url }
}

const parseLoadingFinished = ({ requestId, timestamp, encodedDataLength }, netType) => ({ netType, requestId, timestamp, encodedDataLength })

const parseNetworkEvents = networkEvents => {
  const byIds = groupBy(networkEvents, 'requestId')
  console.log(byIds)
  const baseNetworkEvent = { requestId: '', startTimestamp: 0, endTimestamp: 0, diff: 0, dataLength: 0, type: '', url: '', statusCode: -1, fromCache: false, fromServiceWorker: false, initialPriority: '', method: '', mimeType: '' }
  return Object.keys(byIds).map(key => byIds[key].reduce((a, b) => {
    switch (b.netType) {
      case REQUEST_WILL_BE_SENT:
        a.requestId = b.requestId
        a.startTimestamp = b.timestamp
        a.url = b.url
        a.method = b.method
        a.initialPriority = b.initialPriority
        break
      case RESPONSE_RECEIVED:
        a.statusCode = b.statusCode
        a.type = b.type
        a.fromCache = b.fromCache
        a.fromServiceWorker = b.fromServiceWorker
        a.mimeType = b.mimeType
        break
      case LOADING_FINISHED:
        a.endTimestamp = b.timestamp
        a.diff = a.endTimestamp - a.startTimestamp
        a.dataLength = b.encodedDataLength
        break
    }
    return a
  }, baseNetworkEvent))
}

module.exports = {
  parse: (data, type) => {
    switch (type) {
      case REQUEST_WILL_BE_SENT: return parseRequestWillBeSent(data, REQUEST_WILL_BE_SENT)
      case RESPONSE_RECEIVED: return parseResponseReceived(data, RESPONSE_RECEIVED)
      case LOADING_FINISHED: return parseLoadingFinished(data, LOADING_FINISHED)
      default: return parseNetworkEvents(data)
    }
  },
  parseRequestWillBeSent,
  parseResponseReceived,
  parseLoadingFinished,
  parseNetworkEvents
}
