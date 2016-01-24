'use strict'

module.exports = function (set) {
  let rules = []
  let facts = []
  return {
    addRule: (rule) => {
      rules.push(rule)
    },

    addFact: (fact) => {
      facts.push(fact)
    },

    facts,
    rules
  }
}
