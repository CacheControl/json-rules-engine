'use strict'

module.exports = (options) => {
  options = options || {}
  return {
    priority: options.priority || 1,
    conditions: options.conditions || {
      all: [{
        'fact': 'age',
        'operator': 'lessThan',
        'value': 45
      },
      {
        'fact': 'pointBalance',
        'operator': 'greaterThanInclusive',
        'value': 1000
      }]
    },
    action: options.action || {
      type: 'pointCapReached',
      params: {
        currency: 'points',
        pointCap: 1000
      }
    }
  }
}
