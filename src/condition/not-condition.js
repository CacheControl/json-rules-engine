'use strict'

import Condition from './condition'

export default class NotCondition extends Condition {
  constructor (properties, comparisonConstructor) {
    super(properties)
    if (!Object.prototype.hasOwnProperty.call(properties, 'not')) { throw new Error('NotCondition: constructor "not" property required') }
    if (Array.isArray(properties.not)) {
      throw new Error('NotCondition: constructor "not" cannot be an array')
    }
    this.not = comparisonConstructor.construct(properties.not)
    this.operator = 'not'
    // boolean conditions always have a priority; default 1
    this.priority = this.priority || 1
  }

  /**
   * Converts the condition into a json-friendly structure
   * @param   {Boolean} stringify - whether to return as a json string
   * @returns {string,object} json string or json-friendly object
   */
  toJSON (stringify = true) {
    const props = super.toJSON(false)
    props.not = this.not.toJSON(false)
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }

  /**
   * Runs the nested condition and returns the inverse of the result
   *
   * @param   {Almanac} almanac
   * @param   {Map} operatorMap - map of available operators, keyed by operator name
   * @param   {Map} conditionMap - map of available conditions, keyed by condition name
   * @returns {object} - evaluation result
   */
  evaluate (almanac, operatorMap, conditionMap) {
    return Promise.all([
      this.not.evaluate(almanac, operatorMap, conditionMap),
      super.evaluate(almanac, operatorMap, conditionMap)
    ]).then(([not, evaluateResult]) => {
      evaluateResult.result = not.result !== true
      evaluateResult.not = not
      evaluateResult.operator = 'not'
      return evaluateResult
    })
  }

  skip () {
    const skipResult = super.skip()
    skipResult.not = this.not.skip()
    skipResult.operator = 'not'
    return skipResult
  }
}
