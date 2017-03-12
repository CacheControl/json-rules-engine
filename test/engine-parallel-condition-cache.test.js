'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine', () => {
  let engine
  let event = { type: 'early-twenties' }
  let conditions = {
    all: [{
      fact: 'age',
      operator: 'lessThanInclusive',
      value: 25
    }, {
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 20
    }, {
      fact: 'age',
      operator: 'notIn',
      value: [21, 22]
    }]
  }

  let eventSpy = sinon.spy()
  let factSpy = sinon.spy()
  function setup (factOptions) {
    factSpy.reset()
    eventSpy.reset()

    let factDefinition = () => {
      factSpy()
      return 24
    }

    engine = engineFactory()
    let rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addFact('age', factDefinition, factOptions)
    engine.on('success', eventSpy)
  }

  describe('1 rule with parallel conditions', () => {
    it('calls the fact definition once for each condition if caching is off', async () => {
      setup({ cache: false })
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
      expect(factSpy).to.have.been.calledThrice()
    })

    it('calls the fact definition once', async () => {
      setup()
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
      expect(factSpy).to.have.been.calledOnce()
    })
  })

  describe('2 rules with parallel conditions', () => {
    it('calls the fact definition once', async () => {
      setup()
      let conditions = {
        all: [{
          fact: 'age',
          operator: 'notIn',
          value: [21, 22]
        }]
      }
      let rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      await engine.run()
      expect(eventSpy).to.have.been.calledTwice()
      expect(factSpy).to.have.been.calledOnce()
    })
  })
})
