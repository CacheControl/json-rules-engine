'use strict'

import engineFactory from '../src/json-business-rules'

describe('Engine', () => {
  let engine
  beforeEach(() => {
    engine = engineFactory()
  })

  it('has methods for managing facts and rules, and running itself', () => {
    expect(engine).to.have.property('addRule')
    expect(engine).to.have.property('addFact')
    expect(engine).to.have.property('factValue')
    expect(engine).to.have.property('run')
  })

  describe('addRule()', () => {
    describe('required fields', () => {
      it('.conditions', () => {
        let rule = factories.rule()
        delete rule.conditions
        expect(() => {
          engine.addRule(rule)
        }).to.throw(/Missing key "conditions"/)
      })

      it('.action', () => {
        let rule = factories.rule()
        delete rule.action
        expect(() => {
          engine.addRule(rule)
        }).to.throw(/Missing key "action"/)
      })
    })
  })

  describe('addFact()', () => {
    const FACT_NAME = 'FACT_NAME'
    const FACT_VALUE = 'FACT_VALUE'

    function assertFact (engine) {
      expect(Object.keys(engine.facts).length).to.equal(1)
      expect(Object.keys(engine.facts)).to.include(FACT_NAME)
    }

    it('allows a constant fact', () => {
      engine.addFact(FACT_NAME, FACT_VALUE)
      assertFact(engine)
      expect(engine.facts[FACT_NAME].value).to.equal(FACT_VALUE)
    })

    it('allows options to be passed', () => {
      let options = { cache: false }
      engine.addFact(FACT_NAME, options, FACT_VALUE)
      assertFact(engine)
      expect(engine.facts[FACT_NAME].value).to.equal(FACT_VALUE)
      expect(engine.facts[FACT_NAME].options).to.equal(options)
    })

    it('allows a lamba fact with no options', () => {
      engine.addFact(FACT_NAME, async (params, engine) => {
        return FACT_VALUE
      })
      assertFact(engine)
      expect(engine.facts[FACT_NAME].value).to.equal(null)
    })

    it('allows a lamba fact with options', () => {
      let options = { cache: false }
      engine.addFact(FACT_NAME, options, async (params, engine) => {
        return FACT_VALUE
      })
      assertFact(engine)
      expect(engine.facts[FACT_NAME].options).to.equal(options)
      expect(engine.facts[FACT_NAME].value).to.equal(null)
    })
  })

  describe('run()', () => {
    it('allows facts to be added when run', () => {
      engine.run({modelId: 'XYZ'})
      expect(engine.facts.modelId.value).to.equal('XYZ')
    })
  })

  describe('factValue', () => {
    beforeEach(() => {
      engine.addFact('foo', async (params, facts) => {
        if (params.userId) return params.userId
        return 'unknown'
      })
    })

    it('allows parameters to be passed to the fact', async () => {
      return expect(engine.factValue('foo')).to.eventually.equal('unknown')
    })

    it('allows parameters to be passed to the fact', async () => {
      return expect(engine.factValue('foo', { userId: 1 })).to.eventually.equal(1)
    })

    it('throws an exception if it encounters an undefined fact', () => {
      expect(engine.factValue('foo')).to.be.rejectedWith(/Undefined fact: foo/)
    })
  })
})
