'use strict'

import Condition from '../src/condition'

function condition () {
  return {
    all: [{
      id: '6ed20017-375f-40c9-a1d2-6d7e0f4733c5',
      fact: 'team_participation',
      operator: 'equal',
      value: 50
    }]
  }
}

describe('Condition', () => {
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
