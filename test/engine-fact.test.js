'use strict'

import sinon from 'sinon'
import engineFactory from '../src/json-rules-engine'

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
  let action = {
    type: 'ageTrigger',
    params: {
      demographic: 'under50'
    }
  }
  let baseConditions = {
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
  function setup (conditions = baseConditions) {
    actionSpy.reset()
    engine = engineFactory()
    let rule = factories.rule({ conditions, action })
    engine.addRule(rule)
    engine.addFact('eligibility', eligibility)
    engine.on('action', actionSpy)
  }

  describe('params', () => {
    it('emits when the condition is met', async () => {
      setup()
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)
    })

    it('does not emit when the condition fails', async () => {
      let conditions = Object.assign({}, baseConditions)
      conditions.any[0].params.eligibilityId = 2
      setup(conditions)
      await engine.run()
      expect(actionSpy).to.not.have.been.called
    })
  })

  describe('promises', () => {
    it('works with asynchronous evaluations', async () => {
      setup()
      let eligibility = function (params, engine) {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(30)
          })
        })
      }
      engine.addFact('eligibility', eligibility)
      await engine.run()
      expect(actionSpy).to.have.been.called
    })
  })
})
