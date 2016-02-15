'use strict'

import sinon from 'sinon'
import engineFactory from '../src/json-rules-engine'
import { Fact } from '../src/json-rules-engine'
import { Rule } from '../src/json-rules-engine'

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
      let action = { type: 'generic' }
      let rule = factories.rule({ conditions, action })
      engine.addRule(rule)
      engine.addFact('age', 20)
    })

    it('allows facts to be added when run', () => {
      engine.run({modelId: 'XYZ'})
      expect(engine.facts.get('modelId').value).to.equal('XYZ')
    })

    it('changes the status to "RUNNING"', () => {
      let actionSpy = sinon.spy()
      engine.on('action', (action, engine) => {
        actionSpy()
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

  describe('factValue', () => {
    describe('arguments', () => {
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

    describe('caching', () => {
      let factSpy = sinon.spy()
      function setup (factOptions) {
        factSpy.reset()
        engine.addFact('foo', async (params, facts) => {
          factSpy()
          return 'unknown'
        }, factOptions)
      }

      it('evaluates the fact every time when fact caching is off', () => {
        setup({ cache: false })
        engine.factValue('foo')
        engine.factValue('foo')
        engine.factValue('foo')
        expect(factSpy).to.have.been.calledThrice
      })

      it('evaluates the fact once when fact caching is on', () => {
        setup({ cache: true })
        engine.factValue('foo')
        engine.factValue('foo')
        engine.factValue('foo')
        expect(factSpy).to.have.been.calledOnce
      })
    })
  })
})
