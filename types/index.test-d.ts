import { expectType } from "tsd";

import rulesEngine, {
  Almanac,
  EngineResult,
  Engine,
  Fact,
  Operator,
  OperatorEvaluator,
  PathResolver,
  Rule,
  RuleProperties,
  RuleSerializable
} from "../";

// setup basic fixture data
const ruleProps: RuleProperties = {
  conditions: {
    all: []
  },
  event: {
    type: "message"
  }
};

const complexRuleProps: RuleProperties = {
  conditions: {
    all: [
      {
        any: [
          {
            all: []
          },
          {
            fact: "foo",
            operator: "equal",
            value: "bar"
          }
        ]
      }
    ]
  },
  event: {
    type: "message"
  }
};

// path resolver
const pathResolver = function(value: object, path: string): any {}
expectType<PathResolver>(pathResolver)

// default export test
expectType<Engine>(rulesEngine([ruleProps]));
const engine = rulesEngine([complexRuleProps]);

// Rule tests
const rule: Rule = new Rule(ruleProps);
const ruleFromString: Rule = new Rule(JSON.stringify(ruleProps));
expectType<Engine>(engine.addRule(rule));
expectType<boolean>(engine.removeRule(ruleFromString));
expectType<void>(engine.updateRule(ruleFromString));

expectType<Rule>(rule.setConditions({ any: [] }));
expectType<Rule>(rule.setEvent({ type: "test" }));
expectType<Rule>(rule.setPriority(1));
expectType<string>(rule.toJSON());
expectType<string>(rule.toJSON(true));
expectType<RuleSerializable>(rule.toJSON(false));

// Operator tests
const operatorEvaluator: OperatorEvaluator<number, number> = (
  a: number,
  b: number
) => a === b;
expectType<Map<string, Operator>>(
  engine.addOperator("test", operatorEvaluator)
);
const operator: Operator = new Operator(
  "test",
  operatorEvaluator,
  (num: number) => num > 0
);
expectType<Map<string, Operator>>(engine.addOperator(operator));
expectType<boolean>(engine.removeOperator(operator));

// Fact tests
const fact = new Fact<number>("test-fact", 3);
const dynamicFact = new Fact<number[]>("test-fact", () => [42]);
expectType<Engine>(
  engine.addFact<string>("test-fact", "value", { priority: 10 })
);
expectType<Engine>(engine.addFact(fact));
expectType<Engine>(engine.addFact(dynamicFact));
expectType<boolean>(engine.removeFact(fact));
expectType<Fact<string>>(engine.getFact<string>("test"));

// Run the Engine
expectType<Promise<EngineResult>>(engine.run({ displayMessage: true }));

// Alamanac tests
const almanac: Almanac = (await engine.run()).almanac;

expectType<Promise<string>>(almanac.factValue<string>("test-fact"));
expectType<void>(almanac.addRuntimeFact("test-fact", "some-value"));
