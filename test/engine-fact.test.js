'use strict'

import sinon from 'sinon'
import engineFactory from '../src/json-business-rules'

const CHILD = 14
const ADULT = 75

async function eligibility (params, engine) {
  if (params.field === 'age') {
    if (params.eligibilityId === 1) {
      return CHILD
    }
    return ADULT
  }
}

describe('Engine: fact evaluation', () => {
  let engine

  describe('params', () => {
    let action = {
      type: 'ageTrigger',
      params: {
        demographic: 'under50'
      }
    }
    let conditions = {
      any: [{
        fact: 'eligibility',
        operator: 'lessThan',
        params: {
          eligibilityId: 1,
          field: 'age'
        },
        value: 50
      }]
    }
    let actionSpy = sinon.spy()
    beforeEach(() => {
      actionSpy.reset()
      engine = engineFactory()
      let rule = factories.rule({ conditions, action })
      engine.addRule(rule)
      engine.addFact('eligibility', eligibility)
      engine.on('action', actionSpy)
    })

    it('emits when the condition is met', async () => {
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)
    })

    it('does not emit when the condition fails', async () => {
      engine.rules[0].conditions.any[0].params.eligibilityId = 2
      await engine.run()
      expect(actionSpy).to.not.have.been.called
    })
  })
})
