'use strict'

import engineFactory, { Fact, Rule } from '../src/index'

describe('Engine: custom properties', () => {
  let engine
  let event = { type: 'generic' }

  describe('all conditions', () => {
    it('preserves custom properties set on fact', () => {
      engine = engineFactory()
      let fact = new Fact('age', 12)
      fact.customId = 'uuid'
      engine.addFact(fact)
      expect(engine.facts.get('age')).to.have.property('customId')
      expect(engine.facts.get('age').customId).to.equal(fact.customId)
    })

    describe('conditions', () => {
      it('preserves custom properties set on boolean conditions', () => {
        engine = engineFactory()
        let conditions = {
          customId: 'uuid1',
          all: [{
            fact: 'age',
            operator: 'greaterThanInclusive',
            value: 18
          }]
        }
        let rule = factories.rule({ conditions, event })
        engine.addRule(rule)
        expect(engine.rules[0].conditions).to.have.property('customId')
      })

      it('preserves custom properties set on regular conditions', () => {
        engine = engineFactory()
        let conditions = {
          all: [{
            customId: 'uuid',
            fact: 'age',
            operator: 'greaterThanInclusive',
            value: 18
          }]
        }
        let rule = factories.rule({ conditions, event })
        engine.addRule(rule)
        expect(engine.rules[0].conditions['all'][0]).to.have.property('customId')
        expect(engine.rules[0].conditions['all'][0].customId).equal('uuid')
      })
    })

    it('preserves custom properties set on regular conditions', () => {
      engine = engineFactory()
      let rule = new Rule()
      let ruleProperties = factories.rule()
      rule.setPriority(ruleProperties.priority)
          .setConditions(ruleProperties.conditions)
          .setEvent(ruleProperties.event)
      rule.customId = 'uuid'
      engine.addRule(rule)
      expect(engine.rules[0]).to.have.property('customId')
      expect(engine.rules[0].customId).equal('uuid')
    })
  })
})
