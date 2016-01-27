'use strict'

import sinon from 'sinon'
import subject from '../src/runner'
import engineFactory from '../src/json-business-rules'

let engine = engineFactory()

let conditions = {
  all: [{
    'fact': 'age',
    'operator': 'lessThan',
    'value': 50
  }]
}
let action = {
  type: 'ageTrigger',
  params: {
    demographic: 'over50'
  }
}

let rule = factories.rule({ conditions, action })
engine.addRule(rule)

describe('runner', () => {
  it('supports basic "all" conditions', () => {
    let actionSpy = sinon.spy()
    engine.on('action', actionSpy)
    subject(engine)
    expect(actionSpy).to.have.been.calledWith(action)
  })
})
