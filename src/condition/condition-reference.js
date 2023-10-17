'use strict'

import Condition from './condition'

export default class ConditionReference extends Condition {
  constructor (properties) {
    super(properties)
    if (!Object.prototype.hasOwnProperty.call(properties, 'condition')) { throw new Error('ConditionReference: constructor "condition" property required') }
    this.condition = properties.condition
  }

  /**
   * Converts the condition into a json-friendly structure
   * @param   {Boolean} stringify - whether to return as a json string
   * @returns {string,object} json string or json-friendly object
   */
  toJSON (stringify = true) {
    const props = super.toJSON(false)
    props.condition = this.condition
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }

  /**
   * Dereferences the condition from the condition map and runs it
   *
   * @param   {Almanac} almanac
   * @param   {Map} operatorMap - map of available operators, keyed by operator name
   * @param   {Map} conditionMap - map of available conditions, keyed by condition name
   * @returns {object} - evaluation result
   */
  evaluate (almanac, operatorMap, conditionMap) {
    if (!conditionMap) return Promise.reject(new Error('conditionMap required'))
    return conditionMap.get(this.condition).evaluate(almanac, operatorMap, conditionMap)
  }

  skip () {
    const skipResult = super.skip()
    skipResult.condition = this.condition
    return skipResult
  }
}
