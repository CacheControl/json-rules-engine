'use strict'

import sinon from 'sinon'
import { get } from 'lodash'
import engineFactory from '../src/index'

const CHILD = 14
const ADULT = 75

async function eligibilityField (params, engine) {
  if (params.field === 'age') {
    if (params.eligibilityId === 1) {
      return CHILD
    }
    return ADULT
  }
}

async function eligibilityData (params, engine) {
  const address = {
    street: '123 Fake Street',
    state: {
      abbreviation: 'CO',
      name: 'Colorado'
    },
    zip: '80403',
    'dot.property': 'dot-property-value',
    occupantHistory: [
      { name: 'Joe', year: 2011 },
      { name: 'Jane', year: 2013 }
    ],
    currentOccupants: [
      { name: 'Larry', year: 2020 }
    ]
  }
  if (params.eligibilityId === 1) {
    return { age: CHILD, address }
  }
  return { age: ADULT, address }
}

describe('Engine: fact evaluation', () => {
  let engine
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })
  const event = {
    type: 'ageTrigger',
    params: {
      demographic: 'under50'
    }
  }
  function baseConditions () {
    return {
      any: [{
        fact: 'eligibilityField',
        operator: 'lessThan',
        params: {
          eligibilityId: 1,
          field: 'age'
        },
        value: 50
      }]
    }
  }
  let successSpy
  let failureSpy
  beforeEach(() => {
    successSpy = sandbox.spy()
    failureSpy = sandbox.spy()
  })

  function setup (conditions = baseConditions(), engineOptions = {}) {
    engine = engineFactory([], engineOptions)
    const rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addFact('eligibilityField', eligibilityField)
    engine.addFact('eligibilityData', eligibilityData)
    engine.on('success', successSpy)
    engine.on('failure', failureSpy)
  }

  describe('options', () => {
    describe('options.allowUndefinedFacts', () => {
      it('throws when fact is undefined by default', async () => {
        const conditions = Object.assign({}, baseConditions())
        conditions.any.push({
          fact: 'undefined-fact',
          operator: 'equal',
          value: true
        })
        setup(conditions)
        return expect(engine.run()).to.be.rejectedWith(/Undefined fact: undefined-fact/)
      })

      context('treats undefined facts as falsey when allowUndefinedFacts is set', () => {
        it('emits "success" when the condition succeeds', async () => {
          const conditions = Object.assign({}, baseConditions())
          conditions.any.push({
            fact: 'undefined-fact',
            operator: 'equal',
            value: true
          })
          setup(conditions, { allowUndefinedFacts: true })
          await engine.run()
          expect(successSpy).to.have.been.called()
          expect(failureSpy).to.not.have.been.called()
        })

        it('emits "failure" when the condition fails', async () => {
          const conditions = Object.assign({}, baseConditions())
          conditions.any.push({
            fact: 'undefined-fact',
            operator: 'equal',
            value: true
          })
          conditions.any[0].params.eligibilityId = 2
          setup(conditions, { allowUndefinedFacts: true })
          await engine.run()
          expect(successSpy).to.not.have.been.called()
          expect(failureSpy).to.have.been.called()
        })
      })
    })
  })

  describe('params', () => {
    it('emits when the condition is met', async () => {
      setup()
      await engine.run()
      expect(successSpy).to.have.been.calledWith(event)
    })

    it('does not emit when the condition fails', async () => {
      const conditions = Object.assign({}, baseConditions())
      conditions.any[0].params.eligibilityId = 2
      setup(conditions)
      await engine.run()
      expect(successSpy).to.not.have.been.called()
    })
  })

  describe('path', () => {
    function conditions () {
      return {
        any: [{
          fact: 'eligibilityData',
          operator: 'lessThan',
          path: '$.age',
          params: {
            eligibilityId: 1
          },
          value: 50
        }]
      }
    }
    it('emits when the condition is met', async () => {
      setup(conditions())
      await engine.run()
      expect(successSpy).to.have.been.calledWith(event)
    })

    it('does not emit when the condition fails', async () => {
      const failureCondition = conditions()
      failureCondition.any[0].params.eligibilityId = 2
      setup(failureCondition)
      await engine.run()
      expect(successSpy).to.not.have.been.called()
    })

    describe('arrays', () => {
      it('can extract an array, allowing it to be used in concert with array operators', async () => {
        const complexCondition = conditions()
        complexCondition.any[0].path = '$.address.occupantHistory[*].year'
        complexCondition.any[0].value = 2011
        complexCondition.any[0].operator = 'contains'
        setup(complexCondition)
        await engine.run()
        expect(successSpy).to.have.been.calledWith(event)
      })

      it('can extract an array with a single element', async () => {
        const complexCondition = conditions()
        complexCondition.any[0].path = '$.address.currentOccupants[*].year'
        complexCondition.any[0].value = 2020
        complexCondition.any[0].operator = 'contains'
        setup(complexCondition)
        await engine.run()
        expect(successSpy).to.have.been.calledWith(event)
      })
    })

    context('complex paths', () => {
      it('correctly interprets "path" when dynamic facts return objects', async () => {
        const complexCondition = conditions()
        complexCondition.any[0].path = '$.address.occupantHistory[0].year'
        complexCondition.any[0].value = 2011
        complexCondition.any[0].operator = 'equal'
        setup(complexCondition)
        await engine.run()
        expect(successSpy).to.have.been.calledWith(event)
      })

      it('correctly interprets "path" when target object properties have dots', async () => {
        const complexCondition = conditions()
        complexCondition.any[0].path = '$.address.[\'dot.property\']'
        complexCondition.any[0].value = 'dot-property-value'
        complexCondition.any[0].operator = 'equal'
        setup(complexCondition)
        await engine.run()
        expect(successSpy).to.have.been.calledWith(event)
      })

      it('correctly interprets "path" with runtime fact objects', async () => {
        const fact = { x: { y: 1 }, a: 2 }
        const conditions = {
          all: [{
            fact: 'x',
            path: '$.y',
            operator: 'equal',
            value: 1
          }]
        }

        engine = engineFactory([])
        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)
        engine.on('success', successSpy)
        engine.on('failure', failureSpy)
        await engine.run(fact)
        expect(successSpy).to.have.been.calledWith(event)
        expect(failureSpy).to.not.have.been.calledWith(event)
      })
    })

    it('does not emit when complex object paths fail the condition', async () => {
      const complexCondition = conditions()
      complexCondition.any[0].path = '$.address.occupantHistory[0].year'
      complexCondition.any[0].value = 2010
      complexCondition.any[0].operator = 'equal'
      setup(complexCondition)
      await engine.run()
      expect(successSpy).to.not.have.been.calledWith(event)
    })

    it('treats invalid object paths as undefined', async () => {
      const complexCondition = conditions()
      complexCondition.any[0].path = '$.invalid.object[99].path'
      complexCondition.any[0].value = undefined
      complexCondition.any[0].operator = 'equal'
      setup(complexCondition)
      await engine.run()
      expect(successSpy).to.have.been.calledWith(event)
    })

    it('ignores "path" when facts return non-objects', async () => {
      setup(conditions())
      const eligibilityData = async (params, engine) => {
        return CHILD
      }
      engine.addFact('eligibilityData', eligibilityData)
      await engine.run()
      expect(successSpy).to.have.been.calledWith(event)
    })

    describe('pathResolver', () => {
      it('allows a custom path resolver to be registered which interprets the path property', async () => {
        const fact = { x: { y: [99] }, a: 2 }
        const conditions = {
          all: [{
            fact: 'x',
            path: 'y[0]',
            operator: 'equal',
            value: 99
          }]
        }
        const pathResolver = (value, path) => {
          return get(value, path)
        }

        engine = engineFactory([], { pathResolver })
        const rule = factories.rule({ conditions, event })
        engine.addRule(rule)
        engine.on('success', successSpy)
        engine.on('failure', failureSpy)

        await engine.run(fact)

        expect(successSpy).to.have.been.calledWith(event)
        expect(failureSpy).to.not.have.been.called()
      })
    })
  })

  describe('promises', () => {
    it('works with asynchronous evaluations', async () => {
      setup()
      const eligibilityField = function (params, engine) {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(30)
          })
        })
      }
      engine.addFact('eligibilityField', eligibilityField)
      await engine.run()
      expect(successSpy).to.have.been.called()
    })
  })

  describe('synchronous functions', () => {
    it('works with synchronous, non-promise evaluations that are truthy', async () => {
      setup()
      const eligibilityField = function (params, engine) {
        return 20
      }
      engine.addFact('eligibilityField', eligibilityField)
      await engine.run()
      expect(successSpy).to.have.been.called()
    })

    it('works with synchronous, non-promise evaluations that are falsey', async () => {
      setup()
      const eligibilityField = function (params, engine) {
        return 100
      }
      engine.addFact('eligibilityField', eligibilityField)
      await engine.run()
      expect(successSpy).to.not.have.been.called()
    })
  })
})
