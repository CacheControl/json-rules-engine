'use strict'

/*
 * This is the hello-world example from the README.
 *
 * Usage:
 *   node ./examples/hello-world.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/hello-world.js
 */

require('colors')
var Engine = require('../dist').Engine
var Rule = require('../dist').Rule

/**
 * Setup a new engine
 */
var engine = new Engine()

/**
 * Create a rule
 */
var rule = new Rule()

// define the 'conditions' for when "hello world" should display
rule.setConditions({
  all: [{
    fact: 'displayMessage',
    operator: 'equal',
    value: true
  }]
})
// define the 'event' that will fire when the condition evaluates truthy
rule.setEvent({
  type: 'message',
  params: {
    data: 'hello-world!'
  }
})
// add rule to engine
engine.addRule(rule)

/**
 * Define a 'displayMessage' as a constant value
 * Fact values do NOT need to be known at engine runtime; see the
 * examples for how to pull in data asynchronously as the engine runs
 */
var facts = { displayMessage: true }

// run the engine
engine
  .run(facts)
  .then(function (triggeredEvents) { // engine returns a list of events with truthy conditions
    triggeredEvents.map(function (event) { console.log(event.params.data.green) })
  })
  .catch(console.log)

/*
 * OUTPUT:
 *
 * hello-world!
 */
