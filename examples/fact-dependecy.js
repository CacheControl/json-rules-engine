'use strict'

/*
 * This is an advanced example that demonstrates facts with dependencies
 * on other facts.  In addition, it demonstrates facts that load data asynchronously
 * from outside sources (api's, databases, etc)
 *
 * Usage:
 *   node ./examples/fact-dependency.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/fact-dependency.js
 */

require('babel-polyfill')
require('colors')
var Engine = require('../dist').Engine
var accountClient = require('./support/account-api-client')

/**
 * Setup a new engine
 */
var engine = new Engine()

/**
 * Rule for identifying microsoft employees that have been terminated.
 * - Demonstates re-using a same fact with different parameters
 * - Demonstates calling a base fact, which serves to load data once and reuse later
 */
var microsoftRule = {
  conditions: {
    all: [{
      fact: 'account-information-field',
      operator: 'equal',
      value: 'microsoft',
      params: {
        field: 'company'
      }
    }, {
      fact: 'account-information-field',
      operator: 'equal',
      value: 'terminated',
      params: {
        field: 'status'
      }
    }]
  },
  event: { type: 'microsoft-terminated-employees' }
}
engine.addRule(microsoftRule)

/**
 * Rule for identifying accounts older than 5 years
 * - Demonstates calling a base fact, also shared by the account-information-field fact
 * - Demonstates performing computations on data retrieved by base fact
 */
var tenureRule = {
  conditions: {
    all: [{
      fact: 'account-tenure',
      operator: 'greaterThanInclusive',
      value: 5
    }]
  },
  event: { type: 'five-year-tenure' }
}
engine.addRule(tenureRule)

/**
 * Register listeners with the engine for rule success and failure
 */
var facts
engine
  .on('success', function (event) {
    console.log(facts.accountId + ' DID '.green + 'meet conditions for the ' + event.type.underline + ' rule.')
  })
  .on('failure', function (rule) {
    console.log(facts.accountId + ' did ' + 'NOT'.red + ' meet conditions for the ' + rule.event.type.underline + ' rule.')
  })

/**
 * 'account-information' fact executes an api call and retrieves account data
 * - Demonstates facts called only by other facts and never mentioned directly in a rule
 */
engine.addFact('account-information', function (params, almanac) {
  return accountClient.getAccountInformation(params.accountId)
    .then(function (results) {
      return results.data
    })
})


/**
 * 'account-tenure' fact retrieves account-information, and computes the number of years
 * since the account was created using 'accountInformation.createdAt'
 */
engine.addFact('account-tenure', function (params, almanac) {
  return almanac
    .factValue('accountId')
    .then(function (account) {
      return almanac.factValue('account-information', { accountId: account })
    })
    .then(function (accountInformation) {
      var created = new Date(accountInformation.createdAt)
      var now = new Date()
      return now.getFullYear() - created.getFullYear()
    })
    .catch(console.log)
})

/**
 * 'account-information-field' fact returns any field from account-information for operator comparison
 */
engine.addFact('account-information-field', function (params, almanac) {
  return almanac
    .factValue('accountId')
    .then(function (account) {
      return almanac.factValue('account-information', { accountId: account })
    })
    .then(function (accountInformation) {
      return accountInformation[params.field]  // return the specific field value
    })
    .catch(console.log)
})


// define fact(s) known at runtime
facts = { accountId: 'washington' }
engine
  .run(facts)  // first run, using washington's facts
  .then(function () {
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