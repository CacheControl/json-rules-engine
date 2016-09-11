'use strict'

import params from 'params'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'
import Almanac from './almanac'
import { EventEmitter } from 'events'
import { SuccessEventFact } from './engine-facts'
import defaultOperators from './engine-default-operators'

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
    this.operators = new Map()
    this.facts = new Map()
    this.status = READY
    rules.map(r => this.addRule(r))
    defaultOperators.map(o => this.addOperator(o))
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
    return this
  }

  /**
   * Add a custom operator definition
   * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   * @param {function(factValue, jsonValue)} callback - the method to execute when the operator is encountered.
   */
  addOperator (operatorOrName, cb) {
    debug(`engine::addOperator name:${operatorOrName}`)
    let operator
    if (operatorOrName instanceof Operator) {
      operator = operatorOrName
    } else {
      operator = new Operator(operatorOrName, cb)
    }
    this.operators.set(operator.name, operator)
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
    return this
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
   * Returns a fact by fact-id
   * @param  {string} factId - fact identifier
   * @return {Fact} fact instance, or undefined if no such fact exists
   */
  getFact (factId) {
    return this.facts.get(factId)
  }

  /**
   * Runs an array of rules
   * @param  {Rule[]} array of rules to be evaluated
   * @return {Promise} resolves when all rules in the array have been evaluated
   */
  async evaluateRules (ruleArray, almanac) {
    return Promise.all(ruleArray.map((rule) => {
      if (this.status !== RUNNING) {
        debug(`engine::run status:${this.status}; skipping remaining rules`)
        return
      }
      return rule.evaluate(almanac).then((rulePasses) => {
        debug(`engine::run ruleResult:${rulePasses}`)
        if (rulePasses) {
          this.emit('success', rule.event, almanac)
          this.emit(rule.event.type, rule.event.params, this)
          almanac.factValue('success-events', { event: rule.event })
        }
        if (!rulePasses) this.emit('failure', rule, almanac)
      })
    }))
  }

  /**
   * Runs the rules engine
   * @param  {Object} runtimeFacts - fact values known at runtime
   * @param  {Object} runOptions - run options
   * @return {Promise} resolves when the engine has completed running
   */
  async run (runtimeFacts = {}) {
    debug(`engine::run started`)
    debug(`engine::run runtimeFacts:`, runtimeFacts)
    runtimeFacts['success-events'] = new Fact('success-events', SuccessEventFact(), { cache: false })
    this.status = RUNNING
    let almanac = new Almanac(this.facts, runtimeFacts)
    let orderedSets = this.prioritizeRules()
    let cursor = Promise.resolve()
    // for each rule set, evaluate in parallel,
    // before proceeding to the next priority set.
    return new Promise((resolve, reject) => {
      orderedSets.map((set) => {
        cursor = cursor.then(() => {
          return this.evaluateRules(set, almanac)
        }).catch(reject)
        return cursor
      })
      cursor.then(() => {
        this.status = FINISHED
        debug(`engine::run completed`)
        resolve(almanac.factValue('success-events'))
      }).catch(reject)
    })
  }
}

export default Engine
