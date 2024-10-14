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

  resolveEventParams (almanac) {
    if (this.event.params instanceof Object) {
      const updates = []
      for (const key in this.event.params) {
        if (Object.prototype.hasOwnProperty.call(this.event.params, key)) {
          updates.push(
            almanac
              .getValue(this.event.params[key])
              .then((val) => (this.event.params[key] = val))
          )
        }
      }
      return Promise.all(updates)
    }
    return Promise.resolve()
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
