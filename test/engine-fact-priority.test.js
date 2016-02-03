'use strict'

import engineFactory from '../src/json-business-rules'
import sinon from 'sinon'

describe('Engine: fact priority', () => {
  let engine
  let action = { type: 'adult-human-admins' }

  let actionSpy = sinon.spy()
  let failureSpy = sinon.spy()
  let ageStub = sinon.stub()
  let segmentStub = sinon.stub()
  let accountTypeStub = sinon.stub()

  function setup (conditions) {
    ageStub.reset()
    segmentStub.reset()
    accountTypeStub.reset()
    actionSpy.reset()
    failureSpy.reset()

    engine = engineFactory()
    let rule = factories.rule({ conditions, action })
    engine.addRule(rule)
    engine.addFact('age', { priority: 100 }, ageStub)
    engine.addFact('segment', { priority: 50 }, segmentStub)
    engine.addFact('accountType', { priority: 25 }, accountTypeStub)
    engine.on('action', actionSpy)
    engine.on('failure', failureSpy)
  }

  describe('all conditions', () => {
    let allCondition = {
      all: [{
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
      }]
    }
    it('fail on the first fact to fail, part 1', async () => {
      setup(allCondition)
      ageStub.returns(10) // fail
      await engine.run()
      expect(failureSpy).to.have.been.called
      expect(actionSpy).to.not.have.been.called
      expect(ageStub).to.have.been.calledOnce
      expect(segmentStub).to.not.have.been.called
      expect(accountTypeStub).to.not.have.been.called
    })

    it('fail on the first fact to fail, part 2', async () => {
      setup(allCondition)
      ageStub.returns(20) // pass
      segmentStub.returns('android') // fail
      await engine.run()
      expect(failureSpy).to.have.been.called
      expect(actionSpy).to.not.have.been.called
      expect(ageStub).to.have.been.calledOnce
      expect(segmentStub).to.have.been.calledOnce
      expect(accountTypeStub).to.not.have.been.called
    })
  })

  describe('any conditions', () => {
    let anyCondition = {
      any: [{
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
      }]
    }
    it('complete on the first fact to succeed, part 1', async () => {
      setup(anyCondition)
      ageStub.returns(20) // succeed
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
      expect(failureSpy).to.not.have.been.called
      expect(ageStub).to.have.been.calledOnce
      expect(segmentStub).to.not.have.been.called
      expect(accountTypeStub).to.not.have.been.called
    })

    it('short circuits on the first fact to fail, part 2', async () => {
      setup(anyCondition)
      ageStub.returns(10) // fail
      segmentStub.returns('human') // pass
      await engine.run()
      expect(actionSpy).to.have.been.calledOnce
      expect(failureSpy).to.not.have.been.called
      expect(ageStub).to.have.been.calledOnce
      expect(segmentStub).to.have.been.calledOnce
      expect(accountTypeStub).to.not.have.been.called
    })
  })
})
