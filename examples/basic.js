'use strict'

/*
 * This is a basic example that demonstrates a simple run() of the rules engine on
 * two different sets of data.
 *
 * In this example, Facts are passed to run() as constants known at runtime.  For a more
 * complex example demonstrating computed facts, see the computed-facts example.
 *
 * Usage:
 *   node ./examples/basic.js
 */

require('babel-polyfill')
require('colors')
var Engine = require('../dist').Engine

/**
 * Setup a new engine
 */
var engine = new Engine()

/**
 * Add an 'income' rule that will emit for incomes over 20,000
 */
var incomeRule = {
  conditions: {
    all: [{
      fact: 'income',
      operator: 'greaterThanInclusive',
      value: 20000
    }]
  },
  event: {
    type: 'income',
    params: {
      custom1: 1,
      custom2: 'value'
    }
  }
}
engine.addRule(incomeRule)

/**
 * Add an 'education' rule that will emit for high-school educations
 */
var educationRule = {
  conditions: {
    all: [{
      fact: 'education',
      operator: 'equal',
      value: 'high-school'
    }]
  },
  event: {
    type: 'education'
  }
}
engine.addRule(educationRule)

/**
 * Register listeners with the engine for rule success and failure
 */
var facts
engine
  .on('success', function (event, almanac) {
    console.log(facts.username + ' DID '.green + 'meet conditions for the ' + event.type.underline + ' rule. params: ' + JSON.stringify(event.params))
  })
  .on('failure', function (rule, almanac) {
    console.log(facts.username + ' did ' + 'NOT'.red + ' meet conditions for the ' + rule.event.type.underline + ' rule.')
  })

/**
 * Each run() of the engine executes on an independent set of facts.  We'll run twice, once
 * for each user we want to evaluate
 */
facts = {
  income: 30000,
  education: 'college',
  username: 'washington'
}
engine
  .run(facts)  // first run, using washington's facts
  .then(function () {
    facts = {
      income: 15000,
      education: 'high-school',
      username: 'jefferson'
    }
    return engine.run(facts) // second run, using jefferson's facts; facts & evaluation are independent of the first run
  })
  .catch(console.log)
