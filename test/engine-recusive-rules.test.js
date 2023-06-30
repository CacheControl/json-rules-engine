'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: recursive rules', () => {
  let engine
  const event = { type: 'middle-income-adult' }
  const nestedAnyCondition = {
    all: [
      {
        fact: 'age',
        operator: 'lessThan',
        value: 65
      },
      {
        fact: 'age',
        operator: 'greaterThan',
        value: 21
      },
      {
        any: [
          {
            fact: 'income',
            operator: 'lessThanInclusive',
            value: 100
          },
          {
            fact: 'family-size',
            operator: 'lessThanInclusive',
            value: 3
          }
        ]
      }
    ]
  }

  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  let eventSpy
  function setup (conditions = nestedAnyCondition) {
    eventSpy = sandbox.spy()

    engine = engineFactory()
    const rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.on('success', eventSpy)
  }

  describe('"all" with nested "any"', () => {
    it('evaluates true when facts pass rules', async () => {
      setup()
      engine.addFact('age', 30)
      engine.addFact('income', 30)
      engine.addFact('family-size', 2)
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup()
      engine.addFact('age', 30)
      engine.addFact('income', 200)
      engine.addFact('family-size', 8)
      await engine.run()
      expect(eventSpy).to.not.have.been.calledOnce()
    })
  })

  const nestedAllCondition = {
    any: [
      {
        fact: 'age',
        operator: 'lessThan',
        value: 65
      },
      {
        fact: 'age',
        operator: 'equal',
        value: 70
      },
      {
        all: [
          {
            fact: 'income',
            operator: 'lessThanInclusive',
            value: 100
          },
          {
            fact: 'family-size',
            operator: 'lessThanInclusive',
            value: 3
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
      expect(eventSpy).to.have.been.calledOnce()
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup(nestedAllCondition)
      engine.addFact('age', 90)
      engine.addFact('income', 200)
      engine.addFact('family-size', 2)
      await engine.run()
      expect(eventSpy).to.not.have.been.calledOnce()
    })
  })

  const thriceNestedCondition = {
    any: [
      {
        all: [
          {
            any: [
              {
                fact: 'income',
                operator: 'lessThanInclusive',
                value: 100
              }
            ]
          },
          {
            fact: 'family-size',
            operator: 'lessThanInclusive',
            value: 3
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
      expect(eventSpy).to.have.been.calledOnce()
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup(thriceNestedCondition)
      engine.addFact('income', 30)
      engine.addFact('family-size', 5)
      await engine.run()
      expect(eventSpy).to.not.have.been.calledOnce()
    })
  })

  const notNotCondition = {
    not: {
      not: {
        fact: 'age',
        operator: 'lessThan',
        value: 65
      }
    }
  }

  describe('"not" nested directly within a "not"', () => {
    it('evaluates true when facts pass rules', async () => {
      setup(notNotCondition)
      engine.addFact('age', 30)
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup(notNotCondition)
      engine.addFact('age', 65)
      await engine.run()
      expect(eventSpy).to.not.have.been.calledOnce()
    })
  })

  const nestedNotCondition = {
    not: {
      all: [
        {
          fact: 'age',
          operator: 'lessThan',
          value: 65
        },
        {
          fact: 'age',
          operator: 'greaterThan',
          value: 21
        },
        {
          not: {
            fact: 'income',
            operator: 'lessThanInclusive',
            value: 100
          }
        }
      ]
    }
  }

  describe('outer "not" with nested "all" and nested "not" condition', () => {
    it('evaluates true when facts pass rules', async () => {
      setup(nestedNotCondition)
      engine.addFact('age', 30)
      engine.addFact('income', 100)
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
    })

    it('evaluates false when facts do not pass rules', async () => {
      setup(nestedNotCondition)
      engine.addFact('age', 30)
      engine.addFact('income', 101)
      await engine.run()
      expect(eventSpy).to.not.have.been.calledOnce()
    })
  })
})
