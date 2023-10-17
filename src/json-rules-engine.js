import Engine from './engine'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'
import ConditionConstructor, { Condition } from './condition'

export { Fact, Rule, Operator, Engine, ConditionConstructor, Condition }
export default function (rules, options) {
  return new Engine(rules, options)
}
