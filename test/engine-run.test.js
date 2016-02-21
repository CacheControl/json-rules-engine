'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: run', () => {
  let engine

  let event = { type: 'generic' }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  let eventSpy = sinon.spy()
  beforeEach(() => {
    eventSpy.reset()
    engine = engineFactory()
    let rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.on('success', eventSpy)
  })

  describe('independent runs', () => {
    it('treats each run() independently', async () => {
      await Promise.all([50, 10, 12, 30, 14, 15, 25].map((age) => engine.run({age})))
      expect(eventSpy).to.have.been.calledThrice
    })
  })
})
