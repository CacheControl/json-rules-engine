'use strict'

import deepClone from 'clone'
import debug from '../debug'
import Condition from './condition'

export default class ComparisonCondition extends Condition {
  constructor (properties) {
    super(properties)
    if (!Object.prototype.hasOwnProperty.call(properties, 'fact')) { throw new Error('Condition: constructor "fact" property required') }
    if (!Object.prototype.hasOwnProperty.call(properties, 'operator')) { throw new Error('Condition: constructor "operator" property required') }
    if (!Object.prototype.hasOwnProperty.call(properties, 'value')) { throw new Error('Condition: constructor "value" property required') }
    this.fact = properties.fact
    if (Object.prototype.hasOwnProperty.call(properties, 'params')) {
      this.params = properties.params
    }
    if (Object.prototype.hasOwnProperty.call(properties, 'path')) {
      this.path = properties.path
    }
    this.operator = properties.operator
    this.value = properties.value
  }

  /**
   * Converts the condition into a json-friendly structure
   * @param   {Boolean} stringify - whether to return as a json string
   * @returns {string,object} json string or json-friendly object
   */
  toJSON (stringify = true) {
    const props = super.toJSON(false)
    props.operator = this.operator
    props.value = this.value
    props.fact = this.fact
    if (this.params) {
      props.params = this.params
    }
    if (this.path) {
      props.path = this.path
    }
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }

  getPriority (almanac) {
    const priority = super.getPriority(almanac)
    return priority !== undefined ? priority : almanac.factPriority(this.fact)
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
    if (!almanac) return Promise.reject(new Error('almanac required'))
    if (!operatorMap) return Promise.reject(new Error('operatorMap required'))

    const op = operatorMap.get(this.operator)
    if (!op) { return Promise.reject(new Error(`Unknown operator: ${this.operator}`)) }

    return Promise.all([
      almanac.getValue(this.value),
      almanac.factValue(this.fact, this.params, this.path),
      super.evaluate(almanac, operatorMap, conditionMap)
    ]).then(([rightHandSideValue, leftHandSideValue, evaluateResult]) => {
      const result = op.evaluate(leftHandSideValue, rightHandSideValue)
      debug(
        `condition::evaluate <${JSON.stringify(leftHandSideValue)} ${
          this.operator
        } ${JSON.stringify(rightHandSideValue)}?> (${result})`
      )
      evaluateResult.result = result
      evaluateResult.fact = this.fact
      if (this.params) {
        evaluateResult.params = deepClone(this.params)
      }
      if (this.path) {
        evaluateResult.path = this.path
      }
      evaluateResult.operator = this.operator
      evaluateResult.value = deepClone(this.value)
      evaluateResult.factResult = leftHandSideValue
      evaluateResult.valueResult = rightHandSideValue
      return evaluateResult
    })
  }

  skip () {
    const skipResult = super.skip()
    skipResult.fact = this.fact
    if (this.params) {
      skipResult.params = deepClone(this.params)
    }
    if (this.path) {
      skipResult.path = this.path
    }
    skipResult.operator = this.operator
    skipResult.value = deepClone(this.value)
    return skipResult
  }
}
