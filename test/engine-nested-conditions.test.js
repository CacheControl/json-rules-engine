'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

describe('Engine: nested conditions', () => {
  let engine
  let sandbox

  before(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('basic nested condition with "some" operator', () => {
    const event = {
      type: 'bonus-threshold-met'
    }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('emits when at least one array item matches all nested conditions', async () => {
      const conditions = {
        all: [{
          fact: 'payrollItems',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'type', operator: 'equal', value: 'bonus' },
              { fact: 'amount', operator: 'greaterThan', value: 300 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('payrollItems', [
        { type: 'bonus', amount: 500 },
        { type: 'salary', amount: 1000 },
        { type: 'bonus', amount: 200 }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('does not emit when no array item matches all nested conditions', async () => {
      const conditions = {
        all: [{
          fact: 'payrollItems',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'type', operator: 'equal', value: 'bonus' },
              { fact: 'amount', operator: 'greaterThan', value: 300 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('payrollItems', [
        { type: 'bonus', amount: 100 },
        { type: 'salary', amount: 1000 },
        { type: 'bonus', amount: 200 }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })
  })

  describe('nested condition with "all" inside conditions', () => {
    const event = { type: 'all-conditions-match' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('passes when all conditions inside match for at least one item', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'status', operator: 'equal', value: 'active' },
              { fact: 'count', operator: 'greaterThan', value: 5 },
              { fact: 'enabled', operator: 'equal', value: true }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [
        { status: 'inactive', count: 10, enabled: true },
        { status: 'active', count: 10, enabled: true },
        { status: 'active', count: 3, enabled: true }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })
  })

  describe('nested condition with "any" inside conditions', () => {
    const event = { type: 'any-condition-match' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('passes when any condition inside matches for at least one item', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            any: [
              { fact: 'status', operator: 'equal', value: 'premium' },
              { fact: 'level', operator: 'greaterThan', value: 10 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [
        { status: 'basic', level: 1 },
        { status: 'basic', level: 15 }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('fails when no item matches any condition', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            any: [
              { fact: 'status', operator: 'equal', value: 'premium' },
              { fact: 'level', operator: 'greaterThan', value: 10 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [
        { status: 'basic', level: 1 },
        { status: 'standard', level: 5 }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })
  })

  describe('nested condition with "not" inside conditions', () => {
    const event = { type: 'not-condition-match' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('passes when negated condition is false for at least one item', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            not: {
              fact: 'disabled',
              operator: 'equal',
              value: true
            }
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [
        { disabled: true },
        { disabled: false }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('fails when negated condition is true for all items', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            not: {
              fact: 'disabled',
              operator: 'equal',
              value: true
            }
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [
        { disabled: true },
        { disabled: true }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })
  })

  describe('recursive nesting (nested within nested)', () => {
    const event = { type: 'recursive-nested-match' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('supports nested conditions within nested conditions', async () => {
      const conditions = {
        all: [{
          fact: 'departments',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'name', operator: 'equal', value: 'Engineering' },
              {
                fact: 'employees',
                operator: 'some',
                conditions: {
                  all: [
                    { fact: 'role', operator: 'equal', value: 'developer' },
                    { fact: 'yearsExperience', operator: 'greaterThan', value: 5 }
                  ]
                }
              }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('departments', [
        {
          name: 'Sales',
          employees: [
            { role: 'manager', yearsExperience: 10 }
          ]
        },
        {
          name: 'Engineering',
          employees: [
            { role: 'developer', yearsExperience: 2 },
            { role: 'developer', yearsExperience: 8 }
          ]
        }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('fails when inner nested condition does not match', async () => {
      const conditions = {
        all: [{
          fact: 'departments',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'name', operator: 'equal', value: 'Engineering' },
              {
                fact: 'employees',
                operator: 'some',
                conditions: {
                  all: [
                    { fact: 'role', operator: 'equal', value: 'developer' },
                    { fact: 'yearsExperience', operator: 'greaterThan', value: 5 }
                  ]
                }
              }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('departments', [
        {
          name: 'Engineering',
          employees: [
            { role: 'developer', yearsExperience: 2 },
            { role: 'developer', yearsExperience: 3 }
          ]
        }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })
  })

  describe('empty array returns false', () => {
    const event = { type: 'empty-array-test' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('returns false when array is empty', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'value', operator: 'greaterThan', value: 0 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })
  })

  describe('non-array fact returns false', () => {
    const event = { type: 'non-array-test' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('returns false when fact is not an array (object)', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'value', operator: 'greaterThan', value: 0 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', { value: 100 })

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })

    it('returns false when fact is null', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'value', operator: 'greaterThan', value: 0 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', null)

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })

    it('returns false when fact is a primitive', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'value', operator: 'greaterThan', value: 0 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', 'string value')

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })
  })

  describe('path support in parent condition', () => {
    const event = { type: 'path-support-test' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('supports path on the parent condition to extract array', async () => {
      const conditions = {
        all: [{
          fact: 'data',
          path: '$.items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'type', operator: 'equal', value: 'special' }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('data', {
        items: [
          { type: 'regular' },
          { type: 'special' }
        ]
      })

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })
  })

  describe('path support in nested conditions', () => {
    const event = { type: 'nested-path-test' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('supports path on nested condition facts', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'metadata', path: '$.status', operator: 'equal', value: 'active' }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [
        { metadata: { status: 'inactive' } },
        { metadata: { status: 'active' } }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })
  })

  describe('nested conditions with fact params', () => {
    const event = { type: 'fact-params-test' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('supports params on the parent condition fact', async () => {
      const conditions = {
        all: [{
          fact: 'getData',
          params: { category: 'electronics' },
          operator: 'some',
          conditions: {
            all: [
              { fact: 'price', operator: 'lessThan', value: 100 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('getData', (params) => {
        if (params.category === 'electronics') {
          return [
            { name: 'phone', price: 500 },
            { name: 'cable', price: 50 }
          ]
        }
        return []
      })

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })
  })

  describe('fallback to parent almanac for non-item properties', () => {
    const event = { type: 'parent-almanac-fallback' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('uses parent almanac for facts not on the current item', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'type', operator: 'equal', value: 'bonus' },
              { fact: 'minimumAmount', operator: 'lessThan', value: { fact: 'amount' } }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('items', [
        { type: 'bonus', amount: 500 },
        { type: 'salary', amount: 1000 }
      ])
      engine.addFact('minimumAmount', 300)

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })
  })

  describe('toJSON serialization', () => {
    it('correctly serializes nested conditions', () => {
      engine = engineFactory()

      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'type', operator: 'equal', value: 'special' },
              { fact: 'count', operator: 'greaterThan', value: 10 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event: { type: 'test' } })
      engine.addRule(rule)

      const json = engine.rules[0].toJSON(false)
      expect(json.conditions.all[0].operator).to.equal('some')
      expect(json.conditions.all[0].fact).to.equal('items')
      expect(json.conditions.all[0].conditions.all).to.have.length(2)
      expect(json.conditions.all[0].conditions.all[0].fact).to.equal('type')
      expect(json.conditions.all[0].conditions.all[1].fact).to.equal('count')
    })
  })

  describe('nested conditions with multiple nested conditions at same level', () => {
    const event = { type: 'multiple-nested' }

    beforeEach(() => {
      engine = engineFactory()
    })

    it('evaluates multiple nested conditions correctly', async () => {
      const conditions = {
        all: [
          {
            fact: 'orders',
            operator: 'some',
            conditions: {
              all: [
                { fact: 'status', operator: 'equal', value: 'completed' }
              ]
            }
          },
          {
            fact: 'payments',
            operator: 'some',
            conditions: {
              all: [
                { fact: 'verified', operator: 'equal', value: true }
              ]
            }
          }
        ]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('orders', [
        { status: 'pending' },
        { status: 'completed' }
      ])
      engine.addFact('payments', [
        { verified: false },
        { verified: true }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('fails when one nested condition fails', async () => {
      const conditions = {
        all: [
          {
            fact: 'orders',
            operator: 'some',
            conditions: {
              all: [
                { fact: 'status', operator: 'equal', value: 'completed' }
              ]
            }
          },
          {
            fact: 'payments',
            operator: 'some',
            conditions: {
              all: [
                { fact: 'verified', operator: 'equal', value: true }
              ]
            }
          }
        ]
      }

      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)

      engine.addFact('orders', [
        { status: 'pending' },
        { status: 'completed' }
      ])
      engine.addFact('payments', [
        { verified: false },
        { verified: false }
      ])

      const eventSpy = sandbox.spy()
      engine.on('success', eventSpy)

      await engine.run()
      expect(eventSpy).to.not.have.been.called()
    })
  })

  describe('result tracking in nested conditions', () => {
    beforeEach(() => {
      engine = engineFactory()
    })

    it('sets factResult and result on the nested condition', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'value', operator: 'greaterThan', value: 50 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event: { type: 'test' } })
      engine.addRule(rule)

      const items = [
        { value: 30 },
        { value: 100 }
      ]
      engine.addFact('items', items)

      const results = await engine.run()

      const nestedCondition = results.results[0].conditions.all[0]
      expect(nestedCondition.result).to.equal(true)
      expect(nestedCondition.factResult).to.deep.equal(items)
    })

    it('sets result to false when no items match', async () => {
      const conditions = {
        all: [{
          fact: 'items',
          operator: 'some',
          conditions: {
            all: [
              { fact: 'value', operator: 'greaterThan', value: 200 }
            ]
          }
        }]
      }

      const rule = factories.rule({ conditions, event: { type: 'test' } })
      engine.addRule(rule)

      const items = [
        { value: 30 },
        { value: 100 }
      ]
      engine.addFact('items', items)

      const results = await engine.run()

      const nestedCondition = results.failureResults[0].conditions.all[0]
      expect(nestedCondition.result).to.equal(false)
      expect(nestedCondition.factResult).to.deep.equal(items)
    })
  })
})
