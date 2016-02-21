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
  /**
   * Returns a new Engine instance
   * @param  {Rule[]} rules - array of rules to initialize with
   */
  constructor (rules = []) {
    super()
    this.rules = []
    rules.forEach((r) => this.addRule(r))
    this.facts = new Map()
    this.factResultsCache = new Map()
    this.status = READY
  }

  /**
   * Add a rule definition to the engine
   * @param {object|Rule} properties - rule definition.  can be JSON representation, or instance of Rule
   * @param {integer} properties.priority (>1) - higher runs sooner.
   * @param {Object} properties.event - event to fire when rule evaluates as successful
   * @param {string} properties.event.type - name of event to emit
   * @param {string} properties.event.params - parameters to pass to the event listener
   * @param {Object} properties.conditions - conditions to evaluate when processing this rule
   */
  addRule (properties) {
    params(properties).require(['conditions', 'event'])

    let rule
    if (properties instanceof Rule) {
      rule = properties
    } else {
      rule = new Rule(properties)
    }
    rule.setEngine(this)

    this.rules.push(rule)
    this.prioritizedRules = null
  }

  /**
   * Add a fact definition to the engine.  Facts are called by rules as they are evaluated.
   * @param {object|Fact} id - fact identifier or instance of Fact
   * @param {function} definitionFunc - function to be called when computing the fact value for a given rule
   * @param {Object} options - options to initialize the fact with. used when "id" is not a Fact instance
   */
  addFact (id, valueOrMethod, options) {
    let factId = id
    let fact
    if (id instanceof Fact) {
      factId = id.id
      fact = id
    } else {
      fact = new Fact(id, valueOrMethod, options)
    }
    debug(`engine::addFact id:${factId}`)
    this.facts.set(factId, fact)
  }

  /**
   * Returns a fact from the engine, by fact-id
   * @param  {string} factId - fact identifier
   * @return {Fact} fact instance, or undefined if no such fact exists
   */
  getFact (factId) {
    return this.facts.get(factId)
  }

  /**
   * Returns the value of a fact, based on the given parameters.  Utilizes the 'factResultsCache' maintained
   * by the engine, which cache's fact computations based on parameters provided
   * @param  {string} factId - fact identifier
   * @param  {Object} params - parameters to feed into the fact.  By default, these will also be used to compute the cache key
   * @return {Promise} a promise which will resolve with the fact computation.
   */
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
    cacheVal = fact.calculate(params, this)
    debug(`engine::factValue '${factId}' calculated as: ${cacheVal}`)
    if (cacheKey) {
      this.factResultsCache.set(cacheKey, cacheVal)
    }
    return cacheVal
  }

  /**
   * Iterates over the engine rules, organizing them by highest -> lowest priority
   * @return {Rule[][]} two dimensional array of Rules.
   *    Each outer array element represents a single priority(integer).  Inner array is
   *    all rules with that priority.
   */
  prioritizeRules () {
    if (!this.prioritizedRules) {
      let ruleSets = this.rules.reduce((sets, rule) => {
        let priority = rule.priority
        if (!sets[priority]) sets[priority] = []
        sets[priority].push(rule)
        return sets
      }, {})
      this.prioritizedRules = Object.keys(ruleSets).sort((a, b) => {
        return Number(a) > Number(b) ? -1 : 1 // order highest priority -> lowest
      }).map((priority) => ruleSets[priority])
    }
    return this.prioritizedRules
  }

  /**
   * Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
   * and no further events emitted.  Since rules of the same priority are evaluated in parallel(not series), other rules of
   * the same priority may still emit events, even though the engine is in a "finished" state.
   * @return {Engine}
   */
  stop () {
    this.status = FINISHED
    return this
  }

  /**
   * Runs an array of rules
   * @param  {Rule[]} array of rules to be evaluated
   * @return {Promise} resolves when all rules in the array have been evaluated
   */
  async evaluateRules (ruleArray) {
    return Promise.all(ruleArray.map((rule) => {
      if (this.status !== RUNNING) {
        debug(`engine::run status:${this.status}; skipping remaining rules`)
        return
      }
      return rule.evaluate(this).then((rulePasses) => {
        debug(`engine::run ruleResult:${rulePasses}`)
        if (rulePasses) {
          this.emit('success', rule.event, this)
          this.emit(rule.event.type, rule.event.params, this)
        }
        if (!rulePasses) this.emit('failure', rule, this)
      })
    }))
  }

  /**
   * Runs the rules engine
   * @param  {Object} initialFacts - fact values known at runtime
   * @param  {Object} runOptions - run options
   * @return {Promise} resolves when the engine has completed running
   */
  async run (initialFacts = {}, runOptions = { clearFactResultsCache: true }) {
    debug(`engine::run initialFacts:`, initialFacts)
    this.status = RUNNING
    if (runOptions.clearFactResultsCache) {
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
          return this.evaluateRules(set)
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
