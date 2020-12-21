'use strict'

import engineFactory from '../src/index'
import Almanac from '../src/almanac'
import sinon from 'sinon'

describe('Engine: run', () => {
  let engine, rule, rule2
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  const condition21 = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  const condition75 = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 75
    }]
  }
  let eventSpy

  beforeEach(() => {
    eventSpy = sandbox.spy()
    engine = engineFactory()
    rule = factories.rule({ conditions: condition21, event: { type: 'generic1' } })
    engine.addRule(rule)
    rule2 = factories.rule({ conditions: condition75, event: { type: 'generic2' } })
    engine.addRule(rule2)
    engine.on('success', eventSpy)
  })

  describe('independent runs', () => {
    it('treats each run() independently', async () => {
      await Promise.all([50, 10, 12, 30, 14, 15, 25].map((age) => engine.run({ age })))
      expect(eventSpy).to.have.been.calledThrice()
    })

    it('allows runtime facts to override engine facts for a single run()', async () => {
      engine.addFact('age', 30)

      await engine.run({ age: 85 }) // override 'age' with runtime fact
      expect(eventSpy).to.have.been.calledTwice()

      sandbox.reset()
      await engine.run() // no runtime fact; revert to age: 30
      expect(eventSpy).to.have.been.calledOnce()

      sandbox.reset()
      await engine.run({ age: 2 }) // override 'age' with runtime fact
      expect(eventSpy.callCount).to.equal(0)
    })
  })

  describe('returns', () => {
    it('activated events', async () => {
      const { events, failureEvents } = await engine.run({ age: 30 })
      expect(events.length).to.equal(1)
      expect(events).to.deep.include(rule.event)
      expect(failureEvents.length).to.equal(1)
      expect(failureEvents).to.deep.include(rule2.event)
    })

    it('multiple activated events', () => {
      return engine.run({ age: 90 }).then(results => {
        expect(results.events.length).to.equal(2)
        expect(results.events).to.deep.include(rule.event)
        expect(results.events).to.deep.include(rule2.event)
      })
    })

    it('does not include unactived triggers', () => {
      return engine.run({ age: 10 }).then(results => {
        expect(results.events.length).to.equal(0)
      })
    })

    it('includes the almanac', () => {
      return engine.run({ age: 10 }).then(results => {
        expect(results.almanac).to.be.an.instanceOf(Almanac)
        return results.almanac.factValue('age')
      }).then(ageFact => expect(ageFact).to.equal(10))
    })
  })

  describe('facts updated during run', () => {
    beforeEach(() => {
      engine.on('success', (event, almanac, ruleResult) => {
        // Assign unique runtime facts per event
        almanac.addRuntimeFact(`runtime-fact-${event.type}`, ruleResult.conditions.any[0].value)
      })
    })

    it('returns an almanac with runtime facts added', () => {
      return engine.run({ age: 90 }).then(results => {
        return Promise.all([
          results.almanac.factValue('runtime-fact-generic1'),
          results.almanac.factValue('runtime-fact-generic2')
        ])
      }).then(promiseValues => {
        expect(promiseValues[0]).to.equal(21)
        expect(promiseValues[1]).to.equal(75)
      })
    })
  })
})
