'use strict'

import params from 'params'
import Fact from './fact'
import Rule from './rule'
import { EventEmitter } from 'events'

let debug = require('debug')('json-business-rules')

class Engine extends EventEmitter {

  constructor (set) {
    super()
    this.set = set
    this.rules = []
    this.facts = {}
    this.factCache = {}
  }

  addRule (ruleProperties) {
    params(ruleProperties).require(['conditions', 'action'])

    let rule = new Rule()
    rule.setPriority(ruleProperties.priority)
    rule.setConditions(ruleProperties.conditions)
    rule.setAction(ruleProperties.action)
    debug(`engine::addRule`, rule)

    this.rules.push(rule)
  }

  addFact (id, options, definitionFunc) {
    let val = null
    if (arguments.length < 2) throw new Error('invalid arguments')
    if (arguments.length === 2) {
      if (typeof options === 'function') {
        definitionFunc = options
      } else {
        val = options
      }
      options = {}
    } else if (typeof definitionFunc !== 'function') {
      val = definitionFunc
    }
    let fact = new Fact(id, options)
    fact.definition(definitionFunc, val)
    debug(`engine::addFact id:${id}`)
    this.facts[id] = fact
  }

  async factValue (factId, params = {}) {
    let fact = this.facts[factId]
    if (!fact) {
      throw new Error(`Undefined fact: ${factId}`)
    }
    // if constant fact w/set value, return immediately
    if (fact.value) {
      return fact.value
    }
    let cacheKey = fact.getCacheKey(params)
    if (cacheKey && this.factCache[cacheKey]) {
      debug(`engine::factValue cache hit for '${factId}' cacheKey:${cacheKey}`)
      return this.factCache[cacheKey]
    }
    debug(`engine::factValue cache miss for '${factId}' using cacheKey:${cacheKey}; calculating`)
    this.factCache[cacheKey] = fact.calculate(params, this)
    return this.factCache[cacheKey]
  }

  prioritizeRules () {
    let ruleSets = this.rules.reduce((sets, rule) => {
      let priority = rule.priority
      if (!sets[priority]) sets[priority] = []
      sets[priority].push(rule)
      return sets
    }, {})
    return Object.keys(ruleSets).sort((a, b) => {
      return a > b ? -1 : 1 // order highest priority -> lowest
    }).map((priority) => ruleSets[priority])
  }

  async runRules (rules) {
    return Promise.all(rules.map(async (rule) => {
      let ruleResult = await rule.evaluate(this)
      debug(`engine::run ruleResult:${ruleResult}`)
      if (ruleResult) this.emit('action', rule.action)
    }))
  }

  async run (initialFacts = {}) {
    debug(`engine::run`, initialFacts)
    for (let key in initialFacts) {
      this.addFact(key, initialFacts[key])
    }

    let orderedSets = this.prioritizeRules()
    let cursor = Promise.resolve()
    return new Promise((resolve, reject) => {
      // for each batch of promise priorities, fire off all promises in parallel (Promise.all)
      // before proceeding to the next priority batch.
      orderedSets.map((set) => {
        cursor = cursor.then(() => {
          return Promise.all(set.map((rule) => {
            return rule.evaluate(this).then((rulePasses) => {
              if (rulePasses) this.emit('action', rule.action, this)
            }).catch(reject)
          }))
        }).catch(reject)
        return cursor
      })
      cursor.then(resolve).catch(reject)
    })
  }
}

export default Engine
