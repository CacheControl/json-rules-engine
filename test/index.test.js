'use strict'

let rules = require('../src/index')

describe('json-business-rules', () => {
  it('has methods for managing facts and rules', () => {
    let set = rules('set1')
    expect(set).to.have.ownProperty('addRule')
    expect(set).to.have.ownProperty('addFact')
  })

  it('treats each rule set independently', () => {
    let set1 = rules('set1')
    let set2 = rules('set2')
    set1.addRule(factories.rule())
    set2.addRule(factories.rule())
    expect(set1.rules.length).to.equal(1)
    expect(set2.rules.length).to.equal(1)
  })
})
