'use strict'

import Condition from './condition'
import RuleResult from './rule-result'
import debug from './debug'
import EventEmitter from 'eventemitter2'

class Rule extends EventEmitter {
  /**
   * returns a new Rule instance
   * @param {object,string} options, or json string that can be parsed into options
   * @param {integer} options.priority (>1) - higher runs sooner.
   * @param {Object} options.event - event to fire when rule evaluates as successful
   * @param {string} options.event.type - name of event to emit
   * @param {string} options.event.params - parameters to pass to the event listener
   * @param {Object} options.conditions - conditions to evaluate when processing this rule
   * @param {any} options.name - identifier for a particular rule, particularly valuable in RuleResult output
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
    if (options && (options.name || options.name === 0)) {
      this.setName(options.name)
    }

    const priority = (options && options.priority) || 1
    this.setPriority(priority)

    const event = (options && options.event) || { type: 'unknown' }
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
   * Sets the name of the rule
   * @param {any} name - any truthy input and zero is allowed
   */
  setName (name) {
    if (!name && name !== 0) {
      throw new Error('Rule "name" must be defined')
    }
    this.name = name
    return this
  }

  /**
   * Sets the conditions to run when evaluating the rule.
   * @param {object} conditions - conditions, root element must be a boolean operator
   */
  setConditions (conditions) {
    if (!Object.prototype.hasOwnProperty.call(conditions, 'all') && !Object.prototype.hasOwnProperty.call(conditions, 'any')) {
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
    if (!event) throw new Error('Rule: setEvent() requires event object')
    if (!Object.prototype.hasOwnProperty.call(event, 'type')) throw new Error('Rule: setEvent() requires event object with "type" property')
    this.ruleEvent = {
      type: event.type
    }
    if (event.params) this.ruleEvent.params = event.params
    return this
  }

  /**
   * returns the event object
   * @returns {Object} event
   */
  getEvent () {
    return this.ruleEvent
  }

  /**
   * returns the priority
   * @returns {Number} priority
   */
  getPriority () {
    return this.priority
  }

  /**
   * returns the event object
   * @returns {Object} event
   */
  getConditions () {
    return this.conditions
  }

  /**
   * returns the engine object
   * @returns {Object} engine
   */
  getEngine () {
    return this.engine
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
    const props = {
      conditions: this.conditions.toJSON(false),
      priority: this.priority,
      event: this.ruleEvent,
      name: this.name
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
    const factSets = conditions.reduce((sets, condition) => {
      // if a priority has been set on this specific condition, honor that first
      // otherwise, use the fact's priority
      let priority = condition.priority
      if (!priority) {
        const fact = this.engine.getFact(condition.fact)
        priority = (fact && fact.priority) || 1
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
   * @return {Promise(RuleResult)} rule evaluation result
   */
  evaluate (almanac) {
    const ruleResult = new RuleResult(this.conditions, this.ruleEvent, this.priority, this.name)

    /**
     * Evaluates the rule conditions
     * @param  {Condition} condition - condition to evaluate
     * @return {Promise(true|false)} - resolves with the result of the condition evaluation
     */
    const evaluateCondition = (condition) => {
      if (condition.isBooleanOperator()) {
        const subConditions = condition[condition.operator]
        let comparisonPromise
        if (condition.operator === 'all') {
          comparisonPromise = all(subConditions)
        } else {
          comparisonPromise = any(subConditions)
        }
        // for booleans, rule passing is determined by the all/any result
        return comparisonPromise.then(comparisonValue => {
          const passes = comparisonValue === true
          condition.result = passes
          return passes
        })
      } else {
        return condition.evaluate(almanac, this.engine.operators)
          .then(evaluationResult => {
            const passes = evaluationResult.result
            condition.factResult = evaluationResult.leftHandSideValue
            condition.result = passes
            return passes
          })
      }
    }

    /**
     * Evalutes an array of conditions, using an 'every' or 'some' array operation
     * @param  {Condition[]} conditions
     * @param  {string(every|some)} array method to call for determining result
     * @return {Promise(boolean)} whether conditions evaluated truthy or falsey based on condition evaluation + method
     */
    const evaluateConditions = (conditions, method) => {
      if (!(Array.isArray(conditions))) conditions = [conditions]

      return Promise.all(conditions.map((condition) => evaluateCondition(condition)))
        .then(conditionResults => {
          debug('rule::evaluateConditions results', conditionResults)
          return method.call(conditionResults, (result) => result === true)
        })
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
    const prioritizeAndRun = (conditions, operator) => {
      if (conditions.length === 0) {
        return Promise.resolve(true)
      }
      let method = Array.prototype.some
      if (operator === 'all') {
        method = Array.prototype.every
      }
      const orderedSets = this.prioritizeConditions(conditions)
      let cursor = Promise.resolve()
      // use for() loop over Array.forEach to support IE8 without polyfill
      for (let i = 0; i < orderedSets.length; i++) {
        const set = orderedSets[i]
        let stop = false
        cursor = cursor.then((setResult) => {
          // after the first set succeeds, don't fire off the remaining promises
          if ((operator === 'any' && setResult === true) || stop) {
            debug('prioritizeAndRun::detected truthy result; skipping remaining conditions')
            stop = true
            return true
          }

          // after the first set fails, don't fire off the remaining promises
          if ((operator === 'all' && setResult === false) || stop) {
            debug('prioritizeAndRun::detected falsey result; skipping remaining conditions')
            stop = true
            return false
          }
          // all conditions passed; proceed with running next set in parallel
          return evaluateConditions(set, method)
        })
      }
      return cursor
    }

    /**
     * Runs an 'any' boolean operator on an array of conditions
     * @param  {Condition[]} conditions to be evaluated
     * @return {Promise(boolean)} condition evaluation result
     */
    const any = (conditions) => {
      return prioritizeAndRun(conditions, 'any')
    }

    /**
     * Runs an 'all' boolean operator on an array of conditions
     * @param  {Condition[]} conditions to be evaluated
     * @return {Promise(boolean)} condition evaluation result
     */
    const all = (conditions) => {
      return prioritizeAndRun(conditions, 'all')
    }

    /**
     * Emits based on rule evaluation result, and decorates ruleResult with 'result' property
     * @param {RuleResult} ruleResult
     */
    const processResult = (result) => {
      ruleResult.setResult(result)
      const event = result ? 'success' : 'failure'
      return this.emitAsync(event, ruleResult.event, almanac, ruleResult).then(() => ruleResult)
    }

    if (ruleResult.conditions.any) {
      return any(ruleResult.conditions.any)
        .then(result => processResult(result))
    } else {
      return all(ruleResult.conditions.all)
        .then(result => processResult(result))
    }
  }
}

export default Rule
