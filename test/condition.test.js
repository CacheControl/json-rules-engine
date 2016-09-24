'use strict'

import Condition from '../src/condition'
import defaultOperators from '../src/engine-default-operators'

let operators = new Map()
defaultOperators.forEach(o => operators.set(o.name, o))

function condition () {
  return {
    all: [{
      id: '6ed20017-375f-40c9-a1d2-6d7e0f4733c5',
      fact: 'team_participation',
      operator: 'equal',
      value: 50,
      path: '.metrics[0].forum-posts'
    }]
  }
}

describe('Condition', () => {
  describe('constructor', () => {
    it('fact conditions have properties', () => {
      let properties = condition()
      let subject = new Condition(properties.all[0])
      expect(subject).to.have.property('fact')
      expect(subject).to.have.property('operator')
      expect(subject).to.have.property('value')
      expect(subject).to.have.property('path')
    })

    it('boolean conditions have properties', () => {
      let properties = condition()
      let subject = new Condition(properties)
      expect(subject).to.have.property('operator')
      expect(subject).to.have.property('priority')
      expect(subject.priority).to.equal(1)
    })
  })

  describe('evaluate', () => {
    let conditionBase = factories.condition({
      fact: 'age',
      value: 50
    })
    let condition
    function setup (options) {
      let properties = Object.assign({}, conditionBase, options)
      condition = new Condition(properties)
    }

    it('evaluates "equal"', () => {
      setup({ operator: 'equal' })
      expect(condition.evaluate(50, operators)).to.equal(true)
      expect(condition.evaluate(5, operators)).to.equal(false)
    })

    it('evaluates "notEqual"', () => {
      setup({ operator: 'notEqual' })
      expect(condition.evaluate(50, operators)).to.equal(false)
      expect(condition.evaluate(5, operators)).to.equal(true)
    })

    it('evaluates "in"', () => {
      setup({
        operator: 'in',
        value: [5, 10, 15, 20]
      })
      expect(condition.evaluate(15, operators)).to.equal(true)
      expect(condition.evaluate(99, operators)).to.equal(false)
    })

    it('evaluates "contains"', () => {
      setup({
        operator: 'contains',
        value: 10
      })
      expect(condition.evaluate([5, 10, 15], operators)).to.equal(true)
      expect(condition.evaluate([1, 2, 3], operators)).to.equal(false)
    })

    it('evaluates "doesNotContain"', () => {
      setup({
        operator: 'doesNotContain',
        value: 10
      })
      expect(condition.evaluate([5, 10, 15], operators)).to.equal(false)
      expect(condition.evaluate([1, 2, 3], operators)).to.equal(true)
    })

    it('evaluates "notIn"', () => {
      setup({
        operator: 'notIn',
        value: [5, 10, 15, 20]
      })
      expect(condition.evaluate(15, operators)).to.equal(false)
      expect(condition.evaluate(99, operators)).to.equal(true)
    })

    it('evaluates "lessThan"', () => {
      setup({ operator: 'lessThan' })
      expect(condition.evaluate(49, operators)).to.equal(true)
      expect(condition.evaluate(50, operators)).to.equal(false)
      expect(condition.evaluate(51, operators)).to.equal(false)
    })

    it('evaluates "lessThanInclusive"', () => {
      setup({ operator: 'lessThanInclusive' })
      expect(condition.evaluate(49, operators)).to.equal(true)
      expect(condition.evaluate(50, operators)).to.equal(true)
      expect(condition.evaluate(51, operators)).to.equal(false)
    })
    it('evaluates "greaterThan"', () => {
      setup({ operator: 'greaterThan' })
      expect(condition.evaluate(51, operators)).to.equal(true)
      expect(condition.evaluate(49, operators)).to.equal(false)
      expect(condition.evaluate(50, operators)).to.equal(false)
    })
    it('evaluates "greaterThanInclusive"', () => {
      setup({operator: 'greaterThanInclusive'})
      expect(condition.evaluate(51, operators)).to.equal(true)
      expect(condition.evaluate(50, operators)).to.equal(true)
      expect(condition.evaluate(49, operators)).to.equal(false)
    })

    describe('invalid comparisonValues', () => {
      it('returns false when using contains or doesNotContain with a non-array', () => {
        setup({operator: 'contains'})
        expect(condition.evaluate(null, operators)).to.equal(false)
        setup({operator: 'doesNotContain'})
        expect(condition.evaluate(null, operators)).to.equal(false)
      })

      it('returns false when using comparison operators with null', () => {
        setup({operator: 'lessThan'})
        expect(condition.evaluate(null, operators)).to.equal(false)
        setup({operator: 'lessThanInclusive'})
        expect(condition.evaluate(null, operators)).to.equal(false)
        setup({operator: 'greaterThan'})
        expect(condition.evaluate(null, operators)).to.equal(false)
        setup({operator: 'greaterThanInclusive'})
        expect(condition.evaluate(null, operators)).to.equal(false)
      })

      it('returns false when using comparison operators with non-numbers', () => {
        setup({operator: 'lessThan'})
        expect(condition.evaluate('non-number', operators)).to.equal(false)
        setup({operator: 'lessThan'})
        expect(condition.evaluate(undefined, operators)).to.equal(false)
        setup({operator: 'lessThan'})
        expect(condition.evaluate([], operators)).to.equal(false)
        setup({operator: 'lessThan'})
        expect(condition.evaluate({}, operators)).to.equal(false)
      })
    })
  })

  describe('objects', () => {
    it('extracts the object property values using its "path" property', () => {
      let factData = [{ id: 50 }, { id: 60 }]
      let condition = new Condition({operator: 'equal', path: '[0].id', fact: 'age', value: 50})
      expect(condition.evaluate(factData, operators)).to.equal(true)

      condition.value = 100 // negative case
      expect(condition.evaluate(factData, operators)).to.equal(false)
    })

    it('ignores "path" when non-objects are returned by the fact', () => {
      let condition = new Condition({operator: 'equal', path: '[0].id', fact: 'age', value: 50})
      expect(condition.evaluate(50, operators)).to.equal(true)

      condition.value = 100 // negative case
      expect(condition.evaluate(50, operators)).to.equal(false)
    })
  })

  describe('boolean operators', () => {
    it('throws if not not an array', () => {
      let conditions = condition()
      conditions.all = { foo: true }
      expect(() => new Condition(conditions)).to.throw(/"all" must be an array/)
    })
  })

  describe('atomic facts', () => {
    it('throws for a missing "operator"', () => {
      let conditions = condition()
      delete conditions.all[0].operator
      expect(() => new Condition(conditions)).to.throw(/Missing key "operator"/)
    })

    it('throws for a missing "fact"', () => {
      let conditions = condition()
      delete conditions.all[0].fact
      expect(() => new Condition(conditions)).to.throw(/Missing key "fact"/)
    })

    it('throws for a missing "value"', () => {
      let conditions = condition()
      delete conditions.all[0].value
      expect(() => new Condition(conditions)).to.throw(/Missing key "value"/)
    })
  })

  describe('complex conditions', () => {
    function complexCondition () {
      return {
        all: [
          {
            'fact': 'age',
            'operator': 'lessThan',
            'value': 45
          },
          {
            'fact': 'pointBalance',
            'operator': 'greaterThanInclusive',
            'value': 1000
          },
          {
            any: [
              {
                'fact': 'gender',
                'operator': 'equal',
                'value': 'female'
              },
              {
                'fact': 'income',
                'operator': 'greaterThanInclusive',
                'value': 50000
              }
            ]
          }
        ]
      }
    }
    it('recursively parses nested conditions', () => {
      expect(() => new Condition(complexCondition())).to.not.throw
    })

    it('throws if a nested condition is invalid', () => {
      let conditions = complexCondition()
      delete conditions.all[2].any[0].fact
      expect(() => new Condition(conditions)).to.throw(/Missing key "fact"/)
    })
  })
})
