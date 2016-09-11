'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

async function dictionary (params, engine) {
  let words = ['coffee', 'Aardvark', 'moose', 'ladder', 'antelope']
  return words[params.wordIndex]
}

describe('Engine: operator', () => {
  let event = {
    type: 'operatorTrigger'
  }
  let baseConditions = {
    any: [{
      fact: 'dictionary',
      operator: 'startsWithLetter',
      value: 'a',
      params: {
        wordIndex: null
      }
    }]
  }
  let eventSpy = sinon.spy()
  function setup (conditions = baseConditions) {
    eventSpy.reset()
    let engine = engineFactory()
    let rule = factories.rule({ conditions, event })
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
      let conditions = Object.assign({}, baseConditions)
      conditions.any[0].params.wordIndex = 1
      let engine = setup()
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('does not emit when the condition fails', async () => {
      let conditions = Object.assign({}, baseConditions)
      conditions.any[0].params.wordIndex = 0
      let engine = setup()
      await engine.run()
      expect(eventSpy).to.not.have.been.calledWith(event)
    })

    it('throws when it encounters an unregistered operator', async () => {
      let conditions = Object.assign({}, baseConditions)
      conditions.any[0].operator = 'unknown-operator'
      let engine = setup()
      expect(engine.run()).to.eventually.throw('Unknown operator: unknown-operator')
    })
  })
})
