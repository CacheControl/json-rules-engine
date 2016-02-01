'use strict'

import params from 'params'
import Condition from './condition'

let debug = require('debug')('json-business-rules')

class Rule {
  constructor () {
    this.priority = 1
    this.conditions = {}
    this.action = {
      type: 'unknown'
    }
  }

  setPriority (priority) {
    priority = parseInt(priority, 10)
    if (priority <= 0) throw new Error('Priority must be greater than zero')
    this.priority = priority
  }

  setConditions (conditions) {
    conditions = params(conditions).only(['all', 'any'])
    if (Object.keys(conditions).length !== 1) {
      throw new Error('"conditions" root must contain a single instance of "all" or "any"')
    }
    this.conditions = new Condition(conditions)
  }

  setAction (action) {
    this.action = params(action).only(['type', 'params'])
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

  async runConditions (conditions, engine) {
    return await Promise.all(conditions.map(async (condition) => {
      let factValue = await this.evaluateCondition(condition, engine)
      let conditionResult = this.testCondition(condition, factValue)
      if (!condition.isBooleanOperator()) {
        debug(`runConditions:: <${factValue} ${condition.operator} ${condition.value}?> (${conditionResult})`)
      }
      return conditionResult
    }))
  }

  async any (conditions, engine) {
    let results = await this.runConditions(conditions, engine)
    let pass = results.some((result) => result === true)
    debug(`any::results [${results}] (${pass})`)
    return pass
  }

  async all (conditions, engine) {
    let results = await this.runConditions(conditions, engine)
    let pass = results.every((result) => result === true)
    debug(`all::results [${results}] (${pass})`)
    return pass
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
