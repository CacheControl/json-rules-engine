'use strict'

import Engine from '../src/index'
import Rule from '../src/rule'
import sinon from 'sinon'

describe('Rule', () => {
  const rule = new Rule()
  const conditionBase = factories.condition({
    fact: 'age',
    value: 50
  })

  describe('constructor()', () => {
    it('can be initialized with priority, conditions, event, and name', () => {
      const condition = {
        all: [Object.assign({}, conditionBase)]
      }
      condition.operator = 'all'
      condition.priority = 25
      const opts = {
        priority: 50,
        conditions: condition,
        event: {
          type: 'awesome'
        },
        name: 'testName'
      }
      const rule = new Rule(opts)
      expect(rule.priority).to.eql(opts.priority)
      expect(rule.conditions).to.eql(opts.conditions)
      expect(rule.ruleEvent).to.eql(opts.event)
      expect(rule.name).to.eql(opts.name)
    })

    it('it can be initialized with a json string', () => {
      const condition = {
        all: [Object.assign({}, conditionBase)]
      }
      condition.operator = 'all'
      condition.priority = 25
      const opts = {
        priority: 50,
        conditions: condition,
        event: {
          type: 'awesome'
        },
        name: 'testName'
      }
      const json = JSON.stringify(opts)
      const rule = new Rule(json)
      expect(rule.priority).to.eql(opts.priority)
      expect(rule.conditions).to.eql(opts.conditions)
      expect(rule.ruleEvent).to.eql(opts.event)
      expect(rule.name).to.eql(opts.name)
    })
  })

  describe('event emissions', () => {
    it('can emit', () => {
      const rule = new Rule()
      const successSpy = sinon.spy()
      rule.on('test', successSpy)
      rule.emit('test')
      expect(successSpy.callCount).to.equal(1)
    })

    it('can be initialized with an onSuccess option', (done) => {
      const event = { type: 'test' }
      const onSuccess = function (e) {
        expect(e).to.equal(event)
        done()
      }
      const rule = new Rule({ onSuccess })
      rule.emit('success', event)
    })

    it('can be initialized with an onFailure option', (done) => {
      const event = { type: 'test' }
      const onFailure = function (e) {
        expect(e).to.equal(event)
        done()
      }
      const rule = new Rule({ onFailure })
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

  describe('accessors', () => {
    it('retrieves event', () => {
      const event = { type: 'e', params: { a: 'b' } }
      rule.setEvent(event)
      expect(rule.getEvent()).to.deep.equal(event)
    })

    it('retrieves priority', () => {
      const priority = 100
      rule.setPriority(priority)
      expect(rule.getPriority()).to.equal(priority)
    })

    it('retrieves conditions', () => {
      const condition = { all: [] }
      rule.setConditions(condition)
      expect(rule.getConditions()).to.deep.equal({
        all: [],
        operator: 'all',
        priority: 1
      })
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

    it('allows input of the number 0', () => {
      rule.setName(0)
      expect(rule.name).to.equal(0)
    })

    it('allows input of an object', () => {
      rule.setName({
        id: 123,
        name: 'myRule'
      })
      expect(rule.name).to.eql({
        id: 123,
        name: 'myRule'
      })
    })

    it('errors if name is an empty string', () => {
      expect(rule.setName.bind(null, '')).to.throw(/Rule "name" must be defined/)
    })
  })

  describe('priotizeConditions()', () => {
    const conditions = [{
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
      const engine = new Engine()
      engine.addFact('state', async () => {}, { priority: 500 })
      engine.addFact('segment', async () => {}, { priority: 50 })
      engine.addFact('accountType', async () => {}, { priority: 25 })
      engine.addFact('age', async () => {}, { priority: 100 })
      const rule = new Rule()
      rule.setEngine(engine)

      const prioritizedConditions = rule.prioritizeConditions(conditions)
      expect(prioritizedConditions.length).to.equal(4)
      expect(prioritizedConditions[0][0].fact).to.equal('state')
      expect(prioritizedConditions[1][0].fact).to.equal('age')
      expect(prioritizedConditions[2][0].fact).to.equal('segment')
      expect(prioritizedConditions[3][0].fact).to.equal('accountType')
    })
  })

  describe('evaluate()', () => {
    function setup () {
      const engine = new Engine()
      const rule = new Rule()
      rule.setConditions({
        all: []
      })
      engine.addRule(rule)

      return { engine, rule }
    }
    it('evalutes truthy when there are no conditions', async () => {
      const engineSuccessSpy = sinon.spy()
      const { engine } = setup()

      engine.on('success', engineSuccessSpy)

      await engine.run()

      expect(engineSuccessSpy).to.have.been.calledOnce()
    })

    it('waits for all on("success") event promises to be resolved', async () => {
      const engineSuccessSpy = sinon.spy()
      const ruleSuccessSpy = sinon.spy()
      const engineRunSpy = sinon.spy()
      const { engine, rule } = setup()
      rule.on('success', () => {
        return new Promise(function (resolve) {
          setTimeout(function () {
            ruleSuccessSpy()
            resolve()
          }, 5)
        })
      })
      engine.on('success', engineSuccessSpy)

      await engine.run().then(() => engineRunSpy())

      expect(ruleSuccessSpy).to.have.been.calledOnce()
      expect(engineSuccessSpy).to.have.been.calledOnce()
      expect(ruleSuccessSpy).to.have.been.calledBefore(engineRunSpy)
      expect(ruleSuccessSpy).to.have.been.calledBefore(engineSuccessSpy)
    })
  })

  describe('toJSON() and fromJSON()', () => {
    const priority = 50
    const event = {
      type: 'to-json!',
      params: { id: 1 }
    }
    const conditions = {
      priority: 1,
      all: [{
        value: 10,
        operator: 'equals',
        fact: 'user',
        params: {
          foo: true
        },
        path: '$.id'
      }]
    }
    const name = 'testName'
    let rule
    beforeEach(() => {
      rule = new Rule()
      rule.setConditions(conditions)
      rule.setPriority(priority)
      rule.setEvent(event)
      rule.setName(name)
    })

    it('serializes itself', () => {
      const json = rule.toJSON(false)
      expect(Object.keys(json).length).to.equal(4)
      expect(json.conditions).to.eql(conditions)
      expect(json.priority).to.eql(priority)
      expect(json.event).to.eql(event)
      expect(json.name).to.eql(name)
    })

    it('serializes itself as json', () => {
      const jsonString = rule.toJSON()
      expect(jsonString).to.be.a('string')
      const json = JSON.parse(jsonString)
      expect(Object.keys(json).length).to.equal(4)
      expect(json.conditions).to.eql(conditions)
      expect(json.priority).to.eql(priority)
      expect(json.event).to.eql(event)
      expect(json.name).to.eql(name)
    })

    it('rehydrates itself using a JSON string', () => {
      const jsonString = rule.toJSON()
      expect(jsonString).to.be.a('string')
      const hydratedRule = new Rule(jsonString)
      expect(hydratedRule.conditions).to.eql(rule.conditions)
      expect(hydratedRule.priority).to.eql(rule.priority)
      expect(hydratedRule.ruleEvent).to.eql(rule.ruleEvent)
      expect(hydratedRule.name).to.eql(rule.name)
    })

    it('rehydrates itself using an object from JSON.parse()', () => {
      const jsonString = rule.toJSON()
      expect(jsonString).to.be.a('string')
      const json = JSON.parse(jsonString)
      const hydratedRule = new Rule(json)
      expect(hydratedRule.conditions).to.eql(rule.conditions)
      expect(hydratedRule.priority).to.eql(rule.priority)
      expect(hydratedRule.ruleEvent).to.eql(rule.ruleEvent)
      expect(hydratedRule.name).to.eql(rule.name)
    })
  })
})
