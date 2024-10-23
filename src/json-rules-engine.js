import Engine from "./engine";
import Fact from "./fact";
import Rule from "./rule";
import Operator from "./operator";
import Almanac from "./almanac";
import OperatorDecorator from "./operator-decorator";

export { Fact, Rule, Operator, Engine, Almanac, OperatorDecorator };
export default function (rules, options) {
  return new Engine(rules, options);
}
