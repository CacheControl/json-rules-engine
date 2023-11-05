import Engine from './engine'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'
import Almanac from './almanac'

export { Fact, Rule, Operator, Engine, Almanac }
export default function (rules, options) {
  return new Engine(rules, options)
}
