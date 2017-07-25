'use strict'

import deepClone from 'clone'

export default class RuleResult {
  constructor (conditions, event, priority) {
    this.conditions = deepClone(conditions)
    this.event = deepClone(event)
    this.priority = deepClone(priority)
    this.result = null
  }

  setResult (result) {
    this.result = result
  }

  toJSON (stringify = true) {
    let props = {
      conditions: this.conditions.toJSON(false),
      event: this.event,
      priority: this.priority,
      result: this.result
    }
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }
}
