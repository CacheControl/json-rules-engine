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

export { SuccessEventFact }
