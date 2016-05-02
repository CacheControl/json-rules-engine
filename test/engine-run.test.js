'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: run', () => {
  let engine, rule, rule2

  let event = { type: 'generic' }
  let condition21 = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  let condition75 = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 75
    }]
  }
  let eventSpy = sinon.spy()

  beforeEach(() => {
    eventSpy.reset()
    engine = engineFactory()
    rule = factories.rule({ conditions: condition21, event })
    engine.addRule(rule)
    rule2 = factories.rule({ conditions: condition75, event })
    engine.addRule(rule2)
    engine.on('success', eventSpy)
  })

  describe('independent runs', () => {
    it('treats each run() independently', async () => {
      await Promise.all([50, 10, 12, 30, 14, 15, 25].map((age) => engine.run({age})))
      expect(eventSpy).to.have.been.calledThrice
    })
  })

  describe('returns', () => {
    it('activated events', () => {
      return engine.run({age: 30}).then(results => {
        expect(results.length).to.equal(1)
        expect(results).to.include(rule.event)
      })
    })

    it('multiple activated events', () => {
      return engine.run({age: 90}).then(results => {
        expect(results.length).to.equal(2)
        expect(results).to.include(rule.event)
        expect(results).to.include(rule2.event)
      })
    })

    it('does not include unactived triggers', () => {
      return engine.run({age: 10}).then(results => {
        expect(results.length).to.equal(0)
      })
    })
  })
})
