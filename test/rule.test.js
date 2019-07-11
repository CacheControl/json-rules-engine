'use strict'

import Engine from '../src/index'
import Rule from '../src/rule'
import sinon from 'sinon'

describe('Rule', () => {
  let rule = new Rule()
  let conditionBase = factories.condition({
    fact: 'age',
    value: 50
  })

  describe('constructor()', () => {
    it('can be initialized with priority, conditions, event, and name', () => {
      let condition = {
        all: [ Object.assign({}, conditionBase) ]
      }
      condition.operator = 'all'
      condition.priority = 25
      let opts = {
        priority: 50,
        conditions: condition,
        event: {
          type: 'awesome'
        },
        name: 'testName'
      }
      let rule = new Rule(opts)
      expect(rule.priority).to.eql(opts.priority)
      expect(rule.conditions).to.eql(opts.conditions)
      expect(rule.event).to.eql(opts.event)
      expect(rule.name).to.eql(opts.name)
    })

    it('it can be initialized with a json string', () => {
      let condition = {
        all: [ Object.assign({}, conditionBase) ]
      }
      condition.operator = 'all'
      condition.priority = 25
      let opts = {
        priority: 50,
        conditions: condition,
        event: {
          type: 'awesome'
        },
        name: 'testName'
      }
      let json = JSON.stringify(opts)
      let rule = new Rule(json)
      expect(rule.priority).to.eql(opts.priority)
      expect(rule.conditions).to.eql(opts.conditions)
      expect(rule.event).to.eql(opts.event)
      expect(rule.name).to.eql(opts.name)
    })
  })

  describe('event emissions', () => {
    it('can emit', () => {
      let rule = new Rule()
      let successSpy = sinon.spy()
      rule.on('test', successSpy)
      rule.emit('test')
      expect(successSpy.callCount).to.equal(1)
    })

    it('can be initialized with an onSuccess option', (done) => {
      let event = { type: 'test' }
      let onSuccess = function (e) {
        expect(e).to.equal(event)
        done()
      }
      let rule = new Rule({ onSuccess })
      rule.emit('success', event)
    })

    it('can be initialized with an onFailure option', (done) => {
      let event = { type: 'test' }
      let onFailure = function (e) {
        expect(e).to.equal(event)
        done()
      }
      let rule = new Rule({ onFailure })
      rule.emit('failure', event)
    })
  })

  describe('setEvent()', () => {
    it('throws if no argument provided', () => {
      expect(() => rule.setEvent()).to.throw(/Rule: setEvent\(\) requires event object/)
    })

    it('throws if argument is missing "type" property', () => {
      expect(() => rule.setEvent({})).to.throw(/Rule: setEvent\(\) requires event object with "type" property/)
    })
  })

  describe('setConditions()', () => {
    describe('validations', () => {
      it('throws an exception for invalid root conditions', () => {
        expect(rule.setConditions.bind(rule, { foo: true })).to.throw(/"conditions" root must contain a single instance of "all" or "any"/)
      })
    })
  })

  describe('setPriority', () => {
    it('defaults to a priority of 1', () => {
      expect(rule.priority).to.equal(1)
    })

    it('allows a priority to be set', () => {
      rule.setPriority(10)
      expect(rule.priority).to.equal(10)
    })

    it('errors if priority is less than 0', () => {
      expect(rule.setPriority.bind(null, 0)).to.throw(/greater than zero/)
    })
  })

  describe('setName', () => {
    it('defaults to undefined', () => {
      expect(rule.name).to.equal(undefined)
    })

    it('allows the name to be set', () => {
      rule.setName('Test Name')
      expect(rule.name).to.equal('Test Name')
    })

    it('errors if name is an empty string', () => {
      expect(rule.setName.bind(null, '')).to.throw(/Rule "name" must be either undefined or a non-empty string/)
    })

    it('errors if name is not a string', () => {
      expect(rule.setName.bind(null, 3)).to.throw(/Rule "name" must be either undefined or a non-empty string/)
    })
  })

  describe('priotizeConditions()', () => {
    let conditions = [{
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 18
    }, {
      fact: 'segment',
      operator: 'equal',
      value: 'human'
    }, {
      fact: 'accountType',
      operator: 'equal',
      value: 'admin'
    }, {
      fact: 'state',
      operator: 'equal',
      value: 'admin'
    }]

    it('orders based on priority', async () => {
      let engine = new Engine()
      engine.addFact('state', async () => {}, { priority: 500 })
      engine.addFact('segment', async () => {}, { priority: 50 })
      engine.addFact('accountType', async () => {}, { priority: 25 })
      engine.addFact('age', async () => {}, { priority: 100 })
      let rule = new Rule()
      rule.setEngine(engine)

      let prioritizedConditions = rule.prioritizeConditions(conditions)
      expect(prioritizedConditions.length).to.equal(4)
      expect(prioritizedConditions[0][0].fact).to.equal('state')
      expect(prioritizedConditions[1][0].fact).to.equal('age')
      expect(prioritizedConditions[2][0].fact).to.equal('segment')
      expect(prioritizedConditions[3][0].fact).to.equal('accountType')
    })
  })

  describe('evaluate()', () => {
    it('evalutes truthy when there are no conditions', async () => {
      let eventSpy = sinon.spy()
      let engine = new Engine()
      let rule = new Rule()
      rule.setConditions({
        all: []
      })
      engine.addRule(rule)
      engine.on('success', eventSpy)
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
    })
  })

  describe('toJSON() and fromJSON()', () => {
    let priority = 50
    let event = {
      type: 'to-json!',
      params: { id: 1 }
    }
    let conditions = {
      priority: 1,
      all: [{
        value: 10,
        operator: 'equals',
        fact: 'user',
        params: {
          foo: true
        },
        path: '.id'
      }]
    }
    let name = 'testName'
    let rule
    beforeEach(() => {
      rule = new Rule()
      rule.setConditions(conditions)
      rule.setPriority(priority)
      rule.setEvent(event)
      rule.setName(name)
    })

    it('serializes itself', () => {
      let json = rule.toJSON(false)
      expect(Object.keys(json).length).to.equal(4)
      expect(json.conditions).to.eql(conditions)
      expect(json.priority).to.eql(priority)
      expect(json.event).to.eql(event)
      expect(json.name).to.eql(name)
    })

    it('serializes itself as json', () => {
      let jsonString = rule.toJSON()
      expect(jsonString).to.be.a('string')
      let json = JSON.parse(jsonString)
      expect(Object.keys(json).length).to.equal(4)
      expect(json.conditions).to.eql(conditions)
      expect(json.priority).to.eql(priority)
      expect(json.event).to.eql(event)
      expect(json.name).to.eql(name)
    })

    it('rehydrates itself using a JSON string', () => {
      let jsonString = rule.toJSON()
      expect(jsonString).to.be.a('string')
      let hydratedRule = new Rule(jsonString)
      expect(hydratedRule.conditions).to.eql(rule.conditions)
      expect(hydratedRule.priority).to.eql(rule.priority)
      expect(hydratedRule.event).to.eql(rule.event)
      expect(hydratedRule.name).to.eql(rule.name)
    })

    it('rehydrates itself using an object from JSON.parse()', () => {
      let jsonString = rule.toJSON()
      expect(jsonString).to.be.a('string')
      let json = JSON.parse(jsonString)
      let hydratedRule = new Rule(json)
      expect(hydratedRule.conditions).to.eql(rule.conditions)
      expect(hydratedRule.priority).to.eql(rule.priority)
      expect(hydratedRule.event).to.eql(rule.event)
      expect(hydratedRule.name).to.eql(rule.name)
    })
  })
})
