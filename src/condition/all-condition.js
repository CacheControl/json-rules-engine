'use strict'

import Condition from './condition'
import prioritizeAndRun from './prioritize-and-run'

export default class AllCondition extends Condition {
  constructor (properties, conditionConstructor) {
    super(properties)
    if (!Object.prototype.hasOwnProperty.call(properties, 'all')) {
      throw new Error('AllCondition: constructor "all" property required')
    }
    if (!Array.isArray(properties.all)) {
      throw new Error('AllCondition: constructor "all" must be an array')
    }
    this.all = properties.all.map((c) => conditionConstructor.construct(c))
    this.operator = 'all'
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
    props.all = this.all.map((c) => c.toJSON(false))
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
      prioritizeAndRun(this.all, 'all', almanac, operatorMap, conditionMap),
      super.evaluate(almanac, operatorMap, conditionMap)
    ]).then(([result, evaluateResult]) => {
      evaluateResult.result = result.result
      evaluateResult.all = result.conditions
      evaluateResult.operator = 'all'
      return evaluateResult
    })
  }

  skip () {
    const skipResult = super.skip()
    skipResult.all = this.all.map((c) => c.skip())
    skipResult.operator = 'all'
    return skipResult
  }
}
