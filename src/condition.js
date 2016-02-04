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

  isBooleanOperator () {
    return this.any !== undefined || this.all !== undefined
  }
}
