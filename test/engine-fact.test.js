'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

const CHILD = 14
const ADULT = 75

async function eligibilityField (params, engine) {
  if (params.field === 'age') {
    if (params.eligibilityId === 1) {
      return CHILD
    }
    return ADULT
  }
}

async function eligibilityData (params, engine) {
  let address = {
    street: '123 Fake Street',
    state: {
      abbreviation: 'CO',
      name: 'Colorado'
    },
    zip: '80403',
    occupantHistory: [
      { name: 'Joe', year: 2011 },
      { name: 'Jane', year: 2013 }
    ]
  }
  if (params.eligibilityId === 1) {
    return { age: CHILD, address }
  }
  return { age: ADULT, address }
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
      fact: 'eligibilityField',
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
    engine.addFact('eligibilityField', eligibilityField)
    engine.addFact('eligibilityData', eligibilityData)
    engine.on('success', eventSpy)
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

  describe('path', () => {
    function conditions () {
      return {
        any: [{
          fact: 'eligibilityData',
          operator: 'lessThan',
          path: '.age',
          params: {
            eligibilityId: 1
          },
          value: 50
        }]
      }
    }
    it('emits when the condition is met', async () => {
      setup(conditions())
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('does not emit when the condition fails', async () => {
      let failureCondition = conditions()
      failureCondition.any[0].params.eligibilityId = 2
      setup(failureCondition)
      await engine.run()
      expect(eventSpy).to.not.have.been.called
    })

    it('emits when complex object paths meet the conditions', async () => {
      let complexCondition = conditions()
      complexCondition.any[0].path = '.address.occupantHistory[0].year'
      complexCondition.any[0].value = 2011
      complexCondition.any[0].operator = 'equal'
      setup(complexCondition)
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('does not emit when complex object paths fail the condition', async () => {
      let complexCondition = conditions()
      complexCondition.any[0].path = '.address.occupantHistory[0].year'
      complexCondition.any[0].value = 2010
      complexCondition.any[0].operator = 'equal'
      setup(complexCondition)
      await engine.run()
      expect(eventSpy).to.not.have.been.calledWith(event)
    })

    it('treats invalid object paths as undefined', async () => {
      let complexCondition = conditions()
      complexCondition.any[0].path = '.invalid.object[99].path'
      complexCondition.any[0].value = undefined
      complexCondition.any[0].operator = 'equal'
      setup(complexCondition)
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('ignores "path" when facts return non-objects', async () => {
      setup(conditions())
      let eligibilityData = async (params, engine) => {
        return CHILD
      }
      engine.addFact('eligibilityData', eligibilityData)
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })
  })

  describe('promises', () => {
    it('works with asynchronous evaluations', async () => {
      setup()
      let eligibilityField = function (params, engine) {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(30)
          })
        })
      }
      engine.addFact('eligibilityField', eligibilityField)
      await engine.run()
      expect(eventSpy).to.have.been.called
    })
  })

  describe('synchronous functions', () => {
    it('works with synchronous, non-promise evaluations that are truthy', async () => {
      setup()
      let eligibilityField = function (params, engine) {
        return 20
      }
      engine.addFact('eligibilityField', eligibilityField)
      await engine.run()
      expect(eventSpy).to.have.been.called
    })

    it('works with synchronous, non-promise evaluations that are falsey', async () => {
      setup()
      let eligibilityField = function (params, engine) {
        return 100
      }
      engine.addFact('eligibilityField', eligibilityField)
      await engine.run()
      expect(eventSpy).to.not.have.been.called
    })
  })
})
