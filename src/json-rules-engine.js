import Engine from './engine'
import Fact from './fact'
import Rule from './rule'
import Operator from './operator'
import {UndefinedFactError, UndefinedFactErrorCode} from "./errors";
export { Fact, Rule, Operator, Engine, UndefinedFactError, UndefinedFactErrorCode }
export default function (rules, options) {
  return new Engine(rules, options)
}
