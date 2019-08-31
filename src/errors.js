'use strict'

export class UndefinedFactError extends Error {
  constructor (factId, ...props) {
    if (!props[0]) props[0] = `Undefined fact: ${factId}`
    super(...props)
    this.fact = factId
    this.code = 'UNDEFINED_FACT'
  }
}
