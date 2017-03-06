'use strict'

import Condition from '../src/condition'
import defaultOperators from '../src/engine-default-operators'
import Almanac from '../src/almanac'
import Fact from '../src/fact'

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

  describe('toJSON', () => {
    it('converts the condition into a json string', () => {
      let properties = factories.condition({
        fact: 'age',
        value: {
          fact: 'weight',
          params: {
            unit: 'lbs'
          },
          path: '.value'
        }
      })
      let condition = new Condition(properties)
      let json = condition.toJSON()
      expect(json).to.equal('{"operator":"equal","value":{"fact":"weight","params":{"unit":"lbs"},"path":".value"},"fact":"age"}')
    })
  })

  describe('evaluate', () => {
    let conditionBase = factories.condition({
      fact: 'age',
      value: 50
    })
    let condition
    let almanac
    function setup (options, factValue) {
      if (typeof factValue === 'undefined') factValue = 1
      let properties = Object.assign({}, conditionBase, options)
      condition = new Condition(properties)
      let fact = new Fact(conditionBase.fact, factValue)
      almanac = new Almanac(new Map([[fact.id, fact]]))
    }

    context('validations', () => {
      beforeEach(() => setup())
      it('throws when missing an almanac', () => {
        return expect(condition.evaluate(undefined, operators)).to.be.rejectedWith('almanac required')
      })
      it('throws when missing operators', () => {
        return expect(condition.evaluate(almanac, undefined)).to.be.rejectedWith('operatorMap required')
      })
      it('throws when run against a boolean operator', () => {
        condition.all = []
        return expect(condition.evaluate(almanac, operators)).to.be.rejectedWith('Cannot evaluate() a boolean condition')
      })
    })

    it('evaluates "equal"', async () => {
      setup({ operator: 'equal' }, 50)
      expect(await condition.evaluate(almanac, operators, 50)).to.equal(true)
      setup({ operator: 'equal' }, 5)
      expect(await condition.evaluate(almanac, operators, 5)).to.equal(false)
    })

    it('evaluates "notEqual"', async () => {
      setup({ operator: 'notEqual' }, 50)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
      setup({ operator: 'notEqual' }, 5)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
    })

    it('evaluates "in"', async () => {
      setup({ operator: 'in', value: [5, 10, 15, 20] }, 15)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'in', value: [5, 10, 15, 20] }, 99)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
    })

    it('evaluates "contains"', async () => {
      setup({ operator: 'contains', value: 10 }, [5, 10, 15])
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'contains', value: 10 }, [1, 2, 3])
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
    })

    it('evaluates "doesNotContain"', async () => {
      setup({ operator: 'doesNotContain', value: 10 }, [5, 10, 15])
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
      setup({ operator: 'doesNotContain', value: 10 }, [1, 2, 3])
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
    })

    it('evaluates "notIn"', async () => {
      setup({ operator: 'notIn', value: [5, 10, 15, 20] }, 15)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
      setup({ operator: 'notIn', value: [5, 10, 15, 20] }, 99)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
    })

    it('evaluates "lessThan"', async () => {
      setup({ operator: 'lessThan' }, 49)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'lessThan' }, 50)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
      setup({ operator: 'lessThan' }, 51)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
    })

    it('evaluates "lessThanInclusive"', async () => {
      setup({ operator: 'lessThanInclusive' }, 49)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'lessThanInclusive' }, 50)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'lessThanInclusive' }, 51)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
    })

    it('evaluates "greaterThan"', async () => {
      setup({ operator: 'greaterThan' }, 51)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'greaterThan' }, 49)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
      setup({ operator: 'greaterThan' }, 50)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
    })

    it('evaluates "greaterThanInclusive"', async () => {
      setup({ operator: 'greaterThanInclusive' }, 51)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'greaterThanInclusive' }, 50)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)
      setup({ operator: 'greaterThanInclusive' }, 49)
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
    })

    describe('invalid comparisonValues', () => {
      it('returns false when using contains or doesNotContain with a non-array', async () => {
        setup({ operator: 'contains' }, null)
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
        setup({ operator: 'doesNotContain' }, null)
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
      })

      it('returns false when using comparison operators with null', async () => {
        setup({ operator: 'lessThan' }, null)
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
        setup({ operator: 'lessThanInclusive' }, null)
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
        setup({ operator: 'greaterThan' }, null)
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
        setup({ operator: 'greaterThanInclusive' }, null)
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
      })

      it('returns false when using comparison operators with non-numbers', async () => {
        setup({operator: 'lessThan'}, 'non-number')
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
        setup({operator: 'lessThan'}, null)
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
        setup({operator: 'lessThan'}, [])
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
        setup({operator: 'lessThan'}, {})
        expect(await condition.evaluate(almanac, operators)).to.equal(false)
      })
    })
  })

  describe('objects', () => {
    it('extracts the object property values using its "path" property', async () => {
      let condition = new Condition({operator: 'equal', path: '[0].id', fact: 'age', value: 50})
      let ageFact = new Fact('age', [{ id: 50 }, { id: 60 }])
      let facts = new Map([[ageFact.id, ageFact]])
      let almanac = new Almanac(facts)
      expect(await condition.evaluate(almanac, operators)).to.equal(true)

      condition.value = 100 // negative case
      expect(await condition.evaluate(almanac, operators)).to.equal(false)
    })

    it('ignores "path" when non-objects are returned by the fact', async () => {
      let ageFact = new Fact('age', 50)
      let facts = new Map([[ageFact.id, ageFact]])
      let almanac = new Almanac(facts)

      let condition = new Condition({operator: 'equal', path: '[0].id', fact: 'age', value: 50})
      expect(await condition.evaluate(almanac, operators, 50)).to.equal(true)

      condition.value = 100 // negative case
      expect(await condition.evaluate(almanac, operators, 50)).to.equal(false)
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
      expect(() => new Condition(complexCondition())).to.not.throw()
    })

    it('throws if a nested condition is invalid', () => {
      let conditions = complexCondition()
      delete conditions.all[2].any[0].fact
      expect(() => new Condition(conditions)).to.throw(/Missing key "fact"/)
    })
  })
})
