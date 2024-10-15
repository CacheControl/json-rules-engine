'use strict'

import Operator from './operator'

export default class OperatorDecorator {
  /**
   * Constructor
   * @param {string}   name - decorator identifier
   * @param {function(factValue, jsonValue, next)} callback - callback that takes the next operator as a parameter
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {OperatorDecorator} - instance
   */
  constructor (name, cb, factValueValidator) {
    this.name = String(name)
    if (!name) throw new Error('Missing decorator name')
    if (typeof cb !== 'function') throw new Error('Missing decorator callback')
    this.cb = cb
    this.factValueValidator = factValueValidator
    if (!this.factValueValidator) this.factValueValidator = () => true
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {Operator} operator - fact result
   * @returns {Operator} - whether the values pass the operator test
   */
  decorate (operator) {
    const next = operator.evaluate.bind(operator)
    return new Operator(
        `${this.name}:${operator.name}`,
        (factValue, jsonValue) => {
          return this.cb(factValue, jsonValue, next)
        },
        this.factValueValidator
    )
  }
}
