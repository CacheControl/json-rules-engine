'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: failure', () => {
  let engine

  let event = { type: 'generic' }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  beforeEach(() => {
    engine = engineFactory()
    let determineDrinkingAgeRule = factories.rule({ conditions, event })
    engine.addRule(determineDrinkingAgeRule)
    engine.addFact('age', 10)
  })

  it('emits an event on a rule failing', async () => {
    let failureSpy = sinon.spy()
    engine.on('failure', failureSpy)
    await engine.run()
    expect(failureSpy).to.have.been.calledWith(engine.rules[0])
  })

  it('does not emit when a rule passes', async () => {
    let failureSpy = sinon.spy()
    engine.on('failure', failureSpy)
    engine.addFact('age', 50)
    await engine.run()
    expect(failureSpy).to.not.have.been.calledOnce()
  })
})
