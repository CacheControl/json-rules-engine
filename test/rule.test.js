'use strict'

import Rule from '../src/rule'

describe('Rule', () => {
  let rule = new Rule()
  let conditionBase = factories.condition({
    fact: 'age',
    value: 50
  })

  describe('testCondition', () => {
    it('evaluates "equal"', () => {
      let condition = Object.assign({}, conditionBase, { operator: 'equal' })
      expect(rule.testCondition(condition, 50)).to.equal(true)
      expect(rule.testCondition(condition, 5)).to.equal(false)
    })

    it('evaluates "notEqual"', () => {
      let condition = Object.assign({}, conditionBase, { operator: 'notEqual' })
      expect(rule.testCondition(condition, 50)).to.equal(false)
      expect(rule.testCondition(condition, 5)).to.equal(true)
    })

    it('evaluates "in"', () => {
      let condition = Object.assign({}, conditionBase, {
        operator: 'in',
        value: [5, 10, 15, 20]
      })
      expect(rule.testCondition(condition, 15)).to.equal(true)
      expect(rule.testCondition(condition, 99)).to.equal(false)
    })

    it('evaluates "notIn"', () => {
      let condition = Object.assign({}, conditionBase, {
        operator: 'notIn',
        value: [5, 10, 15, 20]
      })
      expect(rule.testCondition(condition, 15)).to.equal(false)
      expect(rule.testCondition(condition, 99)).to.equal(true)
    })

    it('evaluates "lessThan"', () => {
      let condition = Object.assign({}, conditionBase, {
        operator: 'lessThan'
      })
      expect(rule.testCondition(condition, 49)).to.equal(true)
      expect(rule.testCondition(condition, 50)).to.equal(false)
      expect(rule.testCondition(condition, 51)).to.equal(false)
    })

    it('evaluates "lessThanInclusive"', () => {
      let condition = Object.assign({}, conditionBase, {
        operator: 'lessThanInclusive'
      })
      expect(rule.testCondition(condition, 49)).to.equal(true)
      expect(rule.testCondition(condition, 50)).to.equal(true)
      expect(rule.testCondition(condition, 51)).to.equal(false)
    })
    it('evaluates "greaterThan"', () => {
      let condition = Object.assign({}, conditionBase, {
        operator: 'greaterThan'
      })
      expect(rule.testCondition(condition, 51)).to.equal(true)
      expect(rule.testCondition(condition, 49)).to.equal(false)
      expect(rule.testCondition(condition, 50)).to.equal(false)
    })
    it('evaluates "greaterThanInclusive"', () => {
      let condition = Object.assign({}, conditionBase, {
        operator: 'greaterThanInclusive'
      })
      expect(rule.testCondition(condition, 51)).to.equal(true)
      expect(rule.testCondition(condition, 50)).to.equal(true)
      expect(rule.testCondition(condition, 49)).to.equal(false)
    })
  })
})
