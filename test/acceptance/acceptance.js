'use strict'

import sinon from 'sinon'
import { expect } from 'chai'
import { Engine } from '../../src/index'

/**
 * acceptance tests are intended to use features that, when used in combination,
 * could cause integration bugs not caught by the rest of the test suite
 */
describe('Acceptance', () => {
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })
  const factParam = 1
  const event1 = {
    type: 'event-1',
    params: {
      eventParam: 1
    }
  }
  const event2 = {
    type: 'event-2'
  }
  const expectedFirstRuleResult = {
    all: [{
      fact: 'high-priority',
      params: {
        factParam
      },
      operator: 'contains',
      path: '$.values',
      value: 2,
      factResult: [2],
      result: true
    },
    {
      fact: 'low-priority',
      operator: 'in',
      value: [2],
      factResult: 2,
      result: true
    }
    ],
    operator: 'all',
    priority: 1
  }
  let successSpy
  let failureSpy
  let highPrioritySpy
  let lowPrioritySpy

  function delay (value) {
    return new Promise(resolve => setTimeout(() => resolve(value), 5))
  }

  function setup (options = {}) {
    const engine = new Engine()
    highPrioritySpy = sandbox.spy()
    lowPrioritySpy = sandbox.spy()

    engine.addRule({
      name: 'first',
      priority: 10,
      conditions: {
        all: [{
          fact: 'high-priority',
          params: {
            factParam
          },
          operator: 'contains',
          path: '$.values',
          value: options.highPriorityValue
        }, {
          fact: 'low-priority',
          operator: 'in',
          value: options.lowPriorityValue
        }]
      },
      event: event1,
      onSuccess: async (event, almanac, ruleResults) => {
        expect(ruleResults.name).to.equal('first')
        expect(ruleResults.event).to.deep.equal(event1)
        expect(ruleResults.priority).to.equal(10)
        expect(ruleResults.conditions).to.deep.equal(expectedFirstRuleResult)

        return delay(almanac.addRuntimeFact('rule-created-fact', { array: options.highPriorityValue }))
      }
    })

    engine.addRule({
      name: 'second',
      priority: 1,
      conditions: {
        all: [{
          fact: 'high-priority',
          params: {
            factParam
          },
          operator: 'containsDivisibleValuesOf',
          path: '$.values',
          value: {
            fact: 'rule-created-fact',
            path: '$.array' // set by 'success' of first rule
          }
        }]
      },
      event: event2
    })

    engine.addOperator('containsDivisibleValuesOf', (factValue, jsonValue) => {
      return factValue.some(v => v % jsonValue === 0)
    })

    engine.addFact('high-priority', async function (params, almanac) {
      highPrioritySpy(params)
      const idx = await almanac.factValue('sub-fact')
      return delay({ values: [idx + params.factParam] }) // { values: [baseIndex + factParam] }
    }, { priority: 2 })

    engine.addFact('low-priority', async function (params, almanac) {
      lowPrioritySpy(params)
      const idx = await almanac.factValue('sub-fact')
      return delay(idx + 1) // baseIndex + 1
    }, { priority: 1 })

    engine.addFact('sub-fact', async function (params, almanac) {
      const baseIndex = await almanac.factValue('baseIndex')
      return delay(baseIndex)
    })
    successSpy = sandbox.spy()
    failureSpy = sandbox.spy()
    engine.on('success', successSpy)
    engine.on('failure', failureSpy)

    return engine
  }

  it('succeeds', async () => {
    const engine = setup({
      highPriorityValue: 2,
      lowPriorityValue: [2]
    })

    const {
      results,
      failureResults,
      events,
      failureEvents
    } = await engine.run({ baseIndex: 1 })

    // results
    expect(results.length).to.equal(2)
    expect(results[0]).to.deep.equal({
      conditions: {
        all: [
          {
            fact: 'high-priority',
            factResult: [
              2
            ],
            operator: 'contains',
            params: {
              factParam: 1
            },
            path: '$.values',
            result: true,
            value: 2
          },
          {
            fact: 'low-priority',
            factResult: 2,
            operator: 'in',
            result: true,
            value: [
              2
            ]
          }
        ],
        operator: 'all',
        priority: 1
      },
      event: {
        params: {
          eventParam: 1
        },
        type: 'event-1'
      },
      name: 'first',
      priority: 10,
      result: true
    })
    expect(results[1]).to.deep.equal({
      conditions: {
        all: [
          {
            fact: 'high-priority',
            factResult: [
              2
            ],
            operator: 'containsDivisibleValuesOf',
            params: {
              factParam: 1
            },
            path: '$.values',
            result: true,
            value: {
              fact: 'rule-created-fact',
              path: '$.array'
            }
          }
        ],
        operator: 'all',
        priority: 1
      },
      event: {
        type: 'event-2'
      },
      name: 'second',
      priority: 1,
      result: true
    })
    expect(failureResults).to.be.empty()

    // events
    expect(failureEvents.length).to.equal(0)
    expect(events.length).to.equal(2)
    expect(events[0]).to.deep.equal(event1)
    expect(events[1]).to.deep.equal(event2)

    // callbacks
    expect(successSpy).to.have.been.calledTwice()
    expect(successSpy).to.have.been.calledWith(event1)
    expect(successSpy).to.have.been.calledWith(event2)
    expect(highPrioritySpy).to.have.been.calledBefore(lowPrioritySpy)
    expect(failureSpy).to.not.have.been.called()
  })

  it('fails', async () => {
    const engine = setup({
      highPriorityValue: 2,
      lowPriorityValue: [3] // falsey
    })

    const {
      results,
      failureResults,
      events,
      failureEvents
    } = await engine.run({ baseIndex: 1, 'rule-created-fact': '' })

    expect(results.length).to.equal(0)
    expect(failureResults.length).to.equal(2)
    expect(failureResults.every(rr => rr.result === false)).to.be.true()

    expect(events.length).to.equal(0)
    expect(failureEvents.length).to.equal(2)
    expect(failureSpy).to.have.been.calledTwice()
    expect(failureSpy).to.have.been.calledWith(event1)
    expect(failureSpy).to.have.been.calledWith(event2)
    expect(highPrioritySpy).to.have.been.calledBefore(lowPrioritySpy)
    expect(successSpy).to.not.have.been.called()
  })
})
