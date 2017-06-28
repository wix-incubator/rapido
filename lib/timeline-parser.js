const { getFileData } = require('./utils')

const parseEvaluateScript = frame => {
  const name = 'EvaluateScript'
  if (frame.name !== name) return { name, fullURL: '', duration: -1, script: '', path: '' }
  const { url: fullURL, lineNumber, columnNumber } = frame.args.data
  const duration = frame.dur / 1000
  const location = { lineNumber, columnNumber }
  const file = getFileData(fullURL)
  const script = file.name || `inline:${location.lineNumber}:${location.columnNumber}`
  return { name, fullURL, duration, script, path: file.path || '/' }
}

const parseResourceReceiveResponse = frame => {
  const name = 'ResourceReceiveResponse'
  if (frame.name !== name) return { name, encodedLength: -1, fromCache: false, fromServiceWorker: false, requestId: '', mimeType: '', statusCode: -1 }
  const { encodedDataLength, fromCache, fromServiceWorker, mimeType, requestId, statusCode } = frame.args.data
  return { name, encodedLength: encodedDataLength, fromCache, fromServiceWorker, mimeType, requestId, statusCode }
}

const parseResourceSendRequest = frame => {
  const name = 'ResourceSendRequest'
  if (frame.name !== name) return { name, method: '', priority: '', requestId: '', url: '' }
  const { requestMethod, priority, requestId, url } = frame.args.data
  return { name, method: requestMethod, priority, requestId, url }
}

const parseV8Compile = frame => {
  const name = 'V8Compile'
  if (frame.name !== 'v8.compile') return { name, fullURL: '', duration: -1, script: '', path: '' }
  const { url: fullURL, lineNumber, columnNumber } = frame.args.data
  const duration = frame.dur / 1000
  const location = { lineNumber, columnNumber }
  const file = getFileData(fullURL)
  const script = file.name || `inline:${location.lineNumber}:${location.columnNumber}`
  return { name, duration, fullURL, script, path: file.path || '/' }
}

module.exports = {
  parse: (chunk, url) => {
    const onlyNames = ['EvaluateScript', 'v8.compile', 'ResourceReceiveResponse', 'ResourceSendRequest']
    return chunk.filter(f => onlyNames.indexOf(f.name) !== -1).map((frame, i) => {
      switch (frame.name) {
        case 'EvaluateScript': return frame.args.data.url ? parseEvaluateScript(frame) : frame
        case 'v8.compile': return frame.args.data.url ? parseV8Compile(frame) : frame
        case 'ResourceReceiveResponse': return parseResourceReceiveResponse(frame)
        case 'ResourceSendRequest': return parseResourceSendRequest(frame)
        default: return frame
      }
    })
  },
  parseEvaluateScript,
  parseV8Compile,
  parseResourceSendRequest,
  parseResourceReceiveResponse
}
