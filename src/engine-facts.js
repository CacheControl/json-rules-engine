'use strict'

const SuccessEventFact = function () {
  const successTriggers = []
  return (params = {}) => {
    if (params.event) {
      successTriggers.push(params.event)
    }
    return successTriggers
  }
}

const SuccessResultFact = function () {
  const successTriggers = []
  return (params = {}) => {
    if (params.ruleResult) {
      successTriggers.push(params.ruleResult)
    }
    return successTriggers
  }
}

export { SuccessEventFact, SuccessResultFact }
