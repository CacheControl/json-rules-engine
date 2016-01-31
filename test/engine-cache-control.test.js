'use strict'

import engineFactory from '../src/json-business-rules'
import { Fact } from '../src/json-business-rules'
import sinon from 'sinon'

describe('Engine: custom cache keys', () => {
  let engine
  let action = { type: 'early-twenties' }
  let conditions = {
    all: [{
      fact: 'demographics',
      params: {
        userId: 1,
        clientId: 50
      },
      operator: 'lessThanInclusive',
      value: 25
    }, {
      fact: 'demographics',
      params: {
        userId: 1,
        clientId: 50
      },
      operator: 'greaterThanInclusive',
      value: 20
    }]
  }

  let actionSpy = sinon.spy()
  let factSpy = sinon.spy()
  beforeEach(() => {
    factSpy.reset()
    actionSpy.reset()

    let factDefinition = () => {
      factSpy()
      return 24
    }
    let fact = new Fact('demographics', factDefinition)
    fact.cacheKeys = function (id, params) {
      return {
        id,
        params: {
          clientId: params.clientId
        }
      }
    }

    engine = engineFactory()
    let rule = factories.rule({ conditions, action })
    engine.addRule(rule)
    engine.addFact(fact)
    engine.on('action', actionSpy)
  })

  describe('1 rule with custom cache keys', () => {
    it('calls the fact definition once', async () => {
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
      expect(factSpy).to.have.been.calledOnce
    })
  })

  describe('2 rules with parallel conditions', () => {
    it('calls the fact definition once', async () => {
      let conditions = {
        all: [{
          fact: 'demographics',
          params: {
            userId: 1,
            clientId: 50
          },
          operator: 'greaterThanInclusive',
          value: 20
        }]
      }
      let rule = factories.rule({ conditions, action })
      engine.addRule(rule)

      await engine.run()
      expect(actionSpy).to.have.been.calledTwice
      expect(factSpy).to.have.been.calledOnce
    })
  })
})
