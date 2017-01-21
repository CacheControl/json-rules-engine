'use strict'

export class UndefinedFactError extends Error {
  constructor (...props) {
    super(...props)
    this.code = 'UNDEFINED_FACT'
  }
}
