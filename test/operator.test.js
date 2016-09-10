'use strict'

import { Operator } from '../src/index'

describe('Operator', () => {
  describe('constructor()', () => {
    function subject (...args) {
      return new Operator(...args)
    }

    it('adds the operator', () => {
      let operator = subject('startsWithLetter', (factValue, jsonValue) => {
        return factValue[0] === jsonValue
      })
      expect(operator.name).to.equal('startsWithLetter')
      expect(operator.cb).to.an.instanceof(Function)
    })

    it('operator name', () => {
      expect(() => {
        subject()
      }).to.throw(/Missing operator name/)
    })

    it('operator definition', () => {
      expect(() => {
        subject('startsWithLetter')
      }).to.throw(/Missing operator callback/)
    })
  })
})
