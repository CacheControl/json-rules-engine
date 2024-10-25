import Engine from "./engine.mjs";
import Fact from "./fact.mjs";
import Rule from "./rule.mjs";
import Operator from "./operator.mjs";
import Almanac from "./almanac.mjs";
import OperatorDecorator from "./operator-decorator.mjs";

export { Fact, Rule, Operator, Engine, Almanac, OperatorDecorator };
export default function (rules, options) {
  return new Engine(rules, options);
}
