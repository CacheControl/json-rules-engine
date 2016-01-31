'use strict'

import params from 'params'

export default class Condition {
  constructor (properties) {
    if (Object.keys(properties).includes('any') || Object.keys(properties).includes('all')) {
      let keys = Object.keys(properties)
      if (keys.length !== 1) {
        throw new Error('boolean operators be an object with a "all" or "any" property')
      }
      let booleanOperator = keys[0]
      if (!(properties[booleanOperator] instanceof Array)) {
        throw new Error(`"${booleanOperator}" must be an array`)
      }
      this[booleanOperator] = properties[booleanOperator].map((c) => {
        return new Condition(c)
      })
    } else {
      properties = params(properties).require(['fact', 'operator', 'value'])
      properties = params(properties).only(['fact', 'operator', 'value', 'params'])
      Object.keys(properties).forEach((p) => {
        this[p] = properties[p]
      })
    }
  }
}
