'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: failure', () => {
  let engine
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  const event = { type: 'generic' }
  const conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  beforeEach(() => {
    engine = engineFactory()
    const determineDrinkingAgeRule = factories.rule({ conditions, event })
    engine.addRule(determineDrinkingAgeRule)
    engine.addFact('age', 10)
  })

  it('emits an event on a rule failing', async () => {
    const failureSpy = sandbox.spy()
    engine.on('failure', failureSpy)
    await engine.run()
    expect(failureSpy).to.have.been.calledWith(engine.rules[0].ruleEvent)
  })

  it('does not emit when a rule passes', async () => {
    const failureSpy = sandbox.spy()
    engine.on('failure', failureSpy)
    engine.addFact('age', 50)
    await engine.run()
    expect(failureSpy).to.not.have.been.calledOnce()
  })
})
