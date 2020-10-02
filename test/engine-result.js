'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'
import { expect } from 'chai'

describe('Engine: result', () => {
  let engine
  const event = { type: 'middle-income-adult' }
  const nestedAnyCondition = {
    all: [
      {
        fact: 'age',
        operator: 'lessThan',
        value: 65
      },
      {
        fact: 'age',
        operator: 'greaterThan',
        value: 21
      },
      {
        any: [
          {
            fact: 'income',
            operator: 'lessThanInclusive',
            value: 100
          },
          {
            fact: 'family-size',
            operator: 'lessThanInclusive',
            value: 3
          }
        ]
      }
    ]
  }

  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  let eventSpy
  function setup (conditions = nestedAnyCondition) {
    eventSpy = sandbox.spy()

    engine = engineFactory()
    const rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.on('success', eventSpy)
  }

  describe('"all" with nested "any"', () => {
    it('has events and rule result when facts pass rules', async () => {
      setup()
      engine.addFact('age', 30)
      engine.addFact('income', 30)
      engine.addFact('family-size', 2)
      const engineResult = await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
      expect(engineResult.events.length).to.be.eq(1)
      expect(engineResult.events[0].type).to.equal(event.type)
      expect(engineResult.ruleResults.length).to.be.eq(1)
      expect(engineResult.ruleResults[0].conditions.operator).to.be.eq('all')
      expect(engineResult.ruleResults[0].conditions.all.length).to.be.eq(3)
      expect(engineResult.ruleResults[0].conditions.all[0].fact).to.be.eq('age')
      expect(engineResult.ruleResults[0].conditions.all[0].factResult).to.be.eq(30)
      expect(engineResult.ruleResults[0].conditions.all[0].value).to.be.eq(65)
      expect(engineResult.ruleResults[0].conditions.all[0].result).to.be.eq(true)
      expect(engineResult.ruleResults[0].conditions.all[1].fact).to.be.eq('age')
      expect(engineResult.ruleResults[0].conditions.all[1].factResult).to.be.eq(30)
      expect(engineResult.ruleResults[0].conditions.all[1].value).to.be.eq(21)
      expect(engineResult.ruleResults[0].conditions.all[1].result).to.be.eq(true)
      expect(engineResult.ruleResults[0].conditions.all[2].result).to.be.eq(true)
      expect(engineResult.ruleResults[0].conditions.all[2].operator).to.be.eq('any')
    })

    it('has no events or rule result when facts do not pass rules', async () => {
      setup()
      engine.addFact('age', 30)
      engine.addFact('income', 200)
      engine.addFact('family-size', 8)
      const engineResult = await engine.run()
      expect(eventSpy).to.not.have.been.calledOnce()
      expect(engineResult.events.length).to.be.eq(0)
      expect(engineResult.ruleResults.length).to.be.eq(0)
    })

    it('has no events or rule result when facts do not pass rules', async () => {
      setup()
      engine.addFact('age', 12)
      engine.addFact('income', 30)
      engine.addFact('family-size', 2)
      const engineResult = await engine.run()
      expect(eventSpy).to.not.have.been.calledOnce()
      expect(engineResult.events.length).to.be.eq(0)
      expect(engineResult.ruleResults.length).to.be.eq(0)
    })
  })
})
