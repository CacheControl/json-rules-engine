'use strict'

import params from 'params'
import Condition from './condition'

let debug = require('debug')('json-business-rules')

class Rule {
  constructor (options) {
    if (options && options.conditions) {
      this.setConditions(options.conditions)
    }
    let priority = (options && options.priority) || 1
    this.setPriority(priority)
    let action = (options && options.action) || { type: 'unknown' }
    this.setAction(action)
  }

  setPriority (priority) {
    priority = parseInt(priority, 10)
    if (priority <= 0) throw new Error('Priority must be greater than zero')
    this.priority = priority
    return this
  }

  setConditions (conditions) {
    if (!conditions.hasOwnProperty('all') && !conditions.hasOwnProperty('any')) {
      throw new Error('"conditions" root must contain a single instance of "all" or "any"')
    }
    this.conditions = new Condition(conditions)
    return this
  }

  setAction (action) {
    this.action = params(action).only(['type', 'params'])
    return this
  }

  testCondition (condition, test) {
    switch (condition.operator) {
      case 'equal':
        return test === condition.value
      case 'notEqual':
        return test !== condition.value
      case 'in':
        return condition.value.includes(test)
      case 'notIn':
        return !condition.value.includes(test)
      case 'lessThan':
        return test < condition.value
      case 'lessThanInclusive':
        return test <= condition.value
      case 'greaterThan':
        return test > condition.value
      case 'greaterThanInclusive':
        return test >= condition.value
      // for any/all, simply test that the sub-condition array evaluated truthy
      case 'any':
        return test === true
      case 'all':
        return test === true
      default:
        throw new Error(`Unknown operator: ${condition.operator}`)
    }
  }

  async evaluateCondition (condition, engine) {
    if (condition.isBooleanOperator()) {
      let subConditions = condition[condition.operator]
      return this[condition.operator](subConditions, engine)
    } else {
      return engine.factValue(condition.fact, condition.params)
    }
  }

  prioritizeConditions (conditions, engine) {
    let factSets = conditions.reduce((sets, condition) => {
      // if a priority has been set on this specific condition, honor that first
      // otherwise, use the fact's priority
      let priority = condition.priority ? condition.priority : engine.facts[condition.fact].priority
      if (!sets[priority]) sets[priority] = []
      sets[priority].push(condition)
      return sets
    }, {})
    return Object.keys(factSets).sort((a, b) => {
      return Number(a) > Number(b) ? -1 : 1 // order highest priority -> lowest
    }).map((priority) => factSets[priority])
  }

  async runConditionSet (set, engine, method) {
    if (!(Array.isArray(set))) set = [ set ]
    let conditionResults = await Promise.all(set.map(async (condition) => {
      let factValue = await this.evaluateCondition(condition, engine)
      let conditionResult = this.testCondition(condition, factValue)
      if (!condition.isBooleanOperator()) {
        debug(`runConditionSet:: <${factValue} ${condition.operator} ${condition.value}?> (${conditionResult})`)
      }
      return conditionResult
    }))
    debug(`runConditionSet::results`, conditionResults)
    return method.call(conditionResults, (result) => result === true)
  }

  async prioritizeAndRun (conditions, engine, operator) {
    let method = Array.prototype.some
    if (operator === 'all') {
      method = Array.prototype.every
    }
    let orderedSets = this.prioritizeConditions(conditions, engine)
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
        return this.runConditionSet(set, engine, method)
      })
    })
    return cursor
  }

  async any (conditions, engine) {
    return this.prioritizeAndRun(conditions, engine, 'any')
  }

  async all (conditions, engine) {
    return this.prioritizeAndRun(conditions, engine, 'all')
  }

  async evaluate (engine) {
    if (this.conditions.any) {
      return await this.any(this.conditions.any, engine)
    } else {
      return await this.all(this.conditions.all, engine)
    }
  }
}

export default Rule
