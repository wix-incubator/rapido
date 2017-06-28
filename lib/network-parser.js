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

// TODO - Implement
const parseNetworkEvents = networkEvents => {
  return networkEvents
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
