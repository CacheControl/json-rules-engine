"use strict";

export default class Pipe {
  /**
   * Constructor
   * @param {string}   name - pipe identifier
   * @param {function(factValue, jsonValue)} callback - pipe evaluation method
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {Pipe} - instance
   */
  constructor(name, cb, factValueValidator) {
    this.name = String(name)
    if (!name) throw new Error("Missing pipe name")
    if (typeof cb !== "function") throw new Error("Missing pipe callback")
    this.cb = cb
    this.factValueValidator = factValueValidator
    if (!this.factValueValidator) this.factValueValidator = () => true
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {mixed} factValue - fact result
   * @param   {mixed} jsonValue - "value" property of the condition
   * @returns {Boolean} - whether the values pass the pipe test
   */
  evaluate(factValue, ...args) {
    return this.factValueValidator(factValue) && this.cb(factValue, ...args)
  }
}
