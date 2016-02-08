'use strict'

import params from 'params'
import Fact from './fact'
import Rule from './rule'
import { EventEmitter } from 'events'

let debug = require('debug')('json-rules-engine')

export const READY = 'READY'
export const RUNNING = 'RUNNING'
export const FINISHED = 'FINISHED'

class Engine extends EventEmitter {
  constructor (rules = []) {
    super()
    this.rules = rules
    this.facts = new Map()
    this.factResultsCache = new Map()
    this.status = READY
  }

  addRule (ruleProperties) {
    params(ruleProperties).require(['conditions', 'action'])

    let rule
    if (ruleProperties instanceof Rule) {
      rule = ruleProperties
    } else {
      rule = new Rule()
      rule.setPriority(ruleProperties.priority)
          .setConditions(ruleProperties.conditions)
          .setAction(ruleProperties.action)
    }
    debug(`engine::addRule`, rule)

    this.rules.push(rule)
  }

  addFact (id, options, definitionFunc) {
    let factId = id
    let fact
    if (id instanceof Fact) {
      factId = id.id
      fact = id
    } else {
      if (arguments.length === 2) {
        definitionFunc = options
      }
      fact = new Fact(id, options, definitionFunc)
    }
    debug(`engine::addFact id:${factId}`)
    this.facts.set(factId, fact)
  }

  getFact (factId) {
    return this.facts.get(factId)
  }

  async factValue (factId, params = {}) {
    let fact = this.facts.get(factId)
    if (!fact) {
      throw new Error(`Undefined fact: ${factId}`)
    }
    let cacheKey = fact.getCacheKey(params)
    let cacheVal = cacheKey && this.factResultsCache.get(cacheKey)
    if (cacheVal) {
      debug(`engine::factValue cache hit for '${factId}' cacheKey:${cacheKey}`)
      return cacheVal
    }
    debug(`engine::factValue cache miss for '${factId}' using cacheKey:${cacheKey}; calculating`)
    this.factResultsCache.set(cacheKey, fact.calculate(params, this))
    return this.factResultsCache.get(cacheKey)
  }

  prioritizeRules () {
    let ruleSets = this.rules.reduce((sets, rule) => {
      let priority = rule.priority
      if (!sets[priority]) sets[priority] = []
      sets[priority].push(rule)
      return sets
    }, {})
    return Object.keys(ruleSets).sort((a, b) => {
      return Number(a) > Number(b) ? -1 : 1 // order highest priority -> lowest
    }).map((priority) => ruleSets[priority])
  }

  stop () {
    this.status = FINISHED
    return this
  }

  async runConditionSet (set) {
    return Promise.all(set.map((rule) => {
      if (this.status !== RUNNING) {
        debug(`engine::run status:${this.status}; skipping remaining rules`)
        return
      }
      return rule.evaluate(this).then((rulePasses) => {
        debug(`engine::run ruleResult:${rulePasses}`)
        if (rulePasses) {
          this.emit('action', rule.action, this)
          this.emit(rule.action.type, rule.action.params, this)
        }
        if (!rulePasses) this.emit('failure', rule, this)
      })
    }))
  }

  async run (initialFacts = {}, runOptions = { clearfactResultsCache: true }) {
    debug(`engine::run initialFacts:`, initialFacts)
    this.status = RUNNING
    if (runOptions.clearfactResultsCache) {
      this.factResultsCache.clear()
    }
    for (let key in initialFacts) {
      this.addFact(key, initialFacts[key])
    }

    let orderedSets = this.prioritizeRules()
    let cursor = Promise.resolve()
    // for each rule set, evaluate in parallel,
    // before proceeding to the next priority set.
    return new Promise((resolve, reject) => {
      orderedSets.map((set) => {
        cursor = cursor.then(() => {
          return this.runConditionSet(set)
        }).catch(reject)
        return cursor
      })
      cursor.then(() => {
        this.status = FINISHED
        resolve()
      }).catch(reject)
    })
  }
}

export default Engine
