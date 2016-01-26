'use strict'

let subject = require('../src/index')

describe('json-business-subject', () => {
  it('has methods for managing facts and subject', () => {
    let set = subject('set1')
    expect(set).to.have.ownProperty('addRule')
    expect(set).to.have.ownProperty('addFact')
  })

  it('treats each rule set independently', () => {
    let set1 = subject('set1')
    let set2 = subject('set2')
    set1.addRule(factories.rule())
    set2.addRule(factories.rule())
    expect(set1.rules.length).to.equal(1)
    expect(set2.rules.length).to.equal(1)
  })

  describe('addRule()', () => {
    describe('required fields', () => {
      it('.conditions', () => {
        let rule = factories.rule()
        delete rule.conditions
        expect(() => {
          subject('set1').addRule(rule)
        }).to.throw(/Missing key "conditions"/)
      })

      it('.action', () => {
        let rule = factories.rule()
        delete rule.action
        expect(() => {
          subject('set1').addRule(rule)
        }).to.throw(/Missing key "action"/)
      })
    })
  })

  describe('addFact()', () => {
    let set
    const FACT_NAME = 'FACT_NAME'
    const FACT_VALUE = 'FACT_VALUE'

    beforeEach(() => { set = subject('set1') })

    function assertFact(set) {
      expect(Object.keys(set.facts).length).to.equal(1)
      expect(Object.keys(set.facts)).to.include(FACT_NAME)
    }

    it('allows a constant fact', () => {
      set.addFact(FACT_NAME, FACT_VALUE)
      assertFact(set)
      expect(set.facts[FACT_NAME].val).to.equal(FACT_VALUE)
    })

    it('allows options to be passed', () => {
      let options = { cache: false }
      set.addFact(FACT_NAME, options, FACT_VALUE)
      assertFact(set)
      expect(set.facts[FACT_NAME].val).to.equal(FACT_VALUE)
      expect(set.facts[FACT_NAME].options).to.equal(options)
    })

    it('allows a lamba fact with no options', () => {
      set.addFact(FACT_NAME, (params, facts, done) => {
        done(null, FACT_VALUE)
      })
      assertFact(set)
      expect(set.facts[FACT_NAME].val).to.equal(null)
    })

    it('allows a lamba fact with options', () => {
      let options = { cache: false }
      set.addFact(FACT_NAME, options, (params, facts, done) => {
        done(null, FACT_VALUE)
      })
      assertFact(set)
      expect(set.facts[FACT_NAME].options).to.equal(options)
      expect(set.facts[FACT_NAME].val).to.equal(null)
    })
  })
})
