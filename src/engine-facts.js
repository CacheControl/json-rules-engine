'use strict'

let SuccessEventFact = function () {
  let successTriggers = []
  return (params = {}) => {
    if (params.event) {
      successTriggers.push(params.event)
    }
    return successTriggers
  }
}

export { SuccessEventFact }
