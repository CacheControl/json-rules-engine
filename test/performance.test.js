'use strict'

import engineFactory from '../src/index'
import perfy from 'perfy'
import deepClone from 'clone'

describe('Performance', () => {
  const baseConditions = {
    any: [{
      fact: 'age',
      operator: 'lessThan',
      value: 50
    },
    {
      fact: 'segment',
      operator: 'equal',
      value: 'european'
    }]
  }
  const event = {
    type: 'ageTrigger',
    params: {
      demographic: 'under50'
    }
  }
  /*
    * Generates an array of integers of length 'num'
    */
  function range (num) {
    return Array.from(Array(num).keys())
  }

  function setup (conditions) {
    const engine = engineFactory()
    const config = deepClone({ conditions, event })
    range(1000).forEach(() => {
      const rule = factories.rule(config)
      engine.addRule(rule)
    })
    engine.addFact('segment', 'european', { cache: true })
    engine.addFact('age', 15, { cache: true })
    return engine
  }

  it('performs "any" quickly', async () => {
    const engine = setup(baseConditions)
    perfy.start('any')
    await engine.run()
    const result = perfy.end('any')
    expect(result.time).to.be.greaterThan(0.02)
    expect(result.time).to.be.lessThan(0.5)
  })

  it('performs "all" quickly', async () => {
    const conditions = deepClone(baseConditions)
    conditions.all = conditions.any
    delete conditions.any
    const engine = setup(conditions)
    perfy.start('all')
    await engine.run()
    const result = perfy.end('all')
    expect(result.time).to.be.greaterThan(0.01) // assert lower value
    expect(result.time).to.be.lessThan(0.5)
  })
})
