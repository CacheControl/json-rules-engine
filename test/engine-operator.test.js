'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

async function dictionary (params, engine) {
  const words = ['coffee', 'Aardvark', 'moose', 'ladder', 'antelope']
  return words[params.wordIndex]
}

describe('Engine: operator', () => {
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })
  const event = {
    type: 'operatorTrigger'
  }
  const baseConditions = {
    any: [{
      fact: 'dictionary',
      operator: 'startsWithLetter',
      value: 'a',
      params: {
        wordIndex: null
      }
    }]
  }
  let eventSpy
  function setup (conditions = baseConditions) {
    eventSpy = sandbox.spy()
    const engine = engineFactory()
    const rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addOperator('startsWithLetter', (factValue, jsonValue) => {
      if (!factValue.length) return false
      return factValue[0].toLowerCase() === jsonValue.toLowerCase()
    })
    engine.addFact('dictionary', dictionary)
    engine.on('success', eventSpy)
    return engine
  }

  describe('evaluation', () => {
    it('emits when the condition is met', async () => {
      const conditions = Object.assign({}, baseConditions)
      conditions.any[0].params.wordIndex = 1
      const engine = setup()
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('does not emit when the condition fails', async () => {
      const conditions = Object.assign({}, baseConditions)
      conditions.any[0].params.wordIndex = 0
      const engine = setup()
      await engine.run()
      expect(eventSpy).to.not.have.been.calledWith(event)
    })

    it('throws when it encounters an unregistered operator', async () => {
      const conditions = Object.assign({}, baseConditions)
      conditions.any[0].operator = 'unknown-operator'
      const engine = setup()
      return expect(engine.run()).to.eventually.be.rejectedWith('Unknown operator: unknown-operator')
    })
  })
})
