'use strict'

import { Fact } from '../src/index'

describe('Fact', () => {
  describe('Fact::constructor', () => {
    function subject (id, definition, options) {
      return new Fact(id, definition, options)
    }

    it('works for constant facts', () => {
      let fact = subject('factId', 10)
      expect(fact.id).to.equal('factId')
      expect(fact.value).to.equal(10)
    })

    it('works for dynamic facts', () => {
      let fact = subject('factId', () => 10)
      expect(fact.id).to.equal('factId')
      expect(fact.calculate()).to.equal(10)
    })

    it('allows options to be passed', () => {
      let opts = { test: true, cache: false }
      let fact = subject('factId', 10, opts)
      expect(fact.options).to.eql(opts)
    })

    describe('validations', () => {
      it('throws if no id provided', () => {
        expect(subject).to.throw(/factId required/)
      })

      it('throws if no definition provided', () => {
        expect(subject.bind(null, 'factId')).to.throw(/facts must have a value or method/)
      })
    })
  })
})
