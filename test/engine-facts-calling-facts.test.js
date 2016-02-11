'use strict'

import engineFactory from '../src/json-rules-engine'
import { Fact } from '../src/json-rules-engine'
import sinon from 'sinon'

describe('Engine: custom cache keys', () => {
  let engine
  let action = { type: 'early-twenties' }
  let conditions = {
    all: [{
      fact: 'demographics',
      params: {
        field: 'age'
      },
      operator: 'lessThanInclusive',
      value: 25
    }, {
      fact: 'demographics',
      params: {
        field: 'zipCode'
      },
      operator: 'equal',
      value: 80211
    }]
  }

  let actionSpy = sinon.spy()
  let demographicDataSpy = sinon.spy()
  let demographicSpy = sinon.spy()
  beforeEach(() => {
    demographicSpy.reset()
    demographicDataSpy.reset()
    actionSpy.reset()

    let demographicsDataDefinition = async (params, engine) => {
      demographicDataSpy()
      return {
        age: 20,
        zipCode: 80211
      }
    }

    let demographicsDefinition = async (params, engine) => {
      demographicSpy()
      let data = await engine.factValue('demographic-data')
      return data[params.field]
    }
    let demographicsFact = new Fact('demographics', demographicsDefinition)
    let demographicsDataFact = new Fact('demographic-data', demographicsDataDefinition)

    engine = engineFactory()
    let rule = factories.rule({ conditions, action })
    engine.addRule(rule)
    engine.addFact(demographicsFact)
    engine.addFact(demographicsDataFact)
    engine.on('action', actionSpy)
  })

  describe('1 rule', () => {
    it('allows a fact to retrieve other fact values', async () => {
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
      expect(demographicDataSpy).to.have.been.calledOnce
      expect(demographicSpy).to.have.been.calledTwice
    })
  })

  describe('2 rules with parallel conditions', () => {
    it('calls the fact definition once', async () => {
      let conditions = {
        all: [{
          fact: 'demographics',
          params: {
            field: 'age'
          },
          operator: 'greaterThanInclusive',
          value: 20
        }]
      }
      let rule = factories.rule({ conditions, action })
      engine.addRule(rule)

      await engine.run()
      expect(actionSpy).to.have.been.calledTwice
      expect(demographicDataSpy).to.have.been.calledOnce
      expect(demographicSpy).to.have.been.calledTwice
      expect(demographicDataSpy).to.have.been.calledOnce
    })
  })
})
