'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: cache', () => {
  let engine

  let event = { type: 'setDrinkingFlag' }
  let collegeSeniorEvent = { type: 'isCollegeSenior' }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }

  let factSpy = sinon.stub().returns(22)
  let eventSpy = sinon.spy()
  function setup (factOptions) {
    factSpy.reset()
    eventSpy.reset()
    engine = engineFactory()
    let determineDrinkingAge = factories.rule({ conditions, event, priority: 100 })
    engine.addRule(determineDrinkingAge)
    let determineCollegeSenior = factories.rule({ conditions, event: collegeSeniorEvent, priority: 1 })
    engine.addRule(determineCollegeSenior)
    let over20 = factories.rule({ conditions, event: collegeSeniorEvent, priority: 50 })
    engine.addRule(over20)
    engine.addFact('age', factSpy, factOptions)
    engine.on('success', eventSpy)
  }

  it('loads facts once and caches the results for future use', async () => {
    setup({cache: true})
    await engine.run()
    expect(eventSpy).to.have.been.calledThrice()
    expect(factSpy).to.have.been.calledOnce()
  })

  it('allows caching to be turned off', async () => {
    setup({cache: false})
    await engine.run()
    expect(eventSpy).to.have.been.calledThrice()
    expect(factSpy).to.have.been.calledThrice()
  })
})
