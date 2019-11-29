'use strict'

import deepClone from 'clone'

export default class RuleResult {
  constructor (conditions, event, priority, name) {
    this.conditions = deepClone(conditions)
    this.event = deepClone(event)
    this.priority = deepClone(priority)
    this.name = deepClone(name)
    this.result = null
  }

  setResult (result) {
    this.result = result
  }

  toJSON (stringify = true) {
    const props = {
      conditions: this.conditions.toJSON(false),
      event: this.event,
      priority: this.priority,
      name: this.name,
      result: this.result
    }
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }
}
