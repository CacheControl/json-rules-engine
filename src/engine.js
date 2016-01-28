'use strict'

import params from 'params'
import Fact from './fact'
import Rule from './rule'
import { EventEmitter } from 'events'

class Engine extends EventEmitter {

  constructor (set) {
    super()
    this.set = set
    this.rules = []
    this.facts = {}
  }

  addRule (ruleProperties) {
    params(ruleProperties).require(['conditions', 'action'])

    let rule = new Rule()
    rule.setConditions(ruleProperties.conditions)
    rule.setAction(ruleProperties.action, (type, params) => {
      this.engine.emit('action', type, params)
    })

    this.rules.push(rule)
  }

  addFact (id, options, definitionFunc) {
    let val = null
    if (arguments.length < 2) throw new Error('invalid arguments')
    if (arguments.length === 2) {
      if (typeof options === 'function') {
        definitionFunc = options
        options = {}
      } else {
        val = options
      }
    } else if (typeof definitionFunc !== 'function') {
      val = definitionFunc
    }
    let fact = new Fact(options)
    fact.definition(definitionFunc, val)
    this.facts[id] = fact
  }

  async factValue (factId, params = {}) {
    let fact = this.facts[factId]
    if (!fact) {
      throw new Error(`Undefined fact: ${factId}`)
    }
    if (fact.value) {
      return fact.value
    }
    return await fact.calculate(params, this)
  }

  async run (initialFacts = {}) {
    for (let key in initialFacts) {
      this.addFact(key, initialFacts[key])
    }
    return Promise.all(this.rules.map(async (rule) => {
      let ruleResult = await rule.evaluate(this)
      if (ruleResult) this.emit('action', rule.action)
    }))
  }
}

export default Engine
