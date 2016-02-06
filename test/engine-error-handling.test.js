'use strict'

import engineFactory from '../src/json-business-rules'
import sinon from 'sinon'

describe('Engine: failure', () => {
  let engine

  let action = { type: 'generic' }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }]
  }
  beforeEach(() => {
    engine = engineFactory()
    let determineDrinkingAgeRule = factories.rule({ conditions, action })
    engine.addRule(determineDrinkingAgeRule)
    engine.addFact('age', function (params, engine) {
      throw new Error('problem occurred')
    })
  })

  it('surfaces errors', () => {
    return expect(engine.run()).to.eventually.rejectedWith(/problem occurred/)
  })
})
