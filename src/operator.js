'use strict'

export default class Operator {
  /**
   * Constructor
   * @param {string}   name - operator identifier
   * @param {function(factValue, jsonValue)} callback - operator evaluation method
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {Operator} - instance
   */
  constructor (name, cb, factValueValidator) {
    this.name = String(name)
    if (!name) throw new Error('Missing operator name')
    if (typeof cb !== 'function') throw new Error('Missing operator callback')
    this.cb = cb
    this.factValueValidator = factValueValidator
    if (!this.factValueValidator) this.factValueValidator = () => true
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {mixed} factValue - fact result
   * @param   {mixed} jsonValue - "value" property of the condition
   * @returns {Boolean} - whether the values pass the operator test
   */
  evaluate (factValue, jsonValue) {
    return this.factValueValidator(factValue) && this.cb(factValue, jsonValue)
  }
}
