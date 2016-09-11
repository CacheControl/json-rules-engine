'use strict'

/*
 * This example demonstrates using custom operators.
 *
 * A custom operator is created for detecting whether the word starts with a particular letter,
 * and a 'word' fact is defined for providing the test string
 *
 * In this example, Facts are passed to run() as constants known at runtime.  For a more
 * complex example demonstrating asynchronously computed facts, see the fact-dependency example.
 *
 * Usage:
 *   node ./examples/custom-operators.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/custom-operators.js
 */

require('colors')
var Engine = require('../dist').Engine

/**
 * Setup a new engine
 */
var engine = new Engine()

/**
 * Define a 'startsWith' custom operator, for use in later rules
 */
engine.addOperator('startsWith', (factValue, jsonValue) => {
  if (!factValue.length) return false
  return factValue[0].toLowerCase() === jsonValue.toLowerCase()
})

/**
 * Add rule for detecting words that start with 'a'
 */
var ruleA = {
  conditions: {
    all: [{
      fact: 'word',
      operator: 'startsWith',
      value: 'a'
    }]
  },
  event: {
    type: 'start-with-a'
  }
}
engine.addRule(ruleA)

/*
 * Add rule for detecting words that start with 'b'
 */
var ruleB = {
  conditions: {
    all: [{
      fact: 'word',
      operator: 'startsWith',
      value: 'b'
    }]
  },
  event: {
    type: 'start-with-b'
  }
}
engine.addRule(ruleB)

// utility for printing output
var printEventType = {
  'start-with-a': 'start with "a"',
  'start-with-b': 'start with "b"'
}

/**
 * Register listeners with the engine for rule success and failure
 */
var facts
engine
  .on('success', function (event) {
    console.log(facts.word + ' DID '.green + printEventType[event.type])
  })
  .on('failure', function (rule) {
    console.log(facts.word + ' did ' + 'NOT'.red + ' ' + printEventType[rule.event.type])
  })

/**
 * Each run() of the engine executes on an independent set of facts.  We'll run twice, once per word
 */
facts = {
  word: 'bacon'
}
engine
  .run(facts)  // first run, using 'bacon'
  .then(function () {
    facts = {
      word: 'antelope'
    }
    return engine.run(facts) // second run, using 'antelope'
  })
  .catch(console.log)

/*
 * OUTPUT:
 *
 * bacon did NOT start with "a"
 * bacon DID start with "b"
 * antelope DID start with "a"
 * antelope did NOT start with "b"
 */
