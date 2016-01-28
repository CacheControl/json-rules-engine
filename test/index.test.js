'use strict'

import subject from '../src/index'

describe('json-business-subject', () => {
  it('treats each rule set independently', () => {
    let set1 = subject('set1')
    let set2 = subject('set2')
    set1.addRule(factories.rule())
    set2.addRule(factories.rule())
    expect(set1.rules.length).to.equal(1)
    expect(set2.rules.length).to.equal(1)
  })
})
