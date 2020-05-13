'use strict'

/*
 * This is the hello-world example from the README.
 *
 * Usage:
 *   node ./examples/01-hello-world.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/01-hello-world.js
 */

require('colors')
const Engine = require('../dist').Engine
const Rule = require('../dist').Rule

/**
 * Setup a new engine
 */
const engine = new Engine()

/**
 * Create a rule
 */
const rule = new Rule({
  // define the 'conditions' for when "hello world" should display
  conditions: {
    all: [{
      fact: 'displayMessage',
      operator: 'equal',
      value: true
    }]
  },
  // define the 'event' that will fire when the condition evaluates truthy
  event: {
    type: 'message',
    params: {
      data: 'hello-world!'
    }
  }
})

// add rule to engine
engine.addRule(rule)

/**
 * Define a 'displayMessage' as a constant value
 * Fact values do NOT need to be known at engine runtime; see the
 * 03-dynamic-facts.js example for how to pull in data asynchronously during runtime
 */
const facts = { displayMessage: true }

// run the engine
engine
  .run(facts)
  .then(results => { // engine returns an object with a list of events with truthy conditions
    results.events.map(event => console.log(event.params.data))
  })
  .catch(console.log)

/*
 * OUTPUT:
 *
 * hello-world!
 */
