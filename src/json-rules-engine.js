import Engine from './engine'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'

export { Fact, Rule, Operator, Engine }
export default function (rules, options) {
  return new Engine(rules, options)
}
