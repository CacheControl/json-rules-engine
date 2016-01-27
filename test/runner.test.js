'use strict'

import sinon from 'sinon'
import engineFactory from '../src/json-business-rules'

let engine = engineFactory()

let conditions = {
  all: [{
    'fact': 'age',
    'operator': 'lessThan',
    'value': 50
  }]
}
let action = {
  type: 'ageTrigger',
  params: {
    demographic: 'under50'
  }
}
async function factOver50 (params, engine) {
  return 65
}
async function factUnder50 (params, engine) {
  return 21
}

let rule = factories.rule({ conditions, action })
engine.addRule(rule)

describe('runner', () => {
  it('throws an exception if a fact has not been registered', () => {

  })

  describe('supports a single "all" condition', () => {
    it('does not emit when the condition fails', async () => {
      let actionSpy = sinon.spy()
      engine.addFact('age', factUnder50)
      engine.on('action', actionSpy)
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)
    })

    it('emits an action when every condition is met', () => {
      let actionSpy = sinon.spy()
      engine.addFact('age', factOver50)
      engine.on('action', actionSpy)
      engine.run()
      expect(actionSpy).to.not.have.been.calledWith(action)
    })
  })
})
