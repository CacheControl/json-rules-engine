'use strict'

export let evaluateRuleConditions = function (engine, rule) {
  if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
    return
  }
  engine.emit('action', rule.action)
}

export default function (engine) {
  engine.rules.forEach(evaluateRuleConditions.bind(null, engine))
}
