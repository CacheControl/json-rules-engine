'use strict'

import engineFactory from '../src/json-rules-engine'

describe('Engine: action', () => {
  let engine

  let action = {
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
    }]
  }
  beforeEach(() => {
    engine = engineFactory()
    let determineDrinkingAgeRule = factories.rule({ conditions, action, priority: 100 })
    engine.addRule(determineDrinkingAgeRule)
    engine.addFact('age', 21)
  })

  it('passes the action type and params', (done) => {
    engine.on('action', function (a, engine) {
      try {
        expect(a).to.eql(action)
        expect(engine).to.eql(engine)
      } catch (e) { return done(e) }
      done()
    })
    engine.run()
  })

  it('emits using the action "type"', (done) => {
    engine.on('setDrinkingFlag', function (params, engine) {
      try {
        expect(params).to.eql(action.params)
        expect(engine).to.eql(engine)
      } catch (e) { return done(e) }
      done()
    })
    engine.run()
  })

  it('allows facts to be added by the action handler, affecting subsequent rules', (done) => {
    let drinkOrderParams = { wine: 'merlot', quantity: 2 }
    let drinkOrderAction = {
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
      action: drinkOrderAction,
      priority: 1
    })
    engine.addRule(drinkOrderRule)
    engine.on('action', function (a, e) {
      try {
        switch (a.type) {
          case 'setDrinkingFlag':
            e.addFact('canOrderDrinks', a.params.canOrderDrinks)
            break
          case 'offerDrink':
            expect(a.params).to.eql(drinkOrderParams)
            done()
            break
          default:
            done(new Error('default case not expected'))
        }
      } catch (err) { done(err) }
    })
    engine.run().catch((e) => done(e))
  })
})
