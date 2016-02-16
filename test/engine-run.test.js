'use strict'

import engineFactory from '../src/json-rules-engine'
import sinon from 'sinon'

describe('Engine: run', () => {
  let engine

  let event = { type: 'generic' }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  let eventSpy = sinon.spy()
  let factSpy = sinon.spy()
  beforeEach(() => {
    factSpy.reset()
    eventSpy.reset()

    let factDefinition = () => {
      factSpy()
      return 24
    }

    engine = engineFactory()
    let rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addFact('age', factDefinition)
    engine.on('event', eventSpy)
  })

  it('resets the fact cache with each run', async () => {
    await engine.run()
    await engine.run()
    await engine.run()
    expect(eventSpy).to.have.been.calledThrice
    expect(factSpy).to.have.been.calledThrice
  })

  it('does not reset the fact cache if specified', async () => {
    await engine.run()
    await engine.run({}, { clearFactCache: false })
    await engine.run()
    expect(eventSpy).to.have.been.calledThrice
    expect(factSpy).to.have.been.calledTwice
  })
})
