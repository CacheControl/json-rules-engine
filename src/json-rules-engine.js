import Engine from './engine'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'
import Almanac from './almanac'
import ScopedAlmanac from './scoped-almanac'
import OperatorDecorator from './operator-decorator'

export { Fact, Rule, Operator, Engine, Almanac, ScopedAlmanac, OperatorDecorator }
export default function (rules, options) {
  return new Engine(rules, options)
}
