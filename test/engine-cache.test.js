'use strict'

import engineFactory from '../src/json-business-rules'
import sinon from 'sinon'

describe('Engine: action', () => {
  let engine

  let action = {
    type: 'setDrinkingFlag',
    params: {
      canOrderDrinks: true
    }
  }
  let collegeSeniorAction = {
    type: 'isCollegeSenior',
    params: {
      chargeGraduationFee: true
    }
  }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }

  let factSpy = sinon.stub().returns(22)
  beforeEach(() => {
    factSpy.reset()
    engine = engineFactory()
    let determineDrinkingAgeRule = factories.rule({ conditions, action, priority: 100 })
    engine.addRule(determineDrinkingAgeRule)
    let determineCollegeSenior = factories.rule({ conditions, action: collegeSeniorAction, priority: 1 })
    engine.addRule(determineCollegeSenior)
    let over20 = factories.rule({ conditions, action: collegeSeniorAction, priority: 50 })
    engine.addRule(over20)
    engine.addFact('age', factSpy)
  })

  it('loads facts once and caches the results for future use', async () => {
    let actionSpy = sinon.spy()
    engine.on('action', actionSpy)
    await engine.run()
    expect(actionSpy).to.have.been.calledThrice
    expect(factSpy).to.have.been.calledOnce
  })
})
