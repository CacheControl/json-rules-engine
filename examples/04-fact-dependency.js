'use strict'

/*
 * This is an advanced example that demonstrates facts with dependencies
 * on other facts.  In addition, it demonstrates facts that load data asynchronously
 * from outside sources (api's, databases, etc)
 *
 * Usage:
 *   node ./examples/04-fact-dependency.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/04-fact-dependency.js
 */

require('colors')
let Engine = require('../dist').Engine
let accountClient = require('./support/account-api-client')

/**
 * Setup a new engine
 */
let engine = new Engine()

/**
 * Rule for identifying microsoft employees that have been terminated.
 * - Demonstrates re-using a same fact with different parameters
 * - Demonstrates calling a base fact, which serves to load data once and reuse later
 */
let microsoftRule = {
  conditions: {
    all: [{
      fact: 'account-information',
      operator: 'equal',
      value: 'microsoft',
      path: '.company'
    }, {
      fact: 'account-information',
      operator: 'equal',
      value: 'terminated',
      path: '.status'
    }]
  },
  event: { type: 'microsoft-terminated-employees' }
}
engine.addRule(microsoftRule)

/**
 * Rule for identifying accounts older than 5 years
 * - Demonstrates calling a base fact, also shared by the account-information-field fact
 * - Demonstrates performing computations on data retrieved by base fact
 */
let tenureRule = {
  conditions: {
    all: [{
      fact: 'employee-tenure',
      operator: 'greaterThanInclusive',
      value: 5,
      params: {
        'unit': 'years'
      }
    }]
  },
  event: { type: 'five-year-tenure' }
}
engine.addRule(tenureRule)

/**
 * Register listeners with the engine for rule success and failure
 */
let facts
engine
  .on('success', event => {
    console.log(facts.accountId + ' DID '.green + 'meet conditions for the ' + event.type.underline + ' rule.')
  })
  .on('failure', rule => {
    console.log(facts.accountId + ' did ' + 'NOT'.red + ' meet conditions for the ' + rule.event.type.underline + ' rule.')
  })

/**
 * 'account-information' fact executes an api call and retrieves account data
 * - Demonstrates facts called only by other facts and never mentioned directly in a rule
 */
engine.addFact('account-information', (params, almanac) => {
  return almanac.factValue('accountId')
    .then(accountId => {
      return accountClient.getAccountInformation(accountId)
    })
})

/**
 * 'employee-tenure' fact retrieves account-information, and computes the duration of employment
 * since the account was created using 'accountInformation.createdAt'
 */
engine.addFact('employee-tenure', (params, almanac) => {
  return almanac.factValue('account-information')
    .then(accountInformation => {
      let created = new Date(accountInformation.createdAt)
      let now = new Date()
      switch (params.unit) {
        case 'years':
          return now.getFullYear() - created.getFullYear()
        case 'milliseconds':
        default:
          return now.getTime() - created.getTime()
      }
    })
    .catch(console.log)
})

// define fact(s) known at runtime
facts = { accountId: 'washington' }
engine
  .run(facts)  // first run, using washington's facts
  .then(() => {
    facts = { accountId: 'jefferson' }
    return engine.run(facts) // second run, using jefferson's facts; facts & evaluation are independent of the first run
  })
  .catch(console.log)

/*
 * OUTPUT:
 *
 * loading account information for "washington"
 * washington DID meet conditions for the microsoft-terminated-employees rule.
 * washington did NOT meet conditions for the five-year-tenure rule.
 * loading account information for "jefferson"
 * jefferson did NOT meet conditions for the microsoft-terminated-employees rule.
 * jefferson DID meet conditions for the five-year-tenure rule.
 */

/*
 * NOTES:
 *
 * - Notice that although a total of 6 conditions were evaluated using
 *   account-information (3 rule conditions x 2 accounts), the account-information api call
 *   is only called twice -- once for each account.  This is due to the base fact caching the results
 *   for washington and jefferson after the initial data load.
 */
