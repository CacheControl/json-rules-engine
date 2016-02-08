'use strict'

import Rule from '../src/rule'

describe('Rule', () => {
  let rule = new Rule()
  let conditionBase = factories.condition({
    fact: 'age',
    value: 50
  })

  describe('constructor()', () => {
    it('can be initialized with priority, conditions, and action', () => {
      let condition = {
        all: [ Object.assign({}, conditionBase) ]
      }
      condition.operator = 'all'
      condition.priority = 25
      let opts = {
        priority: 50,
        conditions: condition,
        action: {
          type: 'awesome'
        }
      }
      let rule = new Rule(opts)
      expect(rule.priority).to.eql(opts.priority)
      expect(rule.conditions).to.eql(opts.conditions)
      expect(rule.action).to.eql(opts.action)
    })

    it('it can be initialized with a json string', () => {
      let condition = {
        all: [ Object.assign({}, conditionBase) ]
      }
      condition.operator = 'all'
      condition.priority = 25
      let opts = {
        priority: 50,
        conditions: condition,
        action: {
          type: 'awesome'
        }
      }
      let json = JSON.stringify(opts)
      let rule = new Rule(json)
      expect(rule.priority).to.eql(opts.priority)
      expect(rule.conditions).to.eql(opts.conditions)
      expect(rule.action).to.eql(opts.action)
    })
  })

  describe('setConditions()', () => {
    describe('validations', () => {
      it('throws an exception for invalid root conditions', () => {
        expect(rule.setConditions.bind(rule, { foo: true })).to.throw(/"conditions" root must contain a single instance of "all" or "any"/)
      })
    })
  })

  describe('setPriority', () => {
    it('defaults to a priority of 1', () => {
      expect(rule.priority).to.equal(1)
    })

    it('allows a priority to be set', () => {
      rule.setPriority(10)
      expect(rule.priority).to.equal(10)
    })

    it('errors if priority is less than 0', () => {
      expect(rule.setPriority.bind(null, 0)).to.throw(/greater than zero/)
    })
  })
})
