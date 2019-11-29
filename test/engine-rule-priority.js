'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: cache', () => {
  let engine

  const event = { type: 'setDrinkingFlag' }
  const collegeSeniorEvent = { type: 'isCollegeSenior' }
  const conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }

  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  function setup () {
    const factSpy = sandbox.stub().returns(22)
    const eventSpy = sandbox.spy()
    engine = engineFactory()
    const over20 = factories.rule({ conditions, event: collegeSeniorEvent, priority: 50 })
    engine.addRule(over20)
    const determineDrinkingAge = factories.rule({ conditions, event, priority: 100 })
    engine.addRule(determineDrinkingAge)
    const determineCollegeSenior = factories.rule({ conditions, event: collegeSeniorEvent, priority: 1 })
    engine.addRule(determineCollegeSenior)
    engine.addFact('age', factSpy)
    engine.on('success', eventSpy)
  }

  it('runs the rules in order of priority', () => {
    setup()
    expect(engine.prioritizedRules).to.be.null()
    engine.prioritizeRules()
    expect(engine.prioritizedRules.length).to.equal(3)
    expect(engine.prioritizedRules[0][0].priority).to.equal(100)
    expect(engine.prioritizedRules[1][0].priority).to.equal(50)
    expect(engine.prioritizedRules[2][0].priority).to.equal(1)
  })

  it('clears re-propriorizes the rules when a new Rule is added', () => {
    engine.prioritizeRules()
    expect(engine.prioritizedRules.length).to.equal(3)
    engine.addRule(factories.rule())
    expect(engine.prioritizedRules).to.be.null()
  })
})
