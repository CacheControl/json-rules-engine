'use strict'

import engineFactory from '../src/index'

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
    engine.addFact('age', function (params, engine) {
      throw new Error('problem occurred')
    })
  })

  it('surfaces errors', () => {
    return expect(engine.run()).to.eventually.rejectedWith(/problem occurred/)
  })
})
