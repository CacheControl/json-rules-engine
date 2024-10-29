import { Engine } from "./engine.mjs";

export { Almanac, type AlmanacOptions, type PathResolver } from "./almanac.mjs";
export { Fact, type DynamicFactCallback, type FactOptions } from "./fact.mjs";
export {
  OperatorDecorator,
  type OperatorDecoratorEvaluator,
} from "./operator-decorator.mjs";
export {
  Operator,
  type FactValueValidator,
  type OperatorEvaluator,
} from "./operator.mjs";

export type {
  TopLevelCondition,
  TopLevelConditionResult,
  NestedCondition,
  NestedConditionResult,
} from "./condition/index.mjs";

export type { EngineOptions, EngineResult, RunOptions } from "./engine.mjs";
export { Rule, type RuleProperties, type RuleResult } from "./rule.mjs";

export type { Event } from "./events.mjs";

export { Engine };

export default function (...params: ConstructorParameters<typeof Engine>) {
  return new Engine(...params);
}
