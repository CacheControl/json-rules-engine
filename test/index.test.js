'use strict'

import subject from '../src/index'

describe('json-business-subject', () => {
  it('treats each rule engine independently', () => {
    const engine1 = subject()
    const engine2 = subject()
    engine1.addRule(factories.rule())
    engine2.addRule(factories.rule())
    expect(engine1.rules.length).to.equal(1)
    expect(engine2.rules.length).to.equal(1)
  })
})
