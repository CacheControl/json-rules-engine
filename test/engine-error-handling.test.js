'use strict'

import engineFactory from '../src/index'

describe('Engine: failure', () => {
  let engine

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
    engine.addFact('age', function (params, engine) {
      throw new Error('problem occurred')
    })
  })

  it('surfaces errors', () => {
    return expect(engine.run()).to.eventually.rejectedWith(/problem occurred/)
  })
})
