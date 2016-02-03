'use strict'

import sinon from 'sinon'
import engineFactory from '../src/json-business-rules'

describe('Engine: "any" conditions', () => {
  let engine

  describe('supports a single "any" condition', () => {
    let action = {
      type: 'ageTrigger',
      params: {
        demographic: 'under50'
      }
    }
    let conditions = {
      any: [{
        'fact': 'age',
        'operator': 'lessThan',
        'value': 50
      }]
    }
    let actionSpy = sinon.spy()
    let ageSpy = sinon.stub()
    beforeEach(() => {
      actionSpy.reset()
      let rule = factories.rule({ conditions, action })
      engine = engineFactory()
      engine.addRule(rule)
      engine.addFact('age', ageSpy)
      engine.on('action', actionSpy)
    })

    it('emits when the condition is met', async () => {
      ageSpy.returns(10)
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)
    })

    it('does not emit when the condition fails', () => {
      ageSpy.returns(75)
      engine.run()
      expect(actionSpy).to.not.have.been.calledWith(action)
    })
  })

  describe('supports "any" with multiple conditions', () => {
    let conditions = {
      any: [{
        'fact': 'age',
        'operator': 'lessThan',
        'value': 50
      }, {
        'fact': 'segment',
        'operator': 'equal',
        'value': 'european'
      }]
    }
    let action = {
      type: 'ageTrigger',
      params: {
        demographic: 'under50'
      }
    }
    let actionSpy = sinon.spy()
    let ageSpy = sinon.stub()
    let segmentSpy = sinon.stub()
    beforeEach(() => {
      actionSpy.reset()
      ageSpy.reset()
      segmentSpy.reset()
      let rule = factories.rule({ conditions, action })
      engine = engineFactory()
      engine.addRule(rule)
      engine.addFact('segment', segmentSpy)
      engine.addFact('age', ageSpy)
      engine.on('action', actionSpy)
    })

    it('emits an action when any condition is met', async () => {
      segmentSpy.returns('north-american')
      ageSpy.returns(25)
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)

      segmentSpy.returns('european')
      ageSpy.returns(100)
      await engine.run()
      expect(actionSpy).to.have.been.calledWith(action)
    })

    it('does not emit when all conditions fail', async () => {
      segmentSpy.returns('north-american')
      ageSpy.returns(100)
      await engine.run()
      expect(actionSpy).to.not.have.been.calledWith(action)
    })
  })
})
