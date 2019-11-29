'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: fact priority', () => {
  let engine
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })
  const event = { type: 'adult-human-admins' }

  let eventSpy
  let failureSpy
  let ageStub
  let segmentStub
  let accountTypeStub

  function setup (conditions) {
    ageStub = sandbox.stub()
    segmentStub = sandbox.stub()
    accountTypeStub = sandbox.stub()
    eventSpy = sandbox.stub()
    failureSpy = sandbox.stub()

    engine = engineFactory()
    const rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addFact('age', ageStub, { priority: 100 })
    engine.addFact('segment', segmentStub, { priority: 50 })
    engine.addFact('accountType', accountTypeStub, { priority: 25 })
    engine.on('success', eventSpy)
    engine.on('failure', failureSpy)
  }

  describe('all conditions', () => {
    const allCondition = {
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

    it('stops on the first fact to fail, part 1', async () => {
      setup(allCondition)
      ageStub.returns(10) // fail
      await engine.run()
      expect(failureSpy).to.have.been.called()
      expect(eventSpy).to.not.have.been.called()
      expect(ageStub).to.have.been.calledOnce()
      expect(segmentStub).to.not.have.been.called()
      expect(accountTypeStub).to.not.have.been.called()
    })

    it('stops on the first fact to fail, part 2', async () => {
      setup(allCondition)
      ageStub.returns(20) // pass
      segmentStub.returns('android') // fail
      await engine.run()
      expect(failureSpy).to.have.been.called()
      expect(eventSpy).to.not.have.been.called()
      expect(ageStub).to.have.been.calledOnce()
      expect(segmentStub).to.have.been.calledOnce()
      expect(accountTypeStub).to.not.have.been.called()
    })

    describe('sub-conditions', () => {
      const allSubCondition = {
        all: [{
          fact: 'age',
          operator: 'greaterThanInclusive',
          value: 18
        }, {
          all: [
            {
              fact: 'segment',
              operator: 'equal',
              value: 'human'
            }, {
              fact: 'accountType',
              operator: 'equal',
              value: 'admin'
            }
          ]
        }]
      }

      it('stops after the first sub-condition fact fails', async () => {
        setup(allSubCondition)
        ageStub.returns(20) // pass
        segmentStub.returns('android') // fail
        await engine.run()
        expect(failureSpy).to.have.been.called()
        expect(eventSpy).to.not.have.been.called()
        expect(ageStub).to.have.been.calledOnce()
        expect(segmentStub).to.have.been.calledOnce()
        expect(accountTypeStub).to.not.have.been.called()
      })
    })
  })

  describe('any conditions', () => {
    const anyCondition = {
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
      expect(eventSpy).to.have.been.calledOnce()
      expect(failureSpy).to.not.have.been.called()
      expect(ageStub).to.have.been.calledOnce()
      expect(segmentStub).to.not.have.been.called()
      expect(accountTypeStub).to.not.have.been.called()
    })

    it('short circuits on the first fact to fail, part 2', async () => {
      setup(anyCondition)
      ageStub.returns(10) // fail
      segmentStub.returns('human') // pass
      await engine.run()
      expect(eventSpy).to.have.been.calledOnce()
      expect(failureSpy).to.not.have.been.called()
      expect(ageStub).to.have.been.calledOnce()
      expect(segmentStub).to.have.been.calledOnce()
      expect(accountTypeStub).to.not.have.been.called()
    })

    describe('sub-conditions', () => {
      const anySubCondition = {
        all: [{
          fact: 'age',
          operator: 'greaterThanInclusive',
          value: 18
        }, {
          any: [
            {
              fact: 'segment',
              operator: 'equal',
              value: 'human'
            }, {
              fact: 'accountType',
              operator: 'equal',
              value: 'admin'
            }
          ]
        }]
      }

      it('stops after the first sub-condition fact succeeds', async () => {
        setup(anySubCondition)
        ageStub.returns(20) // success
        segmentStub.returns('human') // success
        await engine.run()
        expect(failureSpy).to.not.have.been.called()
        expect(eventSpy).to.have.been.called()
        expect(ageStub).to.have.been.calledOnce()
        expect(segmentStub).to.have.been.calledOnce()
        expect(accountTypeStub).to.not.have.been.called()
      })
    })
  })
})
