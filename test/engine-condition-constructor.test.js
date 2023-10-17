'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

describe('Engine: conditionConstructor', () => {
  let engine
  let conditionConstructor
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })

  beforeEach(() => {
    conditionConstructor = { construct: sandbox.spy() }
    engine = engineFactory([], { conditionConstructor })
  })

  it('invokes the condition constructor when adding a condition', () => {
    const conditionOpts = { all: [] }
    engine.setCondition('test', conditionOpts)
    expect(conditionConstructor.construct).to.have.been.calledWith(conditionOpts)
  })

  it('invokes the condition constructor when adding a rule', () => {
    const ruleOpts = {
      conditions: { all: [] },
      event: { type: 'unknown' }
    }
    engine.addRule(ruleOpts)
    expect(conditionConstructor.construct).to.have.been.calledWith(ruleOpts.conditions)
  })
})
