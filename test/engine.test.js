'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'
import { Fact } from '../src/index'
import { Rule } from '../src/index'

describe('Engine', () => {
  let engine
  beforeEach(() => {
    engine = engineFactory()
  })

  it('has methods for managing facts and rules, and running itself', () => {
    expect(engine).to.have.property('addRule')
    expect(engine).to.have.property('addFact')
    expect(engine).to.have.property('run')
    expect(engine).to.have.property('stop')
  })

  describe('constructor', () => {
    it('begins in status "READY"', () => {
      expect(engine.status).to.equal('READY')
    })

    it('can be initialized with rules', () => {
      let rules = [
        factories.rule(),
        factories.rule(),
        factories.rule()
      ]
      engine = engineFactory(rules)
      expect(engine.rules.length).to.equal(rules.length)
    })
  })

  describe('stop()', () => {
    it('changes the status to "FINISHED"', () => {
      expect(engine.stop().status).to.equal('FINISHED')
    })
  })

  describe('addRule()', () => {
    describe('rule instance', () => {
      it('adds the rule', () => {
        let rule = new Rule(factories.rule())
        expect(engine.rules.length).to.equal(0)
        engine.addRule(rule)
        expect(engine.rules.length).to.equal(1)
        expect(engine.rules).to.include(rule)
      })
    })

    describe('required fields', () => {
      it('.conditions', () => {
        let rule = factories.rule()
        delete rule.conditions
        expect(() => {
          engine.addRule(rule)
        }).to.throw(/Missing key "conditions"/)
      })

      it('.event', () => {
        let rule = factories.rule()
        delete rule.event
        expect(() => {
          engine.addRule(rule)
        }).to.throw(/Missing key "event"/)
      })
    })
  })

  describe('addFact()', () => {
    const FACT_NAME = 'FACT_NAME'
    const FACT_VALUE = 'FACT_VALUE'

    function assertFact (engine) {
      expect(engine.facts.size).to.equal(1)
      expect(engine.facts.has(FACT_NAME)).to.be.true
    }

    it('allows a constant fact', () => {
      engine.addFact(FACT_NAME, FACT_VALUE)
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME).value).to.equal(FACT_VALUE)
    })

    it('allows options to be passed', () => {
      let options = { cache: false }
      engine.addFact(FACT_NAME, FACT_VALUE, options)
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME).value).to.equal(FACT_VALUE)
      expect(engine.facts.get(FACT_NAME).options).to.eql(options)
    })

    it('allows a lamba fact with no options', () => {
      engine.addFact(FACT_NAME, async (params, engine) => {
        return FACT_VALUE
      })
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME).value).to.be.undefined
    })

    it('allows a lamba fact with options', () => {
      let options = { cache: false }
      engine.addFact(FACT_NAME, async (params, engine) => {
        return FACT_VALUE
      }, options)
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME).options).to.eql(options)
      expect(engine.facts.get(FACT_NAME).value).to.be.undefined
    })

    it('allows a fact instance', () => {
      let options = { cache: false }
      let fact = new Fact(FACT_NAME, 50, options)
      engine.addFact(fact)
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME)).to.exist
      expect(engine.facts.get(FACT_NAME).options).to.eql(options)
    })
  })

  describe('run()', () => {
    beforeEach(() => {
      let conditions = {
        all: [{
          fact: 'age',
          operator: 'greaterThanInclusive',
          value: 18
        }]
      }
      let event = { type: 'generic' }
      let rule = factories.rule({ conditions, event })
      engine.addRule(rule)
      engine.addFact('age', 20)
    })

    it('changes the status to "RUNNING"', () => {
      let eventSpy = sinon.spy()
      engine.on('success', (event, engine) => {
        eventSpy()
        expect(engine.status).to.equal('RUNNING')
      })
      return engine.run()
    })

    it('changes status to FINISHED once complete', async () => {
      expect(engine.status).to.equal('READY')
      await engine.run()
      expect(engine.status).to.equal('FINISHED')
    })
  })
})
