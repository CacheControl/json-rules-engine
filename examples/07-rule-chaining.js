'use strict'
/*
 * This is an advanced example demonstrating rules that passed based off the
 * results of other rules by adding runtime facts.  It also demonstrates
 * accessing the runtime facts after engine execution.
 *
 * Usage:
 *   node ./examples/07-rule-chaining.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/07-rule-chaining.js
 */

require('colors')
const { Engine } = require('json-rules-engine')
const { getAccountInformation } = require('./support/account-api-client')

async function start () {
  /**
   * Setup a new engine
   */
  const engine = new Engine()

  /**
   * Rule for identifying people who may like screwdrivers
   */
  const drinkRule = {
    conditions: {
      all: [{
        fact: 'drinksOrangeJuice',
        operator: 'equal',
        value: true
      }, {
        fact: 'enjoysVodka',
        operator: 'equal',
        value: true
      }]
    },
    event: { type: 'drinks-screwdrivers' },
    priority: 10, // IMPORTANT!  Set a higher priority for the drinkRule, so it runs first
    onSuccess: async function (event, almanac) {
      almanac.addRuntimeFact('screwdriverAficionado', true)

      // asychronous operations can be performed within callbacks
      // engine execution will not proceed until the returned promises is resolved
      const accountId = await almanac.factValue('accountId')
      const accountInfo = await getAccountInformation(accountId)
      almanac.addRuntimeFact('accountInfo', accountInfo)
    },
    onFailure: function (event, almanac) {
      almanac.addRuntimeFact('screwdriverAficionado', false)
    }
  }
  engine.addRule(drinkRule)

  /**
   * Rule for identifying people who should be invited to a screwdriver social
   * - Only invite people who enjoy screw drivers
   * - Only invite people who are sociable
   */
  const inviteRule = {
    conditions: {
      all: [{
        fact: 'screwdriverAficionado', // this fact value is set when the drinkRule is evaluated
        operator: 'equal',
        value: true
      }, {
        fact: 'isSociable',
        operator: 'equal',
        value: true
      }, {
        fact: 'accountInfo',
        path: '$.company',
        operator: 'equal',
        value: 'microsoft'
      }]
    },
    event: { type: 'invite-to-screwdriver-social' },
    priority: 5 // Set a lower priority for the drinkRule, so it runs later (default: 1)
  }
  engine.addRule(inviteRule)

  /**
   * Register listeners with the engine for rule success and failure
   */
  engine
    .on('success', async (event, almanac) => {
      const accountInfo = await almanac.factValue('accountInfo')
      const accountId = await almanac.factValue('accountId')
      console.log(`${accountId}(${accountInfo.company}) ` + 'DID'.green + ` meet conditions for the ${event.type.underline} rule.`)
    })
    .on('failure', async (event, almanac) => {
      const accountId = await almanac.factValue('accountId')
      console.log(`${accountId} did ` + 'NOT'.red + ` meet conditions for the ${event.type.underline} rule.`)
    })

  // define fact(s) known at runtime
  let facts = { accountId: 'washington', drinksOrangeJuice: true, enjoysVodka: true, isSociable: true, accountInfo: {} }

  // first run, using washington's facts
  let results = await engine.run(facts)

  // isScrewdriverAficionado was a fact set by engine.run()
  let isScrewdriverAficionado = results.almanac.factValue('screwdriverAficionado')
  console.log(`${facts.accountId} ${isScrewdriverAficionado ? 'IS'.green : 'IS NOT'.red} a screwdriver aficionado`)

  facts = { accountId: 'jefferson', drinksOrangeJuice: true, enjoysVodka: false, isSociable: true, accountInfo: {} }
  results = await engine.run(facts) // second run, using jefferson's facts; facts & evaluation are independent of the first run

  isScrewdriverAficionado = await results.almanac.factValue('screwdriverAficionado')
  console.log(`${facts.accountId} ${isScrewdriverAficionado ? 'IS'.green : 'IS NOT'.red} a screwdriver aficionado`)
}

start()

/*
 * OUTPUT:
 *
 * loading account information for "washington"
 * washington(microsoft) DID meet conditions for the drinks-screwdrivers rule.
 * washington(microsoft) DID meet conditions for the invite-to-screwdriver-social rule.
 * washington IS a screwdriver aficionado
 * jefferson did NOT meet conditions for the drinks-screwdrivers rule.
 * jefferson did NOT meet conditions for the invite-to-screwdriver-social rule.
 * jefferson IS NOT a screwdriver aficionado
 */
