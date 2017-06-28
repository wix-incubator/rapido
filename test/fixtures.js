const evaluateScript = {
  pid: 27839,
  tid: 775,
  ts: 62932833894,
  ph: 'X',
  cat: 'devtools.timeline',
  name: 'EvaluateScript',
  args: {
    data: {
      columnNumber: 1,
      frame: '0x372e170e1e38',
      lineNumber: 1,
      url: 'chrome-extension://hgmhmanijnjhaffoampdlllchpolkdnj/js/lib/jquery.min.js'
    }
  },
  dur: 26037,
  tdur: 26016,
  tts: 188295
}

const v8Compile = {
  pid: 38098,
  tid: 775,
  ts: 70755721067,
  ph: 'X',
  cat: 'v8,devtools.timeline',
  name: 'v8.compile',
  args: {
    fileName: 'https://static.hotjar.com/c/hotjar-147814.js?sv=5',
    data: {
      columnNumber: 1,
      lineNumber: 1,
      url: 'https://static.hotjar.com/c/hotjar-147814.js?sv=5'
    }
  },
  dur: 336,
  tdur: 332,
  tts: 473050
}

const resourceSendRequest = {
  pid: 35895,
  tid: 775,
  ts: 67647043229,
  ph: 'I',
  cat: 'devtools.timeline',
  name: 'ResourceSendRequest',
  args: {
    data: {
      frame: '0x25d4de381e38',
      priority: 'VeryHigh',
      requestId: '35895.44',
      requestMethod: 'GET',
      url: 'https://static.parastorage.com/services/third-party/fonts/Helvetica/Fonts/9a2e4855-380f-477f-950e-d98e8db54eac.woff'
    }
  },
  tts: 424494,
  s: 't'
}

const resourceReceiveResponse = {
  pid: 33989,
  tid: 775,
  ts: 66042230620,
  ph: 'I',
  cat: 'devtools.timeline',
  name: 'ResourceReceiveResponse',
  args: {
    data: {
      encodedDataLength: 135,
      frame: '0x1659c9ee1e38',
      fromCache: false,
      fromServiceWorker: false,
      mimeType: 'application/x-font-woff',
      requestId: '33989.48',
      statusCode: 200,
      timing: {
        connectEnd: -1,
        connectStart: -1,
        dnsEnd: -1,
        dnsStart: -1,
        proxyEnd: -1,
        proxyStart: -1,
        pushEnd: 0,
        pushStart: 0,
        receiveHeadersEnd: 67.02600000426173,
        requestTime: 66042.163304,
        sendEnd: 0.16700000560376793,
        sendStart: 0.09699999645818025,
        sslEnd: -1,
        sslStart: -1,
        workerReady: -1,
        workerStart: -1
      }
    }
  },
  tts: 401290,
  s: 't'
}

module.exports = {
  events: {
    array: [evaluateScript, v8Compile, resourceSendRequest, resourceReceiveResponse],
    evaluateScript,
    v8Compile,
    resourceSendRequest,
    resourceReceiveResponse
  }
}
