'use strict'

import Condition from './condition'
import prioritizeAndRun from './prioritize-and-run'

export default class AnyCondition extends Condition {
  constructor (properties, conditionConstructor) {
    super(properties)
    if (!Object.prototype.hasOwnProperty.call(properties, 'any')) {
      throw new Error('AnyCondition: constructor "any" property required')
    }
    if (!Array.isArray(properties.any)) {
      throw new Error('AnyCondition: constructor "any" must be an array')
    }
    this.any = properties.any.map((c) => conditionConstructor.construct(c))
    this.operator = 'any'
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
    props.any = this.any.map((c) => c.toJSON(false))
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the operator
   *   LHS                      OPER       RHS
   * <fact + params + path>  <operator>  <value>
   *
   * @param   {Almanac} almanac
   * @param   {Map} operatorMap - map of available operators, keyed by operator name
   * @returns {Boolean} - evaluation result
   */
  evaluate (almanac, operatorMap, conditionMap) {
    return Promise.all([
      prioritizeAndRun(this.any, 'any', almanac, operatorMap, conditionMap),
      super.evaluate(almanac, operatorMap, conditionMap)
    ]).then(([result, evaluateResult]) => {
      evaluateResult.any = result.conditions
      evaluateResult.operator = 'any'
      evaluateResult.result = result.result
      return evaluateResult
    })
  }

  skip () {
    const skipResult = super.skip()
    skipResult.any = this.any.map((c) => c.skip())
    skipResult.operator = 'any'
    return skipResult
  }
}
