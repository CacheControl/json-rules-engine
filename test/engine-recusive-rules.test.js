'use strict'

import engineFactory from '../src/json-business-rules'
import sinon from 'sinon'

describe('Engine: recursive rules', () => {
  let engine
  let action = { type: 'middle-income-adult' }
  let nestedAnyCondition = {
    all: [
      {
        'fact': 'age',
        'operator': 'lessThan',
        'value': 65
      },
      {
        'fact': 'age',
        'operator': 'greaterThan',
        'value': 21
      },
      {
        any: [
          {
            'fact': 'income',
            'operator': 'lessThanInclusive',
            'value': 100
          },
          {
            'fact': 'family-size',
            'operator': 'lessThanInclusive',
            'value': 3
          }
        ]
      }
    ]
  }

  let actionSpy = sinon.spy()
  function setup (conditions = nestedAnyCondition) {
    actionSpy.reset()

    engine = engineFactory()
    let rule = factories.rule({ conditions, action })
    engine.addRule(rule)
    engine.on('action', actionSpy)
  }

  describe('"all" with nested "any"', () => {
    it('evaluates true when facts pass rules', async () => {
      setup()
      engine.addFact('age', 30)
      engine.addFact('income', 30)
      engine.addFact('family-size', 2)
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup()
      engine.addFact('age', 30)
      engine.addFact('income', 200)
      engine.addFact('family-size', 8)
      await engine.run()
      expect(actionSpy).to.not.have.been.calledOnce
    })
  })

  let nestedAllCondition = {
    any: [
      {
        'fact': 'age',
        'operator': 'lessThan',
        'value': 65
      },
      {
        'fact': 'age',
        'operator': 'equal',
        'value': 70
      },
      {
        all: [
          {
            'fact': 'income',
            'operator': 'lessThanInclusive',
            'value': 100
          },
          {
            'fact': 'family-size',
            'operator': 'lessThanInclusive',
            'value': 3
          }
        ]
      }
    ]
  }

  describe('"any" with nested "all"', () => {
    it('evaluates true when facts pass rules', async () => {
      setup(nestedAllCondition)
      engine.addFact('age', 90)
      engine.addFact('income', 30)
      engine.addFact('family-size', 2)
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup(nestedAllCondition)
      engine.addFact('age', 90)
      engine.addFact('income', 200)
      engine.addFact('family-size', 2)
      await engine.run()
      expect(actionSpy).to.not.have.been.calledOnce
    })
  })

  let thriceNestedCondition = {
    any: [
      {
        all: [
          {
            any: [
              {
                'fact': 'income',
                'operator': 'lessThanInclusive',
                'value': 100
              }
            ]
          },
          {
            'fact': 'family-size',
            'operator': 'lessThanInclusive',
            'value': 3
          }
        ]
      }
    ]
  }

  describe('"any" with "all" within "any"', () => {
    it('evaluates true when facts pass rules', async () => {
      setup(thriceNestedCondition)
      engine.addFact('income', 30)
      engine.addFact('family-size', 1)
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup(thriceNestedCondition)
      engine.addFact('income', 30)
      engine.addFact('family-size', 5)
      await engine.run()
      expect(actionSpy).to.not.have.been.calledOnce
    })
  })
})
