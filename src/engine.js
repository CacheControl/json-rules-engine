'use strict'

import params from 'params'
import Fact from './fact'
import Rule from './rule'
import { EventEmitter } from 'events'

let debug = require('debug')('json-business-rules')

export const READY = 'READY'
export const RUNNING = 'RUNNING'
export const FINISHED = 'FINISHED'

class Engine extends EventEmitter {
  constructor (set) {
    super()
    this.set = set
    this.rules = []
    this.facts = {}
    this.factCache = {}
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
    let val
    let factId = id
    let fact
    if (id instanceof Fact) {
      factId = id.id
      fact = id
    } else {
      if (arguments.length === 2) {
        if (typeof options === 'function') {
          definitionFunc = options
        } else {
          val = options
        }
      } else if (typeof definitionFunc !== 'function') {
        val = definitionFunc
      }
      fact = new Fact(id, options)
      fact.definition(definitionFunc, val)
    }
    debug(`engine::addFact id:${factId}`)
    this.facts[factId] = fact
  }

  getFact (factId) {
    return this.facts[factId]
  }

  async factValue (factId, params = {}) {
    let fact = this.facts[factId]
    if (!fact) {
      throw new Error(`Undefined fact: ${factId}`)
    }
    // if constant fact w/set value, return immediately
    if (fact.hasOwnProperty('value')) {
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
      return Number(a) > Number(b) ? -1 : 1 // order highest priority -> lowest
    }).map((priority) => ruleSets[priority])
  }

  stop () {
    this.status = FINISHED
    return this
  }

  async run (initialFacts = {}, runOptions = { clearFactCache: true }) {
    debug(`engine::run initialFacts:`, initialFacts)
    this.status = RUNNING
    if (runOptions.clearFactCache) {
      this.factCache = {}
    }
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
            }).catch(reject)
          }))
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
