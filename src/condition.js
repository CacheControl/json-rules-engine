'use strict'

import params from 'params'

export default class Condition {
  constructor (properties) {
    let booleanOperator = Condition.booleanOperator(properties)
    Object.assign(this, properties)
    if (booleanOperator) {
      let subConditions = properties[booleanOperator]
      if (!(subConditions instanceof Array)) {
        throw new Error(`"${booleanOperator}" must be an array`)
      }
      this.operator = booleanOperator
      // boolean conditions always have a priority; default 1
      this.priority = parseInt(properties.priority, 10) || 1
      this[booleanOperator] = subConditions.map((c) => {
        return new Condition(c)
      })
    } else {
      properties = params(properties).require(['fact', 'operator', 'value'])
      // a non-boolean condition does not have a priority by default. this allows
      // priority to be dictated by the fact definition
      if (properties.hasOwnProperty('priority')) {
        properties.priority = parseInt(properties.priority, 10)
      }
    }
  }

  toJSON (stringify = true) {
    let props = {}
    if (this.priority) {
      props.priority = this.priority
    }
    let oper = Condition.booleanOperator(this)
    if (oper) {
      props[oper] = this[oper].map((c) => c.toJSON(stringify))
    } else {
      props.operator = this.operator
      props.value = this.value
      props.fact = this.fact
      if (this.params) {
        props.params = this.params
      }
    }
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }

  validateComparisonValue (comparisonValue) {
    switch (this.operator) {
      case 'contains':
      case 'doesNotContain':
        return Array.isArray(comparisonValue)
      case 'lessThan':
      case 'lessThanInclusive':
      case 'greaterThan':
      case 'greaterThanInclusive':
        return Number.parseFloat(comparisonValue).toString() !== 'NaN'
      default:
        return true
    }
  }

  evaluate (comparisonValue, operatorMap) {
    if (!this.validateComparisonValue(comparisonValue)) {
      return false
    }
    switch (this.operator) {
      case 'equal':
        return comparisonValue === this.value
      case 'notEqual':
        return comparisonValue !== this.value
      case 'in':
        return this.value.includes(comparisonValue)
      case 'notIn':
        return !this.value.includes(comparisonValue)
      case 'contains':
        return comparisonValue.includes(this.value)
      case 'doesNotContain':
        return !comparisonValue.includes(this.value)
      case 'lessThan':
        return comparisonValue < this.value
      case 'lessThanInclusive':
        return comparisonValue <= this.value
      case 'greaterThan':
        return comparisonValue > this.value
      case 'greaterThanInclusive':
        return comparisonValue >= this.value
      // for any/all, simply comparisonValue that the sub-condition array evaluated truthy
      case 'any':
        return comparisonValue === true
      case 'all':
        return comparisonValue === true
      default:
        let op = operatorMap.get(this.operator)
        if (op) return op.evaluate(comparisonValue, this.value)
        throw new Error(`Unknown operator: ${this.operator}`)
    }
  }

  /**
   * Returns the boolean operator for the condition
   * If the condition is not a boolean condition, the result will be 'undefined'
   * @return {string 'all' or 'any'}
   */
  static booleanOperator (condition) {
    if (condition.hasOwnProperty('any')) {
      return 'any'
    } else if (condition.hasOwnProperty('all')) {
      return 'all'
    }
  }

  booleanOperator () {
    return Condition.booleanOperator(this)
  }

  isBooleanOperator () {
    return Condition.booleanOperator(this) !== undefined
  }
}
