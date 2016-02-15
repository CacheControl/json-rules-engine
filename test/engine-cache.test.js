'use strict'

import engineFactory from '../src/json-rules-engine'
import sinon from 'sinon'

describe('Engine: cache', () => {
  let engine

  let action = { type: 'setDrinkingFlag' }
  let collegeSeniorAction = { type: 'isCollegeSenior' }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }

  let factSpy = sinon.stub().returns(22)
  let actionSpy = sinon.spy()
  function setup (factOptions) {
    factSpy.reset()
    actionSpy.reset()
    engine = engineFactory()
    let determineDrinkingAge = factories.rule({ conditions, action, priority: 100 })
    engine.addRule(determineDrinkingAge)
    let determineCollegeSenior = factories.rule({ conditions, action: collegeSeniorAction, priority: 1 })
    engine.addRule(determineCollegeSenior)
    let over20 = factories.rule({ conditions, action: collegeSeniorAction, priority: 50 })
    engine.addRule(over20)
    engine.addFact('age', factSpy, factOptions)
    engine.on('action', actionSpy)
  }

  it('loads facts once and caches the results for future use', async () => {
    setup({cache: true})
    await engine.run()
    expect(actionSpy).to.have.been.calledThrice
    expect(factSpy).to.have.been.calledOnce
  })

  it('allows caching to be turned off', async () => {
    setup({cache: false})
    await engine.run()
    expect(actionSpy).to.have.been.calledThrice
    expect(factSpy).to.have.been.calledThrice
  })
})
