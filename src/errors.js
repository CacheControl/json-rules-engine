'use strict'
export const UndefinedFactErrorCode = 'UNDEFINED_FACT';
export class UndefinedFactError extends Error {
  constructor (...props) {
    super(...props)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UndefinedFactError)
    }

    this.code = UndefinedFactErrorCode
  }
}
