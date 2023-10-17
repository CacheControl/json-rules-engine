import AllCondition from './all-condition'
import AnyCondition from './any-condition'
import ComparisonCondition from './comparison-condition'
import Condition from './condition'
import ConditionReference from './condition-reference'
import NotCondition from './not-condition'

export default class ConditionConstructor {
  /**
   * Construct the correct condition subclass.
   * @param {*} options - the options for the condition
   * @returns {Condition} a condition subclass
   */
  construct (options) {
    if (!options) {
      throw new Error('Condition: constructor options required')
    }
    if (options instanceof Condition) {
      return options
    }
    if (Object.prototype.hasOwnProperty.call(options, 'any')) {
      return new AnyCondition(options, this)
    } else if (Object.prototype.hasOwnProperty.call(options, 'all')) {
      return new AllCondition(options, this)
    } else if (Object.prototype.hasOwnProperty.call(options, 'not')) {
      return new NotCondition(options, this)
    } else if (Object.prototype.hasOwnProperty.call(options, 'condition')) {
      return new ConditionReference(options)
    }
    return new ComparisonCondition(options)
  }
}

export class TopLevelConditionConstructor extends ConditionConstructor {
  constructor (nestedConditionConstructor) {
    super()
    this.nestedConditionConstructor = nestedConditionConstructor || new ConditionConstructor()
  }

  construct (options) {
    if (!options) {
      throw new Error('Condition: constructor options required')
    }
    if (options instanceof Condition) {
      return options
    }
    if (Object.prototype.hasOwnProperty.call(options, 'any')) {
      return new AnyCondition(options, this.nestedConditionConstructor)
    } else if (Object.prototype.hasOwnProperty.call(options, 'all')) {
      return new AllCondition(options, this.nestedConditionConstructor)
    } else if (Object.prototype.hasOwnProperty.call(options, 'not')) {
      return new NotCondition(options, this.nestedConditionConstructor)
    } else if (Object.prototype.hasOwnProperty.call(options, 'condition')) {
      return new ConditionReference(options)
    }
    throw new Error('"conditions" root must contain a single instance of "all", "any", "not", or "condition"')
  }
}
