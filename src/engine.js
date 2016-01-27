'use strict'

import runner from './runner'
import params from 'params'
import { EventEmitter } from 'events'

module.exports = function (set) {
  let rules = []
  let facts = {}
  let engine = new EventEmitter()

  engine.addRule = (rule) => {
    params(rule).require(['conditions', 'action'])
    rules.push(rule)
  }

  engine.addFact = function (id, options, cb) {
    let val = null
    if (arguments.length < 2) throw new Error('invalid arguments')
    if (arguments.length === 2) {
      if (typeof options === 'function') {
        cb = options
        options = {}
      } else {
        val = options
      }
    } else if (typeof cb !== 'function') {
      val = cb
    }
    facts[id] = { options, cb, val }
  }

  engine.run = function (facts = {}) {
    for (let key in facts) {
      engine.addFact(key, facts[key])
    }
    runner(engine)
  }

  engine.facts = facts
  engine.rules = rules

  return engine
}
