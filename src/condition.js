'use strict'

import params from 'params'

export default class Condition {
  constructor (properties) {
    let booleanOperator
    if (properties.hasOwnProperty('any')) {
      booleanOperator = 'any'
    } else if (properties.hasOwnProperty('all')) {
      booleanOperator = 'all'
    }
    if (booleanOperator) {
      if (!(properties[booleanOperator] instanceof Array)) {
        throw new Error(`"${booleanOperator}" must be an array`)
      }
      this.operator = booleanOperator
      // boolean conditions always have a priority, default 1
      this.priority = parseInt(properties.priority, 10) || 1
      this[booleanOperator] = properties[booleanOperator].map((c) => {
        return new Condition(c)
      })
    } else {
      properties = params(properties).require(['fact', 'operator', 'value'])
      // a non-boolean condition does not have a priority by default. this allows
      // priority to be dictated by the fact definition
      if (properties.hasOwnProperty('priority')) {
        properties.priority = parseInt(properties.priority, 10)
      }
      properties = params(properties).only(['fact', 'operator', 'value', 'params', 'priority'])
      Object.keys(properties).forEach((p) => {
        this[p] = properties[p]
      })
    }
  }

  isBooleanOperator () {
    return this.any !== undefined || this.all !== undefined
  }
}
