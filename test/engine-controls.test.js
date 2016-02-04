'use strict'

import engineFactory from '../src/json-business-rules'
import sinon from 'sinon'

describe('Engine: fact priority', () => {
  let engine
  let action = { type: 'adult-human-admins' }

  let actionSpy = sinon.spy()
  let ageStub = sinon.stub()
  let segmentStub = sinon.stub()

  function setup () {
    ageStub.reset()
    segmentStub.reset()
    actionSpy.reset()
    engine = engineFactory()

    let conditions = {
      any: [{
        fact: 'age',
        operator: 'greaterThanInclusive',
        value: 18
      }]
    }
    let rule = factories.rule({ conditions, action, priority: 100 })
    engine.addRule(rule)

    conditions = {
      any: [{
        fact: 'segment',
        operator: 'equal',
        value: 'human'
      }]
    }
    rule = factories.rule({ conditions, action })
    engine.addRule(rule)

    engine.addFact('age', { priority: 100 }, ageStub)
    engine.addFact('segment', { priority: 50 }, segmentStub)
  }

  describe('stop()', () => {
    it('stops the rules from executing', async () => {
      setup()
      ageStub.returns(20) // success
      engine.on('action', (action, engine) => {
        actionSpy()
        engine.stop()
      })
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
      expect(ageStub).to.have.been.calledOnce
      expect(segmentStub).to.not.have.been.called
    })
  })
})
