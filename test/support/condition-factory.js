'use strict'

module.exports = function (options) {
  return {
    fact: options.fact || null,
    value: options.value || null,
    operator: options.operator || 'equal'
  }
}
