'use strict'

module.exports = function (options) {
  const cond = {
    fact: options.fact || null,
    value: options.value || null,
    operator: options.operator || 'equal',
  }
  if (options.pipes) {
    cond.pipes = options.pipes
  }
  return cond
}
