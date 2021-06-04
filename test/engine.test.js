'use strict'

import sinon from 'sinon'
import engineFactory, { Fact, Rule, Operator } from '../src/index'
import defaultOperators from '../src/engine-default-operators'

describe('Engine', () => {
  const operatorCount = defaultOperators.length

  let engine
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })
  beforeEach(() => {
    engine = engineFactory()
  })

  it('has methods for managing facts and rules, and running itself', () => {
    expect(engine).to.have.property('addRule')
    expect(engine).to.have.property('removeRule')
    expect(engine).to.have.property('addOperator')
    expect(engine).to.have.property('removeOperator')
    expect(engine).to.have.property('addFact')
    expect(engine).to.have.property('removeFact')
    expect(engine).to.have.property('run')
    expect(engine).to.have.property('stop')
  })

  describe('constructor', () => {
    it('initializes with the default state', () => {
      expect(engine.status).to.equal('READY')
      expect(engine.rules.length).to.equal(0)
      expect(engine.operators.size).to.equal(operatorCount)
    })

    it('can be initialized with rules', () => {
      const rules = [
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
        const rule = new Rule(factories.rule())
        expect(engine.rules.length).to.equal(0)
        engine.addRule(rule)
        expect(engine.rules.length).to.equal(1)
        expect(engine.rules).to.include(rule)
      })
    })

    describe('required fields', () => {
      it('.conditions', () => {
        const rule = factories.rule()
        delete rule.conditions
        expect(() => {
          engine.addRule(rule)
        }).to.throw(/Engine: addRule\(\) argument requires "conditions" property/)
      })

      it('.event', () => {
        const rule = factories.rule()
        delete rule.event
        expect(() => {
          engine.addRule(rule)
        }).to.throw(/Engine: addRule\(\) argument requires "event" property/)
      })
    })
  })

  describe('updateRule()', () => {
    it('updates rule', () => {
      let rule1 = new Rule(factories.rule({ name: 'rule1' }))
      let rule2 = new Rule(factories.rule({ name: 'rule2' }))
      engine.addRule(rule1)
      engine.addRule(rule2)
      expect(engine.rules[0].conditions.all.length).to.equal(2)
      expect(engine.rules[1].conditions.all.length).to.equal(2)

      rule1.conditions = { all: [] }
      engine.updateRule(rule1)

      rule1 = engine.rules.find(rule => rule.name === 'rule1')
      rule2 = engine.rules.find(rule => rule.name === 'rule2')
      expect(rule1.conditions.all.length).to.equal(0)
      expect(rule2.conditions.all.length).to.equal(2)
    })

    it('should throw error if rule not found', () => {
      const rule1 = new Rule(factories.rule({ name: 'rule1' }))
      engine.addRule(rule1)
      const rule2 = new Rule(factories.rule({ name: 'rule2' }))
      expect(() => {
        engine.updateRule(rule2)
      }).to.throw(/Engine: updateRule\(\) rule not found/)
    })
  })

  describe('removeRule()', () => {
    function setup () {
      const rule1 = new Rule(factories.rule({ name: 'rule1' }))
      const rule2 = new Rule(factories.rule({ name: 'rule2' }))
      engine.addRule(rule1)
      engine.addRule(rule2)
      engine.prioritizeRules()

      return [rule1, rule2]
    }
    context('remove by rule.name', () => {
      it('removes a single rule', () => {
        const [rule1] = setup()
        expect(engine.rules.length).to.equal(2)

        const isRemoved = engine.removeRule(rule1.name)

        expect(isRemoved).to.be.true()
        expect(engine.rules.length).to.equal(1)
        expect(engine.prioritizedRules).to.equal(null)
      })

      it('removes multiple rules with the same name', () => {
        const [rule1] = setup()
        const rule3 = new Rule(factories.rule({ name: rule1.name }))
        engine.addRule(rule3)
        expect(engine.rules.length).to.equal(3)

        const isRemoved = engine.removeRule(rule1.name)

        expect(isRemoved).to.be.true()
        expect(engine.rules.length).to.equal(1)
        expect(engine.prioritizedRules).to.equal(null)
      })

      it('returns false when rule cannot be found', () => {
        setup()
        expect(engine.rules.length).to.equal(2)

        const isRemoved = engine.removeRule('not-found-name')

        expect(isRemoved).to.be.false()
        expect(engine.rules.length).to.equal(2)
        expect(engine.prioritizedRules).to.not.equal(null)
      })
    })
    context('remove by rule object', () => {
      it('removes a single rule', () => {
        const [rule1] = setup()
        expect(engine.rules.length).to.equal(2)

        const isRemoved = engine.removeRule(rule1)

        expect(isRemoved).to.be.true()
        expect(engine.rules.length).to.equal(1)
        expect(engine.prioritizedRules).to.equal(null)
      })

      it('removes a single rule, even if two have the same name', () => {
        const [rule1] = setup()
        const rule3 = new Rule(factories.rule({ name: rule1.name }))
        engine.addRule(rule3)
        expect(engine.rules.length).to.equal(3)

        const isRemoved = engine.removeRule(rule1)

        expect(isRemoved).to.be.true()
        expect(engine.rules.length).to.equal(2)
        expect(engine.prioritizedRules).to.equal(null)
      })

      it('returns false when rule cannot be found', () => {
        setup()
        expect(engine.rules.length).to.equal(2)

        const rule3 = new Rule(factories.rule({ name: 'rule3' }))
        const isRemoved = engine.removeRule(rule3)

        expect(isRemoved).to.be.false()
        expect(engine.rules.length).to.equal(2)
        expect(engine.prioritizedRules).to.not.equal(null)
      })
    })
  })

  describe('addOperator()', () => {
    it('adds the operator', () => {
      expect(engine.operators.size).to.equal(operatorCount)
      engine.addOperator('startsWithLetter', (factValue, jsonValue) => {
        return factValue[0] === jsonValue
      })
      expect(engine.operators.size).to.equal(operatorCount + 1)
      expect(engine.operators.get('startsWithLetter')).to.exist()
      expect(engine.operators.get('startsWithLetter')).to.be.an.instanceof(Operator)
    })

    it('accepts an operator instance', () => {
      expect(engine.operators.size).to.equal(operatorCount)
      const op = new Operator('my-operator', _ => true)
      engine.addOperator(op)
      expect(engine.operators.size).to.equal(operatorCount + 1)
      expect(engine.operators.get('my-operator')).to.equal(op)
    })
  })

  describe('removeOperator()', () => {
    it('removes the operator', () => {
      expect(engine.operators.size).to.equal(operatorCount)
      engine.addOperator('startsWithLetter', (factValue, jsonValue) => {
        return factValue[0] === jsonValue
      })
      expect(engine.operators.size).to.equal(operatorCount + 1)
      engine.removeOperator('startsWithLetter')
      expect(engine.operators.size).to.equal(operatorCount)
    })

    it('can only remove added operators', () => {
      expect(engine.operators.size).to.equal(operatorCount)
      const isRemoved = engine.removeOperator('nonExisting')
      expect(isRemoved).to.equal(false)
    })
  })

  describe('addFact()', () => {
    const FACT_NAME = 'FACT_NAME'
    const FACT_VALUE = 'FACT_VALUE'

    function assertFact (engine) {
      expect(engine.facts.size).to.equal(1)
      expect(engine.facts.has(FACT_NAME)).to.be.true()
    }

    it('allows a constant fact', () => {
      engine.addFact(FACT_NAME, FACT_VALUE)
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME).value).to.equal(FACT_VALUE)
    })

    it('allows options to be passed', () => {
      const options = { cache: false }
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
      expect(engine.facts.get(FACT_NAME).value).to.be.undefined()
    })

    it('allows a lamba fact with options', () => {
      const options = { cache: false }
      engine.addFact(FACT_NAME, async (params, engine) => {
        return FACT_VALUE
      }, options)
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME).options).to.eql(options)
      expect(engine.facts.get(FACT_NAME).value).to.be.undefined()
    })

    it('allows a fact instance', () => {
      const options = { cache: false }
      const fact = new Fact(FACT_NAME, 50, options)
      engine.addFact(fact)
      assertFact(engine)
      expect(engine.facts.get(FACT_NAME)).to.exist()
      expect(engine.facts.get(FACT_NAME).options).to.eql(options)
    })
  })

  describe('removeFact()', () => {
    it('removes a Fact', () => {
      expect(engine.facts.size).to.equal(0)
      const fact = new Fact('newFact', 50, { cache: false })
      engine.addFact(fact)
      expect(engine.facts.size).to.equal(1)
      engine.removeFact('newFact')
      expect(engine.facts.size).to.equal(0)
    })

    it('can only remove added facts', () => {
      expect(engine.facts.size).to.equal(0)
      const isRemoved = engine.removeFact('newFact')
      expect(isRemoved).to.equal(false)
    })
  })

  describe('run()', () => {
    beforeEach(() => {
      const conditions = {
        all: [{
          fact: 'age',
          operator: 'greaterThanInclusive',
          value: 18
        }]
      }
      const event = { type: 'generic' }
      const rule = factories.rule({ conditions, event })
      engine.addRule(rule)
      engine.addFact('age', 20)
    })

    it('changes the status to "RUNNING"', () => {
      const eventSpy = sandbox.spy()
      engine.on('success', (event, almanac) => {
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
