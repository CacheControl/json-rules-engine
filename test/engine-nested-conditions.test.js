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

  describe('path-only scoped conditions', () => {
    const event = { type: 'path-only-scoped-test' }

    beforeEach(() => {
      engine = engineFactory()
    })

    describe('basic path-only conditions inside nested block', () => {
      it('matches when path-only conditions evaluate true on at least one array item', async () => {
        const conditions = {
          all: [{
            fact: 'workersCompData',
            path: '$.payrollData',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.state', operator: 'equal', value: 'CA' },
                { path: '$.ncciCode', operator: 'equal', value: '8810' }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('workersCompData', {
          payrollData: [
            { state: 'NY', ncciCode: '8810', payroll: 50000 },
            { state: 'CA', ncciCode: '8810', payroll: 75000 },
            { state: 'TX', ncciCode: '9999', payroll: 30000 }
          ]
        })

        const eventSpy = sandbox.spy()
        engine.on('success', eventSpy)

        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })

      it('does not match when no array item satisfies all path-only conditions', async () => {
        const conditions = {
          all: [{
            fact: 'workersCompData',
            path: '$.payrollData',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.state', operator: 'equal', value: 'CA' },
                { path: '$.ncciCode', operator: 'equal', value: '8810' }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('workersCompData', {
          payrollData: [
            { state: 'NY', ncciCode: '8810', payroll: 50000 },
            { state: 'CA', ncciCode: '9999', payroll: 75000 },
            { state: 'TX', ncciCode: '5555', payroll: 30000 }
          ]
        })

        const eventSpy = sandbox.spy()
        engine.on('success', eventSpy)

        await engine.run()
        expect(eventSpy).to.not.have.been.called()
      })
    })

    describe('path-only with "any" boolean operator', () => {
      it('matches when at least one path-only condition matches on an item', async () => {
        const conditions = {
          all: [{
            fact: 'payrollItems',
            operator: 'some',
            conditions: {
              any: [
                { path: '$.state', operator: 'equal', value: 'CA' },
                { path: '$.payroll', operator: 'greaterThan', value: 100000 }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('payrollItems', [
          { state: 'NY', payroll: 50000 },
          { state: 'TX', payroll: 150000 }
        ])

        const eventSpy = sandbox.spy()
        engine.on('success', eventSpy)

        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })
    })

    describe('path-only with nested object paths', () => {
      it('resolves deeply nested paths on array items', async () => {
        const conditions = {
          all: [{
            fact: 'employees',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.department.name', operator: 'equal', value: 'Engineering' },
                { path: '$.department.budget', operator: 'greaterThan', value: 50000 }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('employees', [
          { name: 'Alice', department: { name: 'Sales', budget: 30000 } },
          { name: 'Bob', department: { name: 'Engineering', budget: 100000 } }
        ])

        const eventSpy = sandbox.spy()
        engine.on('success', eventSpy)

        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })
    })

    describe('path-only with dynamic value comparison', () => {
      it('compares path-only left side to path-only right side (same row)', async () => {
        const conditions = {
          all: [{
            fact: 'items',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.actual', operator: 'greaterThan', value: { path: '$.expected' } }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('items', [
          { actual: 50, expected: 100 },
          { actual: 150, expected: 100 }
        ])

        const eventSpy = sandbox.spy()
        engine.on('success', eventSpy)

        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })

      it('fails when no row satisfies the path comparison', async () => {
        const conditions = {
          all: [{
            fact: 'items',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.actual', operator: 'greaterThan', value: { path: '$.expected' } }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('items', [
          { actual: 50, expected: 100 },
          { actual: 80, expected: 100 }
        ])

        const eventSpy = sandbox.spy()
        engine.on('success', eventSpy)

        await engine.run()
        expect(eventSpy).to.not.have.been.called()
      })
    })

    describe('mixing path-only and fact-based conditions in nested block', () => {
      it('supports both path-only and fact-based conditions together', async () => {
        const conditions = {
          all: [{
            fact: 'items',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.status', operator: 'equal', value: 'active' },
                { fact: 'minThreshold', operator: 'lessThan', value: { path: '$.count' } }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('items', [
          { status: 'inactive', count: 20 },
          { status: 'active', count: 15 }
        ])
        engine.addFact('minThreshold', 10)

        const eventSpy = sandbox.spy()
        engine.on('success', eventSpy)

        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })
    })

    describe('toJSON serialization for path-only conditions', () => {
      it('correctly serializes path-only scoped conditions', () => {
        engine = engineFactory()

        const conditions = {
          all: [{
            fact: 'data',
            path: '$.items',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.state', operator: 'equal', value: 'CA' },
                { path: '$.code', operator: 'equal', value: '123' }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event: { type: 'test' } })
        engine.addRule(rule)

        const json = engine.rules[0].toJSON(false)
        expect(json.conditions.all[0].operator).to.equal('some')
        expect(json.conditions.all[0].fact).to.equal('data')
        expect(json.conditions.all[0].path).to.equal('$.items')
        expect(json.conditions.all[0].conditions.all).to.have.length(2)
        expect(json.conditions.all[0].conditions.all[0].path).to.equal('$.state')
        expect(json.conditions.all[0].conditions.all[0]).to.not.have.property('fact')
        expect(json.conditions.all[0].conditions.all[1].path).to.equal('$.code')
        expect(json.conditions.all[0].conditions.all[1]).to.not.have.property('fact')
      })
    })

    describe('error handling for path-only conditions outside nested context', () => {
      it('throws error when path-only condition is used outside nested block', async () => {
        const conditions = {
          all: [
            { path: '$.state', operator: 'equal', value: 'CA' }
          ]
        }

        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)

        engine.addFact('someData', { state: 'CA' })

        try {
          await engine.run()
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error.message).to.include('path-only conditions')
          expect(error.message).to.include('can only be used inside nested conditions')
        }
      })
    })

    describe('result tracking for path-only scoped conditions', () => {
      it('tracks factResult and result on path-only nested conditions', async () => {
        const conditions = {
          all: [{
            fact: 'data',
            path: '$.records',
            operator: 'some',
            conditions: {
              all: [
                { path: '$.value', operator: 'greaterThan', value: 50 }
              ]
            }
          }]
        }

        const rule = factories.rule({ conditions, event: { type: 'test' } })
        engine.addRule(rule)

        engine.addFact('data', {
          records: [
            { value: 30 },
            { value: 100 }
          ]
        })

        const results = await engine.run()

        const nestedCondition = results.results[0].conditions.all[0]
        expect(nestedCondition.result).to.equal(true)
        expect(nestedCondition.factResult).to.deep.equal([
          { value: 30 },
          { value: 100 }
        ])
      })
    })
  })
})
