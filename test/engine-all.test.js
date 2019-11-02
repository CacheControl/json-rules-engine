'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

async function factSenior (params, engine) {
  return 65
}

async function factChild (params, engine) {
  return 10
}

async function factAdult (params, engine) {
  return 30
}

describe('Engine: "all" conditions', () => {
  let engine
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('supports a single "all" condition', () => {
    const event = {
      type: 'ageTrigger',
      params: {
        demographic: 'under50'
      }
    }
    const conditions = {
      all: [{
        fact: 'age',
        operator: 'lessThan',
        value: 50
      }]
    }
    let eventSpy
    beforeEach(() => {
      eventSpy = sandbox.spy()
      const rule = factories.rule({ conditions, event })
      engine = engineFactory()
      engine.addRule(rule)
      engine.on('success', eventSpy)
    })

    it('emits when the condition is met', async () => {
      engine.addFact('age', factChild)
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    it('does not emit when the condition fails', () => {
      engine.addFact('age', factSenior)
      engine.run()
      expect(eventSpy).to.not.have.been.calledWith(event)
    })
  })

  describe('supports "any" with multiple conditions', () => {
    const conditions = {
      all: [{
        fact: 'age',
        operator: 'lessThan',
        value: 50
      }, {
        fact: 'age',
        operator: 'greaterThan',
        value: 21
      }]
    }
    const event = {
      type: 'ageTrigger',
      params: {
        demographic: 'adult'
      }
    }
    let eventSpy
    beforeEach(() => {
      eventSpy = sandbox.spy()
      const rule = factories.rule({ conditions, event })
      engine = engineFactory()
      engine.addRule(rule)
      engine.on('success', eventSpy)
    })

    it('emits an event when every condition is met', async () => {
      engine.addFact('age', factAdult)
      await engine.run()
      expect(eventSpy).to.have.been.calledWith(event)
    })

    describe('a condition fails', () => {
      it('does not emit when the first condition fails', async () => {
        engine.addFact('age', factChild)
        await engine.run()
        expect(eventSpy).to.not.have.been.calledWith(event)
      })

      it('does not emit when the second condition', async () => {
        engine.addFact('age', factSenior)
        await engine.run()
        expect(eventSpy).to.not.have.been.calledWith(event)
      })
    })
  })
})
