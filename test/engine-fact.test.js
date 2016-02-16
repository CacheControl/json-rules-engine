'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

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
  let event = {
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
  let eventSpy = sinon.spy()
  function setup (conditions = baseConditions) {
    eventSpy.reset()
    engine = engineFactory()
    let rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addFact('eligibility', eligibility)
    engine.on('event', eventSpy)
  }

  describe('params', () => {
    it('emits when the condition is met', async () => {
      setup()
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('does not emit when the condition fails', async () => {
      let conditions = Object.assign({}, baseConditions)
      conditions.any[0].params.eligibilityId = 2
      setup(conditions)
      await engine.run()
      expect(eventSpy).to.not.have.been.called
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
      expect(eventSpy).to.have.been.called
    })
  })

  describe('synchronous functions', () => {
    it('works with synchronous, non-promise evaluations that are truthy', async () => {
      setup()
      let eligibility = function (params, engine) {
        return 20
      }
      engine.addFact('eligibility', eligibility)
      await engine.run()
      expect(eventSpy).to.have.been.called
    })

    it('works with synchronous, non-promise evaluations that are falsey', async () => {
      setup()
      let eligibility = function (params, engine) {
        return 100
      }
      engine.addFact('eligibility', eligibility)
      await engine.run()
      expect(eventSpy).to.not.have.been.called
    })
  })
})
