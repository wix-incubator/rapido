/* eslint-env mocha */
const { expect } = require('chai')
const { evaluateScript, v8Compile, resourceSendRequest, resourceReceiveResponse } = require('./fixtures').events
const { TimelineParser } = require('../lib/parser')

describe('Timeline parser', () => {
  describe('EvaluateScript', () => {
    it('should parse an EvaluateScript event correctly', () => {
      const parsedEvent = TimelineParser.parseEvaluateScript(evaluateScript)
      expect(parsedEvent).to.have.property('name', 'EvaluateScript')
      expect(parsedEvent).to.have.property('duration', evaluateScript.dur / 1000)
      expect(parsedEvent).to.have.property('script', 'jquery.min.js')
      expect(parsedEvent).to.have.property('path', '/js/lib')
      expect(parsedEvent).to.have.property('fullURL', 'chrome-extension://hgmhmanijnjhaffoampdlllchpolkdnj/js/lib/jquery.min.js')
    })

    it('shouldn\'t parse a non-EvaluateScript event', () => {
      const nonParsedEvent = TimelineParser.parseEvaluateScript({})
      expect(nonParsedEvent).to.have.property('name', 'EvaluateScript')
      expect(nonParsedEvent).to.have.property('duration', -1)
      expect(nonParsedEvent).to.have.property('script', '')
      expect(nonParsedEvent).to.have.property('path', '')
      expect(nonParsedEvent).to.have.property('fullURL', '')
    })
  })

  describe('V8Compile', () => {
    it('should parse a V8Compile event correctly', () => {
      const parsedEvent = TimelineParser.parseV8Compile(v8Compile)
      expect(parsedEvent).to.have.property('name', 'V8Compile')
      expect(parsedEvent).to.have.property('duration', v8Compile.dur / 1000)
      expect(parsedEvent).to.have.property('script', 'hotjar-147814.js')
      expect(parsedEvent).to.have.property('path', '/c')
      expect(parsedEvent).to.have.property('fullURL', 'https://static.hotjar.com/c/hotjar-147814.js?sv=5')
    })

    it('shouldn\'t parse a non-V8Compile event', () => {
      const nonParsedEvent = TimelineParser.parseV8Compile({})
      expect(nonParsedEvent).to.have.property('name', 'V8Compile')
      expect(nonParsedEvent).to.have.property('duration', -1)
      expect(nonParsedEvent).to.have.property('script', '')
      expect(nonParsedEvent).to.have.property('path', '')
      expect(nonParsedEvent).to.have.property('fullURL', '')
    })
  })

  describe('ResourceSendRequest', () => {
    it('should parse a ResourceSendRequest event correctly', () => {
      const parsedEvent = TimelineParser.parseResourceSendRequest(resourceSendRequest)
      expect(parsedEvent).to.have.property('name', 'ResourceSendRequest')
      expect(parsedEvent).to.have.property('method', 'GET')
      expect(parsedEvent).to.have.property('priority', 'VeryHigh')
      expect(parsedEvent).to.have.property('requestId', '35895.44')
      expect(parsedEvent).to.have.property('url', 'https://static.parastorage.com/services/third-party/fonts/Helvetica/Fonts/9a2e4855-380f-477f-950e-d98e8db54eac.woff')
    })

    it('shouldn\'t parse a non-ResourceSendRequest event', () => {
      const nonParsedEvent = TimelineParser.parseResourceSendRequest({})
      expect(nonParsedEvent).to.have.property('name', 'ResourceSendRequest')
      expect(nonParsedEvent).to.have.property('method', '')
      expect(nonParsedEvent).to.have.property('priority', '')
      expect(nonParsedEvent).to.have.property('requestId', '')
      expect(nonParsedEvent).to.have.property('url', '')
    })
  })

  describe('ResourceReceiveResponse', () => {
    it('should parse a ResourceReceiveResponse event correctly', () => {
      const parsedEvent = TimelineParser.parseResourceReceiveResponse(resourceReceiveResponse)
      expect(parsedEvent).to.have.property('name', 'ResourceReceiveResponse')
      expect(parsedEvent).to.have.property('encodedLength', 135)
      expect(parsedEvent).to.have.property('fromCache', false)
      expect(parsedEvent).to.have.property('fromServiceWorker', false)
      expect(parsedEvent).to.have.property('requestId', '33989.48')
      expect(parsedEvent).to.have.property('mimeType', 'application/x-font-woff')
      expect(parsedEvent).to.have.property('statusCode', 200)
    })

    it('shouldn\'t parse a non-ResourceReceiveResponse event', () => {
      const nonParsedEvent = TimelineParser.parseResourceReceiveResponse({})
      expect(nonParsedEvent).to.have.property('name', 'ResourceReceiveResponse')
      expect(nonParsedEvent).to.have.property('encodedLength', -1)
      expect(nonParsedEvent).to.have.property('fromCache', false)
      expect(nonParsedEvent).to.have.property('fromServiceWorker', false)
      expect(nonParsedEvent).to.have.property('requestId', '')
      expect(nonParsedEvent).to.have.property('mimeType', '')
      expect(nonParsedEvent).to.have.property('statusCode', -1)
    })
  })
})
