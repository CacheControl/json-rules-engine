import Engine from './engine'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'
import Pipe from './pipe'

export { Fact, Rule, Operator, Pipe, Engine }
export default function (rules, options) {
  return new Engine(rules, options)
}
