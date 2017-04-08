'use strict'

import engineFactory from '../src/index'
import Almanac from '../src/almanac'
import sinon from 'sinon'

describe('Engine: event', () => {
  let engine

  let event = {
    type: 'setDrinkingFlag',
    params: {
      canOrderDrinks: true
    }
  }
  let conditions = {
    any: [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 21
    }, {
      fact: 'qualified',
      operator: 'equal',
      value: true
    }]
  }
  beforeEach(() => {
    engine = engineFactory()
    let ruleOptions = { conditions, event, priority: 100 }
    let determineDrinkingAgeRule = factories.rule(ruleOptions)
    engine.addRule(determineDrinkingAgeRule)
    // age will succeed because 21 >= 21
    engine.addFact('age', 21)
    // set 'qualified' to fail. rule will succeed because of 'any'
    engine.addFact('qualified', false)
  })

  context('engine events', () => {
    it('passes the event type and params', async () => {
      let failureSpy = sinon.spy()
      let successSpy = sinon.spy()
      engine.on('success', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(ruleResult.result).to.be.true()
        expect(ruleResult.conditions.any[0].result).to.be.true()
        expect(ruleResult.conditions.any[1].result).to.be.false()
        successSpy()
      })
      engine.on('failure', failureSpy)
      await engine.run()
      expect(failureSpy.callCount).to.equal(0)
      expect(successSpy.callCount).to.equal(1)
    })

    it('emits using the event "type"', (done) => {
      engine.on('setDrinkingFlag', function (params, e) {
        try {
          expect(params).to.eql(event.params)
          expect(engine).to.eql(e)
        } catch (e) { return done(e) }
        done()
      })
      engine.run()
    })

    it('allows facts to be added by the event handler, affecting subsequent rules', () => {
      let drinkOrderParams = { wine: 'merlot', quantity: 2 }
      let drinkOrderEvent = {
        type: 'offerDrink',
        params: drinkOrderParams
      }
      let drinkOrderConditions = {
        any: [{
          fact: 'canOrderDrinks',
          operator: 'equal',
          value: true
        }]
      }
      let drinkOrderRule = factories.rule({
        conditions: drinkOrderConditions,
        event: drinkOrderEvent,
        priority: 1
      })
      engine.addRule(drinkOrderRule)
      return new Promise((resolve, reject) => {
        engine.on('success', function (event, almanac, ruleResult) {
          switch (event.type) {
            case 'setDrinkingFlag':
              almanac.addRuntimeFact('canOrderDrinks', event.params.canOrderDrinks)
              break
            case 'offerDrink':
              expect(event.params).to.eql(drinkOrderParams)
              break
            default:
              reject(new Error('default case not expected'))
          }
        })
        engine.run().then(resolve).catch(reject)
      })
    })
  })

  context('rule events', () => {
    it('on-success, it passes the event type and params', async () => {
      let failureSpy = sinon.spy()
      let successSpy = sinon.spy()
      let rule = engine.rules[0]
      rule.on('success', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(failureSpy.callCount).to.equal(0)
        expect(ruleResult.result).to.be.true()
        expect(ruleResult.conditions.any[0].result).to.be.true()
        expect(ruleResult.conditions.any[1].result).to.be.false()
        successSpy()
      })
      rule.on('failure', failureSpy)
      await engine.run()
      expect(successSpy.callCount).to.equal(1)
    })

    it('on-failure, it passes the event type and params', async () => {
      let successSpy = sinon.spy()
      let failureSpy = sinon.spy()
      let rule = engine.rules[0]
      rule.on('failure', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(successSpy.callCount).to.equal(0)
        expect(ruleResult.result).to.be.false()
        expect(ruleResult.conditions.any[0].result).to.be.false()
        expect(ruleResult.conditions.any[1].result).to.be.false()
        failureSpy()
      })
      rule.on('success', successSpy)
      // both conditions will fail
      engine.addFact('age', 10)
      await engine.run()
      expect(failureSpy.callCount).to.equal(1)
    })
  })
})
