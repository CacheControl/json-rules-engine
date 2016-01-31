'use strict'

import engineFactory from '../src/json-business-rules'
import sinon from 'sinon'

describe('Engine: run', () => {
  let engine

  let action = { type: 'generic' }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  let actionSpy = sinon.spy()
  let factSpy = sinon.spy()
  beforeEach(() => {
    factSpy.reset()
    actionSpy.reset()

    let factDefinition = () => {
      factSpy()
      return 24
    }

    engine = engineFactory()
    let rule = factories.rule({ conditions, action })
    engine.addRule(rule)
    engine.addFact('age', factDefinition)
    engine.on('action', actionSpy)
  })

  it('resets the fact cache with each run', async () => {
    await engine.run()
    await engine.run()
    await engine.run()
    expect(actionSpy).to.have.been.calledThrice
    expect(factSpy).to.have.been.calledThrice
  })

  it('does not reset the fact cache if specified', async () => {
    await engine.run()
    await engine.run({}, { clearFactCache: false })
    await engine.run()
    expect(actionSpy).to.have.been.calledThrice
    expect(factSpy).to.have.been.calledTwice
  })
})
