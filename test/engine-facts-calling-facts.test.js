'use strict'

import engineFactory, { Fact } from '../src/index'
import sinon from 'sinon'

describe('Engine: custom cache keys', () => {
  let engine
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })
  const event = { type: 'early-twenties' }
  const conditions = {
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

  let eventSpy
  let demographicDataSpy
  let demographicSpy
  beforeEach(() => {
    demographicSpy = sandbox.spy()
    demographicDataSpy = sandbox.spy()
    eventSpy = sandbox.spy()

    const demographicsDataDefinition = async (params, engine) => {
      demographicDataSpy()
      return {
        age: 20,
        zipCode: 80211
      }
    }

    const demographicsDefinition = async (params, engine) => {
      demographicSpy()
      const data = await engine.factValue('demographic-data')
      return data[params.field]
    }
    const demographicsFact = new Fact('demographics', demographicsDefinition)
    const demographicsDataFact = new Fact('demographic-data', demographicsDataDefinition)

    engine = engineFactory()
    const rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addFact(demographicsFact)
    engine.addFact(demographicsDataFact)
    engine.on('success', eventSpy)
  })

  describe('1 rule', () => {
    it('allows a fact to retrieve other fact values', async () => {
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
      expect(demographicDataSpy).to.have.been.calledOnce()
      expect(demographicSpy).to.have.been.calledTwice()
    })
  })

  describe('2 rules with parallel conditions', () => {
    it('calls the fact definition once', async () => {
      const conditions = {
        all: [{
          fact: 'demographics',
          params: {
            field: 'age'
          },
          operator: 'greaterThanInclusive',
          value: 20
        }]
      }
      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      await engine.run()
      expect(eventSpy).to.have.been.calledTwice()
      expect(demographicDataSpy).to.have.been.calledOnce()
      expect(demographicSpy).to.have.been.calledTwice()
      expect(demographicDataSpy).to.have.been.calledOnce()
    })
  })
})
