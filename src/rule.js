'use strict'

import params from 'params'
import Condition from './condition'
import { EventEmitter } from 'events'

let debug = require('debug')('json-rules-engine')

class Rule extends EventEmitter {
  /**
   * returns a new Rule instance
   * @param {object,string} options, or json string that can be parsed into options
   * @param {integer} options.priority (>1) - higher runs sooner.
   * @param {Object} options.event - event to fire when rule evaluates as successful
   * @param {string} options.event.type - name of event to emit
   * @param {string} options.event.params - parameters to pass to the event listener
   * @param {Object} options.conditions - conditions to evaluate when processing this rule
   * @return {Rule} instance
   */
  constructor (options) {
    super()
    if (typeof options === 'string') {
      options = JSON.parse(options)
    }
    if (options && options.conditions) {
      this.setConditions(options.conditions)
    }
    if (options && options.onSuccess) {
      this.on('success', options.onSuccess)
    }
    if (options && options.onFailure) {
      this.on('failure', options.onFailure)
    }

    let priority = (options && options.priority) || 1
    this.setPriority(priority)

    let event = (options && options.event) || { type: 'unknown' }
    this.setEvent(event)
  }

  /**
   * Sets the priority of the rule
   * @param {integer} priority (>=1) - increasing the priority causes the rule to be run prior to other rules
   */
  setPriority (priority) {
    priority = parseInt(priority, 10)
    if (priority <= 0) throw new Error('Priority must be greater than zero')
    this.priority = priority
    return this
  }

  /**
   * Sets the conditions to run when evaluating the rule.
   * @param {object} conditions - conditions, root element must be a boolean operator
   */
  setConditions (conditions) {
    if (!conditions.hasOwnProperty('all') && !conditions.hasOwnProperty('any')) {
      throw new Error('"conditions" root must contain a single instance of "all" or "any"')
    }
    this.conditions = new Condition(conditions)
    return this
  }

  /**
   * Sets the event to emit when the conditions evaluate truthy
   * @param {object} event - event to emit
   * @param {string} event.type - event name to emit on
   * @param {string} event.params - parameters to emit as the argument of the event emission
   */
  setEvent (event) {
    this.event = params(event).only(['type', 'params'])
    return this
  }

  /**
   * Sets the engine to run the rules under
   * @param {object} engine
   * @returns {Rule}
   */
  setEngine (engine) {
    this.engine = engine
    return this
  }

  toJSON (stringify = true) {
    let props = {
      conditions: this.conditions.toJSON(false),
      priority: this.priority,
      event: this.event
    }
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }

  /**
   * Priorizes an array of conditions based on "priority"
   *   When no explicit priority is provided on the condition itself, the condition's priority is determine by its fact
   * @param  {Condition[]} conditions
   * @return {Condition[][]} prioritized two-dimensional array of conditions
   *    Each outer array element represents a single priority(integer).  Inner array is
   *    all conditions with that priority.
   */
  prioritizeConditions (conditions) {
    let factSets = conditions.reduce((sets, condition) => {
      // if a priority has been set on this specific condition, honor that first
      // otherwise, use the fact's priority
      let priority = condition.priority
      if (!priority) {
        let fact = this.engine.getFact(condition.fact)
        priority = fact && fact.priority || 1
      }
      if (!sets[priority]) sets[priority] = []
      sets[priority].push(condition)
      return sets
    }, {})
    return Object.keys(factSets).sort((a, b) => {
      return Number(a) > Number(b) ? -1 : 1 // order highest priority -> lowest
    }).map((priority) => factSets[priority])
  }

  /**
   * Evaluates the rule, starting with the root boolean operator and recursing down
   * All evaluation is done within the context of an almanac
   * @return {Promise(boolean)} rule evaluation result
   */
  async evaluate (almanac) {
    /**
     * Evaluates the rule conditions
     * @param  {Condition} condition - condition to evaluate
     * @return {Promise(true|false)} - resolves with the result of the condition evaluation
     */
    let evaluateCondition = async (condition) => {
      let comparisonValue
      let passes
      if (condition.isBooleanOperator()) {
        let subConditions = condition[condition.operator]
        if (condition.operator === 'all') {
          comparisonValue = await all(subConditions)
        } else {
          comparisonValue = await any(subConditions)
        }
        // for booleans, rule passing is determined by the all/any result
        passes = comparisonValue === true
      } else {
        try {
          passes = await condition.evaluate(almanac, this.engine.operators, comparisonValue)
        } catch (err) {
          // any condition raising an undefined fact error is considered falsey when allowUndefinedFacts is enabled
          if (this.engine.allowUndefinedFacts && err.code === 'UNDEFINED_FACT') passes = false
          else throw err
        }
      }

      if (passes) {
        this.emit('success', this.event, almanac)
      } else {
        this.emit('failure', this.event, almanac)
      }
      return passes
    }

    /**
     * Evalutes an array of conditions, using an 'every' or 'some' array operation
     * @param  {Condition[]} conditions
     * @param  {string(every|some)} array method to call for determining result
     * @return {Promise(boolean)} whether conditions evaluated truthy or falsey based on condition evaluation + method
     */
    let evaluateConditions = async (conditions, method) => {
      if (!(Array.isArray(conditions))) conditions = [ conditions ]
      let conditionResults = await Promise.all(conditions.map((condition) => {
        return evaluateCondition(condition)
      }))
      debug(`rule::evaluateConditions results`, conditionResults)
      return method.call(conditionResults, (result) => result === true)
    }

    /**
     * Evaluates a set of conditions based on an 'all' or 'any' operator.
     *   First, orders the top level conditions based on priority
     *   Iterates over each priority set, evaluating each condition
     *   If any condition results in the rule to be guaranteed truthy or falsey,
     *   it will short-circuit and not bother evaluating any additional rules
     * @param  {Condition[]} conditions - conditions to be evaluated
     * @param  {string('all'|'any')} operator
     * @return {Promise(boolean)} rule evaluation result
     */
    let prioritizeAndRun = async (conditions, operator) => {
      if (conditions.length === 0) {
        return true
      }
      let method = Array.prototype.some
      if (operator === 'all') {
        method = Array.prototype.every
      }
      let orderedSets = this.prioritizeConditions(conditions)
      let cursor = Promise.resolve()
      orderedSets.forEach((set) => {
        let stop = false
        cursor = cursor.then((setResult) => {
          // after the first set succeeds, don't fire off the remaining promises
          if ((operator === 'any' && setResult === true) || stop) {
            debug(`prioritizeAndRun::detected truthy result; skipping remaining conditions`)
            stop = true
            return true
          }

          // after the first set fails, don't fire off the remaining promises
          if ((operator === 'all' && setResult === false) || stop) {
            debug(`prioritizeAndRun::detected falsey result; skipping remaining conditions`)
            stop = true
            return false
          }
          // all conditions passed; proceed with running next set in parallel
          return evaluateConditions(set, method)
        })
      })
      return cursor
    }

    /**
     * Runs an 'any' boolean operator on an array of conditions
     * @param  {Condition[]} conditions to be evaluated
     * @return {Promise(boolean)} condition evaluation result
     */
    let any = async (conditions) => {
      return prioritizeAndRun(conditions, 'any')
    }

    /**
     * Runs an 'all' boolean operator on an array of conditions
     * @param  {Condition[]} conditions to be evaluated
     * @return {Promise(boolean)} condition evaluation result
     */
    let all = async (conditions) => {
      return prioritizeAndRun(conditions, 'all')
    }

    if (this.conditions.any) {
      return await any(this.conditions.any)
    } else {
      return await all(this.conditions.all)
    }
  }
}

export default Rule
