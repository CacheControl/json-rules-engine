'use strict'

let params = require('params')

module.exports = function (set) {
  let rules = []
  let facts = {}
  return {
    addRule: (rule) => {
      params(rule).require(['conditions', 'action'])
      rules.push(rule)
    },

    addFact: function (id, options, cb) {
      let val = null
      if (arguments.length < 2) throw new Error('invalid arguments')
      if (arguments.length == 2) {
        if (typeof(options) === 'function') {
          cb = options
          options = {}
        } else {
          val = options
        }
      } else if (typeof(cb) !== 'function') {
        val = cb
      }
      facts[id] = { options, cb, val }
    },

    facts,
    rules
  }
}
