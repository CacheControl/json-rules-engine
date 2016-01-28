'use strict'

import sinon from 'sinon'
import engineFactory from '../src/json-business-rules'

async function factSenior (params, engine) {
  return 65
}

async function factChild (params, engine) {
  return 10
}

describe('Engine: "any" conditions', () => {
  let engine

  describe('supports a single "any" condition', () => {
    let action = {
      type: 'ageTrigger',
      params: {
        demographic: 'under50'
      }
    }
    let conditions = {
      any: [{
        'fact': 'age',
        'operator': 'lessThan',
        'value': 50
      }]
    }
    let actionSpy = sinon.spy()
    beforeEach(() => {
      actionSpy.reset()
      let rule = factories.rule({ conditions, action })
      engine = engineFactory()
      engine.addRule(rule)
      engine.on('action', actionSpy)
    })

    it('emits when the condition is met', async () => {
      engine.addFact('age', factChild)
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)
    })

    it('does not emit when the condition fails', () => {
      engine.addFact('age', factSenior)
      engine.run()
      expect(actionSpy).to.not.have.been.calledWith(action)
    })
  })

  describe('supports "any" with multiple conditions', () => {
    let conditions = {
      any: [{
        'fact': 'age',
        'operator': 'lessThan',
        'value': 50
      }, {
        'fact': 'age',
        'operator': 'lessThan',
        'value': 21
      }]
    }
    let action = {
      type: 'ageTrigger',
      params: {
        demographic: 'under50'
      }
    }
    let actionSpy = sinon.spy()
    beforeEach(() => {
      actionSpy.reset()
      let rule = factories.rule({ conditions, action })
      engine = engineFactory()
      engine.addRule(rule)
      engine.on('action', actionSpy)
    })

    it('emits an action when any condition is met', async () => {
      engine.addFact('age', factChild)
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)
    })

    it('does not emit when all conditions fail', async () => {
      engine.addFact('age', factSenior)
      await engine.run()
      expect(actionSpy).to.not.have.been.calledWith(action)
    })
  })
})
