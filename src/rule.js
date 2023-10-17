'use strict'

import RuleResult from './rule-result'
import EventEmitter from 'eventemitter2'
import ConditionConstructor, { neverCondition } from './condition'

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
    if (options && options.conditionConstructor) {
      this.conditionConstructor = options.conditionConstructor
    } else {
      this.conditionConstructor = new ConditionConstructor()
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
    if (
      !Object.prototype.hasOwnProperty.call(conditions, 'all') &&
      !Object.prototype.hasOwnProperty.call(conditions, 'any') &&
      !Object.prototype.hasOwnProperty.call(conditions, 'not') &&
      !Object.prototype.hasOwnProperty.call(conditions, 'condition')
    ) {
      throw new Error(
        '"conditions" root must contain a single instance of "all", "any", "not", or "condition"'
      )
    }
    this.conditions = this.conditionConstructor.construct(conditions)
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
    if (!Object.prototype.hasOwnProperty.call(event, 'type')) {
      throw new Error(
        'Rule: setEvent() requires event object with "type" property'
      )
    }
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
   * Evaluates the rule, starting with the root boolean operator and recursing down
   * All evaluation is done within the context of an almanac
   * @return {Promise(RuleResult)} rule evaluation result
   */
  evaluate (almanac) {
    return this.conditions
      .evaluate(almanac, this.engine.operators, {
        get: (conditionName) => {
          if (this.engine.conditions.has(conditionName)) {
            return this.engine.conditions.get(conditionName)
          }
          if (this.engine.allowUndefinedConditions) {
            return neverCondition
          } else {
            throw new Error(`No condition ${conditionName} exists`)
          }
        }
      })
      .then((conditionResult) => {
        return new RuleResult(
          conditionResult,
          this.ruleEvent,
          this.priority,
          this.name
        )
      })
      .then((ruleResult) => {
        if (this.engine.replaceFactsInEventParams) {
          return ruleResult.resolveEventParams(almanac).then(() => ruleResult)
        }
        return ruleResult
      })
      .then((ruleResult) => {
        const event = ruleResult.result ? 'success' : 'failure'
        return this.emitAsync(
          event,
          ruleResult.event,
          almanac,
          ruleResult
        ).then(() => ruleResult)
      })
  }
}

export default Rule
