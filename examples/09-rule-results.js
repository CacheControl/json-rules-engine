'use strict'
/*
 * This is a basic example demonstrating how to leverage the metadata supplied by rule results
 *
 * Usage:
 *   node ./examples/09-rule-results.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/09-rule-results.js
 */
require('colors')
const { Engine } = require('json-rules-engine')

async function start () {
  /**
   * Setup a new engine
   */
  const engine = new Engine()

  // rule for determining honor role student athletes (student has GPA >= 3.5 AND is an athlete)
  engine.addRule({
    conditions: {
      all: [{
        fact: 'athlete',
        operator: 'equal',
        value: true
      }, {
        fact: 'GPA',
        operator: 'greaterThanInclusive',
        value: 3.5
      }]
    },
    event: { // define the event to fire when the conditions evaluate truthy
      type: 'honor-roll',
      params: {
        message: 'Student made the athletics honor-roll'
      }
    },
    name: 'Athlete GPA Rule'
  })

  function render (message, ruleResult) {
    // if rule succeeded, render success message
    if (ruleResult.result) {
      return console.log(`${message}`.green)
    }
    // if rule failed, iterate over each failed condition to determine why the student didn't qualify for athletics honor roll
    const detail = ruleResult.conditions.all.filter(condition => !condition.result)
      .map(condition => {
        switch (condition.operator) {
          case 'equal':
            return `was not an ${condition.fact}`
          case 'greaterThanInclusive':
            return `${condition.fact} of ${condition.factResult} was too low`
          default:
            return ''
        }
      }).join(' and ')
    console.log(`${message} ${detail}`.red)
  }

  /**
   * On success, retrieve the student's username and print rule name for display purposes, and render
   */
  engine.on('success', (event, almanac, ruleResult) => {
    almanac.factValue('username').then(username => {
      render(`${username.bold} succeeded ${ruleResult.name}! ${event.params.message}`, ruleResult)
    })
  })

  /**
   * On failure, retrieve the student's username and print rule name for display purposes, and render
   */
  engine.on('failure', (event, almanac, ruleResult) => {
    almanac.factValue('username').then(username => {
      render(`${username.bold} failed ${ruleResult.name} - `, ruleResult)
    })
  })

  // Run the engine for 5 different students
  await Promise.all([
    engine.run({ athlete: false, GPA: 3.9, username: 'joe' }),
    engine.run({ athlete: true, GPA: 3.5, username: 'larry' }),
    engine.run({ athlete: false, GPA: 3.1, username: 'jane' }),
    engine.run({ athlete: true, GPA: 4.0, username: 'janet' }),
    engine.run({ athlete: true, GPA: 1.1, username: 'sarah' })
  ])
}
start()
/*
 * OUTPUT:
 *
 * joe failed Athlete GPA Rule -  was not an athlete
 * larry succeeded Athlete GPA Rule! Student made the athletics honor-roll
 * jane failed Athlete GPA Rule -  was not an athlete and GPA of 3.1 was too low
 * janet succeeded Athlete GPA Rule! Student made the athletics honor-roll
 * sarah failed Athlete GPA Rule -  GPA of 1.1 was too low
 */
