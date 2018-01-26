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
  /**
   * sets up a simple 'any' rule with 2 conditions
   */
  function simpleSetup () {
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
    engine = engineFactory()
    let ruleOptions = { conditions, event, priority: 100 }
    let determineDrinkingAgeRule = factories.rule(ruleOptions)
    engine.addRule(determineDrinkingAgeRule)
    // age will succeed because 21 >= 21
    engine.addFact('age', 21)
    // set 'qualified' to fail. rule will succeed because of 'any'
    engine.addFact('qualified', false)
  }

  /**
   * sets up a complex rule with nested conditions
   */
  function advancedSetup () {
    let conditions = {
      any: [{
        fact: 'age',
        operator: 'greaterThanInclusive',
        value: 21
      }, {
        fact: 'qualified',
        operator: 'equal',
        value: true
      }, {
        all: [{
          fact: 'zipCode',
          operator: 'in',
          value: [80211, 80403]
        }, {
          fact: 'gender',
          operator: 'notEqual',
          value: 'female'
        }]
      }]
    }
    engine = engineFactory()
    let ruleOptions = { conditions, event, priority: 100 }
    let determineDrinkingAgeRule = factories.rule(ruleOptions)
    engine.addRule(determineDrinkingAgeRule)
    // rule will succeed because of 'any'
    engine.addFact('age', 10) // age fails
    engine.addFact('qualified', false) // qualified fails.
    engine.addFact('zipCode', 80403) // zipCode succeeds
    engine.addFact('gender', 'male') // gender succeeds
  }

  context('engine events: simple', () => {
    beforeEach(() => simpleSetup())

    it('"success" passes the event, almanac, and results', async () => {
      let failureSpy = sinon.spy()
      let successSpy = sinon.spy()
      engine.on('success', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(ruleResult.result).to.be.true()
        expect(ruleResult.conditions.any[0].result).to.be.true()
        expect(ruleResult.conditions.any[0].factResult).to.equal(21)
        expect(ruleResult.conditions.any[1].result).to.be.false()
        expect(ruleResult.conditions.any[1].factResult).to.equal(false)
        successSpy()
      })
      engine.on('failure', failureSpy)
      await engine.run()
      expect(failureSpy.callCount).to.equal(0)
      expect(successSpy.callCount).to.equal(1)
    })

    it('"event.type" passes the event parameters, almanac, and results', async () => {
      let failureSpy = sinon.spy()
      let successSpy = sinon.spy()
      engine.on(event.type, function (params, almanac, ruleResult) {
        expect(params).to.eql(event.params)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(ruleResult.result).to.be.true()
        expect(ruleResult.conditions.any[0].result).to.be.true()
        expect(ruleResult.conditions.any[0].factResult).to.equal(21)
        expect(ruleResult.conditions.any[1].result).to.be.false()
        expect(ruleResult.conditions.any[1].factResult).to.equal(false)
        successSpy()
      })
      engine.on('failure', failureSpy)
      await engine.run()
      expect(failureSpy.callCount).to.equal(0)
      expect(successSpy.callCount).to.equal(1)
    })

    it('"failure" passes the event, almanac, and results', async () => {
      let AGE = 10
      let failureSpy = sinon.spy()
      let successSpy = sinon.spy()
      engine.on('failure', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(ruleResult.result).to.be.false()
        expect(ruleResult.conditions.any[0].result).to.be.false()
        expect(ruleResult.conditions.any[0].factResult).to.equal(AGE)
        expect(ruleResult.conditions.any[1].result).to.be.false()
        expect(ruleResult.conditions.any[1].factResult).to.equal(false)
        failureSpy()
      })
      engine.on('success', successSpy)
      engine.addFact('age', AGE) // age fails
      await engine.run()
      expect(failureSpy.callCount).to.equal(1)
      expect(successSpy.callCount).to.equal(0)
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

  context('engine events: advanced', () => {
    beforeEach(() => advancedSetup())

    it('"success" passes the event, almanac, and results', async () => {
      let failureSpy = sinon.spy()
      let successSpy = sinon.spy()
      engine.on('success', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(ruleResult.result).to.be.true()
        expect(ruleResult.conditions.any[0].result).to.be.false()
        expect(ruleResult.conditions.any[0].factResult).to.equal(10)
        expect(ruleResult.conditions.any[1].result).to.be.false()
        expect(ruleResult.conditions.any[1].factResult).to.equal(false)
        expect(ruleResult.conditions.any[2].result).to.be.true()
        expect(ruleResult.conditions.any[2].all[0].result).to.be.true()
        expect(ruleResult.conditions.any[2].all[0].factResult).to.equal(80403)
        expect(ruleResult.conditions.any[2].all[1].result).to.be.true()
        expect(ruleResult.conditions.any[2].all[1].factResult).to.equal('male')
        successSpy()
      })
      engine.on('failure', failureSpy)
      await engine.run()
      expect(failureSpy.callCount).to.equal(0)
      expect(successSpy.callCount).to.equal(1)
    })

    it('"failure" passes the event, almanac, and results', async () => {
      let ZIP_CODE = 99992
      let GENDER = 'female'
      let failureSpy = sinon.spy()
      let successSpy = sinon.spy()
      engine.on('failure', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(ruleResult.result).to.be.false()
        expect(ruleResult.conditions.any[0].result).to.be.false()
        expect(ruleResult.conditions.any[0].factResult).to.equal(10)
        expect(ruleResult.conditions.any[1].result).to.be.false()
        expect(ruleResult.conditions.any[1].factResult).to.equal(false)
        expect(ruleResult.conditions.any[2].result).to.be.false()
        expect(ruleResult.conditions.any[2].all[0].result).to.be.false()
        expect(ruleResult.conditions.any[2].all[0].factResult).to.equal(ZIP_CODE)
        expect(ruleResult.conditions.any[2].all[1].result).to.be.false()
        expect(ruleResult.conditions.any[2].all[1].factResult).to.equal(GENDER)
        failureSpy()
      })
      engine.on('success', successSpy)
      engine.addFact('zipCode', ZIP_CODE) // zipCode fails
      engine.addFact('gender', GENDER) // gender fails
      await engine.run()
      expect(failureSpy.callCount).to.equal(1)
      expect(successSpy.callCount).to.equal(0)
    })
  })

  context('rule events: simple', () => {
    beforeEach(() => simpleSetup())

    it('the rule result is a _copy_ of the rule`s conditions, and unaffected by mutation', async () => {
      let rule = engine.rules[0]
      let firstPass
      rule.on('success', function (e, almanac, ruleResult) {
        firstPass = ruleResult
        delete ruleResult.conditions.any // subsequently modify the conditions in this rule result
      })
      await engine.run()

      // run the engine again, now that ruleResult.conditions was modified
      let secondPass
      rule.on('success', function (e, almanac, ruleResult) {
        secondPass = ruleResult
      })
      await engine.run()

      expect(firstPass).to.deep.equal(secondPass) // second pass was unaffected by first pass
    })

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
        expect(ruleResult.conditions.any[0].factResult).to.equal(21)
        expect(ruleResult.conditions.any[1].result).to.be.false()
        expect(ruleResult.conditions.any[1].factResult).to.equal(false)
        successSpy()
      })
      rule.on('failure', failureSpy)
      await engine.run()
      expect(successSpy.callCount).to.equal(1)
      expect(failureSpy.callCount).to.equal(0)
    })

    it('on-failure, it passes the event type and params', async () => {
      let AGE = 10
      let successSpy = sinon.spy()
      let failureSpy = sinon.spy()
      let rule = engine.rules[0]
      rule.on('failure', function (e, almanac, ruleResult) {
        expect(e).to.eql(event)
        expect(almanac).to.be.an.instanceof(Almanac)
        expect(successSpy.callCount).to.equal(0)
        expect(ruleResult.result).to.be.false()
        expect(ruleResult.conditions.any[0].result).to.be.false()
        expect(ruleResult.conditions.any[0].factResult).to.equal(AGE)
        expect(ruleResult.conditions.any[1].result).to.be.false()
        expect(ruleResult.conditions.any[1].factResult).to.equal(false)
        failureSpy()
      })
      rule.on('success', successSpy)
      // both conditions will fail
      engine.addFact('age', AGE)
      await engine.run()
      expect(failureSpy.callCount).to.equal(1)
      expect(successSpy.callCount).to.equal(0)
    })
  })

  context('rule events: json serializing', () => {
    beforeEach(() => simpleSetup())
    it('serializes properties', async () => {
      let successSpy = sinon.spy()
      let rule = engine.rules[0]
      rule.on('success', successSpy)
      await engine.run()
      let ruleResult = successSpy.getCall(0).args[2]
      let expected = '{"conditions":{"priority":1,"any":[{"operator":"greaterThanInclusive","value":21,"fact":"age","factResult":21,"result":true},{"operator":"equal","value":true,"fact":"qualified","factResult":false,"result":false}]},"event":{"type":"setDrinkingFlag","params":{"canOrderDrinks":true}},"priority":100,"result":true}'
      expect(JSON.stringify(ruleResult)).to.equal(expected)
    })
  })
})
