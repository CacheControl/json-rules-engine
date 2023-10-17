export default class Condition {
  constructor (properties) {
    if (!properties) throw new Error('Condition: constructor options required')
    if (Object.prototype.hasOwnProperty.call(properties, 'priority')) {
      properties.priority = parseInt(properties.priority, 10)
    }
    Object.assign(this, properties)
  }

  /**
   * Converts the condition into a json-friendly structure
   * @param   {Boolean} stringify - whether to return as a json string
   * @returns {string,object} json string or json-friendly object
   */
  toJSON (stringify = true) {
    const props = {}
    if (this.priority) {
      props.priority = this.priority
    }
    if (this.name) {
      props.name = this.name
    }
    if (stringify) {
      return JSON.stringify(props)
    }
    return props
  }

  /**
   * Returns the priority of the condition.
   * @param {Almanac} almanac the almanac use to resolve fact based priority
   * @returns {number|undefined} a number or undefined value for the priority
   */
  getPriority (almanac) {
    return this.priority
  }

  /**
   * Evaluates the conditions,
   * returns the evaluation result including a result boolean.
   * @param {Almanac} almanac - the almanac to use for fact lookups
   * @param {Map} operatorMap - map of available operators keyed by operator name
   * @param {Map} conditionMap - map of available conditions keys by condition name
   * @returns {Promise<object>} - evaluation result
   */
  evaluate (almanac, operatorMap, conditionMap) {
    if (!almanac) return Promise.reject(new Error('almanac required'))
    if (!operatorMap) return Promise.reject(new Error('operatorMap required'))
    if (!conditionMap) { return Promise.reject(new Error('conditionMap required')) }
    const evaluateResult = {
      result: false,
      priority: this.getPriority(almanac)
    }
    if (this.name) {
      evaluateResult.name = this.name
    }
    return Promise.resolve(evaluateResult)
  }

  /**
   * Skips the evaluation and returns an appropriate skip result.
   * @returns A Skip result not containing a result property
   */
  skip () {
    const skipResult = {}
    if (this.priority) {
      skipResult.priority = this.priority
    }
    if (this.name) {
      skipResult.name = this.name
    }
    return skipResult
  }
}
