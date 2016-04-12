'use strict'

require('babel-polyfill')
var colors = require('colors')
var Engine = require('../dist').Engine

/**
 * Setup a new engine
 * @type {Engine}
 */
var engine = new Engine()

/**
 * Add an 'income' rule that will emit for incomes over 20,000
 * @type {Object}
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
 * @type {Object}
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
let promises = []
engine.on('success', function (event, almanac) {
  promises.push(almanac.factValue('username').then(function (username) {
    console.log(username + ' DID '.green + 'meet conditions for the ' + event.type.underline + ' rule')
  }))
})
engine.on('failure', function (rule, almanac) {
  promises.push(almanac.factValue('username').then(function (username) {
    console.log(username + ' did ' + 'NOT'.red + ' meet conditions for the ' + rule.event.type.underline + ' rule')
  }))
})

/**
 * Each run() of the engine executes on an independent set of facts.  We'll run twice, once
 * for each user we want to evaluate
 */
var washingtonData = {
  income: 30000,
  education: 'college',
  username: 'washington'
}
promises.push(engine.run(washingtonData))

var jeffersonData = {
  income: 15000,
  education: 'high-school',
  username: 'jefferson'
}
promises.push(engine.run(jeffersonData))

Promise.all(promises).catch(function (err) {
  console.log(err)
})
