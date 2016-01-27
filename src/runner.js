'use strict'

export let evaluateRuleConditions = function (engine, rule) {
  if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
    return
  }
}

class Runner {
  constructor (engine) {
    this.engine = engine
  }

  // @TODO; support run(cb)
  async run () {
    return Promise.all(this.engine.rules.map(async (rule) => {
      let ruleResult = await rule.evaluate(this.engine)
      if (ruleResult) this.engine.emit('action', rule.action)
    }))
  }
}

export default Runner
