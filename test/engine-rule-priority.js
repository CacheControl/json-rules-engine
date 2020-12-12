'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: rule priorities', () => {
  let engine

  const highPriorityEvent = { type: 'highPriorityEvent' }
  const midPriorityEvent = { type: 'midPriorityEvent' }
  const lowestPriorityEvent = { type: 'lowestPriorityEvent' }
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

    const highPriorityRule = factories.rule({ conditions, event: midPriorityEvent, priority: 50 })
    engine.addRule(highPriorityRule)

    const midPriorityRule = factories.rule({ conditions, event: highPriorityEvent, priority: 100 })
    engine.addRule(midPriorityRule)

    const lowPriorityRule = factories.rule({ conditions, event: lowestPriorityEvent, priority: 1 })
    engine.addRule(lowPriorityRule)

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

  it('resolves all events returning promises before executing the next rule', async () => {
    setup()

    const highPrioritySpy = sandbox.spy()
    const midPrioritySpy = sandbox.spy()
    const lowPrioritySpy = sandbox.spy()

    engine.on(highPriorityEvent.type, () => {
      return new Promise(function (resolve) {
        setTimeout(function () {
          highPrioritySpy()
          resolve()
        }, 10) // wait longest
      })
    })
    engine.on(midPriorityEvent.type, () => {
      return new Promise(function (resolve) {
        setTimeout(function () {
          midPrioritySpy()
          resolve()
        }, 5) // wait half as much
      })
    })

    engine.on(lowestPriorityEvent.type, () => {
      lowPrioritySpy() // emit immediately. this event should still be triggered last
    })

    await engine.run()

    expect(highPrioritySpy).to.be.calledBefore(midPrioritySpy)
    expect(midPrioritySpy).to.be.calledBefore(lowPrioritySpy)
  })
})
