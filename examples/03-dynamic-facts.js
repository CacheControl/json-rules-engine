'use strict'

/*
 * This example demonstrates computing fact values at runtime, and leveraging the 'path' feature
 * to select object properties returned by facts
 *
 * Usage:
 *   node ./examples/03-dynamic-facts.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/03-dynamic-facts.js
 */

require('colors')
let Engine = require('../dist').Engine
// example client for making asynchronous requests to an api, database, etc
let apiClient = require('./support/account-api-client')

/**
 * Setup a new engine
 */
let engine = new Engine()

/**
 * Rule for identifying microsoft employees taking pto on christmas
 *
 * the account-information fact returns:
 *  { company: 'XYZ', status: 'ABC', ptoDaysTaken: ['YYYY-MM-DD', 'YYYY-MM-DD'] }
 */
let microsoftRule = {
  conditions: {
    all: [{
      fact: 'account-information',
      operator: 'equal',
      value: 'microsoft',
      path: '.company' // access the 'company' property of "account-information"
    }, {
      fact: 'account-information',
      operator: 'in',
      value: ['active', 'paid-leave'], // 'status'' can be active or paid-leave
      path: '.status' // access the 'status' property of "account-information"
    }, {
      fact: 'account-information',
      operator: 'contains',
      value: '2016-12-25',
      path: '.ptoDaysTaken' // access the 'ptoDaysTaken' property of "account-information"
    }]
  },
  event: {
    type: 'microsoft-christmas-pto',
    params: {
      message: 'current microsoft employee taking christmas day off'
    }
  }
}
engine.addRule(microsoftRule)

/**
 * 'account-information' fact executes an api call and retrieves account data, feeding the results
 * into the engine.  The major advantage of this technique is that although there are THREE conditions
 * requiring this data, only ONE api call is made.  This results in much more efficient runtime performance.
 */
engine.addFact('account-information', function (params, almanac) {
  return almanac.factValue('accountId')
    .then(accountId => {
      return apiClient.getAccountInformation(accountId)
    })
})

// define fact(s) known at runtime
let facts = { accountId: 'lincoln' }
engine
  .run(facts)
  .then(events => {
    if (!events.length) return
    console.log(facts.accountId + ' is a ' + events.map(event => event.params.message))
  })
  .catch(err => console.log(err.stack))

/*
 * OUTPUT:
 *
 * loading account information for "lincoln"
 * lincoln is a current microsoft employee taking christmas day off
 *
 * NOTES:
 *
 * - Notice that although all 3 conditions required data from the "account-information" fact,
 *   the account-information api call is executed only ONCE.  This is because fact results are
 *   cached by default, increasing performance and lowering network requests.
 *
 * - See the 'fact' docs on how to disable fact caching
 */
