import Engine from './engine'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'
import ConditionConstructor, { Condition, TopLevelConditionConstructor } from './condition'

export { Fact, Rule, Operator, Engine, ConditionConstructor, Condition, TopLevelConditionConstructor }
export default function (rules, options) {
  return new Engine(rules, options)
}
