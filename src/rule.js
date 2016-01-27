'use strict'

let params = require('params')

class Rule {
  constructor (options = {}) {
    this.options = options
    this.conditions = {}
    this.action = {
      type: 'unknown'
    }
  }

  setConditions (conditions) {
    this.conditions = params(conditions).only(['all', 'any'])
    if (Object.keys(this.conditions).length !== 1) {
      throw new Error('conditions root must contain a single instance of "all" or "any"')
    }
  }

  setAction (action, cb) {
    this.action = params(action).only(['type', 'params'])
    this.actionCallback = cb
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
    }
  }

  async any (conditions, engine) {
  }

  async all (conditions, engine) {
    let results = await Promise.all(conditions.map(async (condition) => {
      let result = await engine.factValue(condition.fact)
      return this.testCondition(condition, result)
    }))
    return results.every((result) => result === true)
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
