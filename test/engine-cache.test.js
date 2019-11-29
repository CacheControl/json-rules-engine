'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

describe('Engine: cache', () => {
  let engine
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  const event = { type: 'setDrinkingFlag' }
  const collegeSeniorEvent = { type: 'isCollegeSenior' }
  const conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }

  let factSpy
  let eventSpy
  const ageFact = () => {
    factSpy()
    return 22
  }
  function setup (factOptions) {
    factSpy = sandbox.spy()
    eventSpy = sandbox.spy()
    engine = engineFactory()
    const determineDrinkingAge = factories.rule({ conditions, event, priority: 100 })
    engine.addRule(determineDrinkingAge)
    const determineCollegeSenior = factories.rule({ conditions, event: collegeSeniorEvent, priority: 1 })
    engine.addRule(determineCollegeSenior)
    const over20 = factories.rule({ conditions, event: collegeSeniorEvent, priority: 50 })
    engine.addRule(over20)
    engine.addFact('age', ageFact, factOptions)
    engine.on('success', eventSpy)
  }

  it('loads facts once and caches the results for future use', async () => {
    setup({ cache: true })
    await engine.run()
    expect(eventSpy).to.have.been.calledThrice()
    expect(factSpy).to.have.been.calledOnce()
  })

  it('allows caching to be turned off', async () => {
    setup({ cache: false })
    await engine.run()
    expect(eventSpy).to.have.been.calledThrice()
    expect(factSpy).to.have.been.calledThrice()
  })
})
