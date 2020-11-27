'use strict'

import { Fact } from '../src/index'

describe('Fact', () => {
  function subject (id, definition, options) {
    return new Fact(id, definition, options)
  }
  describe('Fact::constructor', () => {
    it('works for constant facts', () => {
      const fact = subject('factId', 10)
      expect(fact.id).to.equal('factId')
      expect(fact.value).to.equal(10)
    })

    it('works for dynamic facts', () => {
      const fact = subject('factId', () => 10)
      expect(fact.id).to.equal('factId')
      expect(fact.calculate()).to.equal(10)
    })

    it('allows options to be passed', () => {
      const opts = { test: true, cache: false }
      const fact = subject('factId', 10, opts)
      expect(fact.options).to.eql(opts)
    })

    describe('validations', () => {
      it('throws if no id provided', () => {
        expect(subject).to.throw(/factId required/)
      })
    })
  })

  describe('Fact::types', () => {
    it('initializes facts with method values as dynamic', () => {
      const fact = subject('factId', () => {})
      expect(fact.type).to.equal(Fact.DYNAMIC)
      expect(fact.isDynamic()).to.be.true()
    })

    it('initializes facts with non-methods as constant', () => {
      const fact = subject('factId', 2)
      expect(fact.type).to.equal(Fact.CONSTANT)
      expect(fact.isConstant()).to.be.true()
    })
  })
})
