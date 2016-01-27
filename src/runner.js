'use strict'

export let evaluateRuleConditions = function (engine, rule) {
  if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
    return
  }
  engine.emit('action', rule.action)
}

class Runner {
  constructor (engine) {
    this.engine = engine
  }

  run () {
    this.engine.rules.forEach(evaluateRuleConditions.bind(null, this.engine))
  }
}

export default Runner
