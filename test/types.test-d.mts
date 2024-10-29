import { describe, it, expectTypeOf } from "vitest";

import rulesEngine, {
  Almanac,
  EngineResult,
  Engine,
  Event,
  Fact,
  Operator,
  OperatorEvaluator,
  OperatorDecorator,
  OperatorDecoratorEvaluator,
  PathResolver,
  Rule,
  RuleProperties,
  RuleResult,
} from "../src/index.mjs";

// setup basic fixture data
const ruleProps: RuleProperties = {
  conditions: {
    all: [],
  },
  event: {
    type: "message",
  },
};

const complexRuleProps: RuleProperties = {
  conditions: {
    all: [
      {
        any: [
          {
            all: [],
          },
          {
            fact: "foo",
            operator: "equal",
            value: "bar",
          },
        ],
      },
    ],
  },
  event: {
    type: "message",
  },
};

describe("type tests", () => {
  it("path resolver type", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pathResolver = function (_value: object, _path: string): any {};
    expectTypeOf<PathResolver>(pathResolver);
  });

  it("default export", () => {
    expectTypeOf<Engine>(rulesEngine([ruleProps]));
  });

  const engine = rulesEngine([complexRuleProps]);

  it("engine run returns a promise of the result", () => {
    expectTypeOf<Promise<EngineResult>>(engine.run({ displayMessage: true }));
  });

  describe("rule tests", () => {
    const rule = new Rule(ruleProps);
    const ruleFromString: Rule = new Rule(JSON.stringify(ruleProps));

    it("returns the engine when adding a rule", () => {
      expectTypeOf<Engine>(engine.addRule(rule));
    });

    it("returns boolean when removing a rule", () => {
      expectTypeOf<boolean>(engine.removeRule(ruleFromString));
    });

    it("returns void when updating a rule", () => {
      expectTypeOf<void>(engine.updateRule(ruleFromString));
    });
  });

  describe("operator tests", () => {
    const operatorEvaluator: OperatorEvaluator<number, number> = (
      a: number,
      b: number,
    ) => a === b;

    const operator: Operator<number, number> = new Operator(
      "test",
      operatorEvaluator,
      (num: unknown): num is number => Number(num) > 0,
    );

    it("returns void when adding an operatorEvaluator", () => {
      expectTypeOf<void>(engine.addOperator("test", operatorEvaluator));
    });

    it("returns void when adding an operator object", () => {
      expectTypeOf<void>(engine.addOperator(operator));
    });

    it("returns a boolean when removing an operator", () => {
      expectTypeOf<boolean>(engine.removeOperator(operator));
    });
  });

  describe("operator decorator tests", () => {
    const operatorDecoratorEvaluator: OperatorDecoratorEvaluator<
      number[],
      number,
      number,
      number
    > = (a: number[], b: number, next: OperatorEvaluator<number, number>) =>
      next(a[0], b);
    const operatorDecorator: OperatorDecorator<number[], number, number, number> = new OperatorDecorator(
      "first",
      operatorDecoratorEvaluator,
      (a: unknown): a is number[] => Array.isArray(a) && a.length > 0,
    );

    it("returns void when adding a decorator evaluator", () => {
      expectTypeOf<void>(
        engine.addOperatorDecorator("first", operatorDecoratorEvaluator),
      );
    });

    it("returns void when adding a decorator object", () => {
      expectTypeOf<void>(engine.addOperatorDecorator(operatorDecorator));
    });

    it("returns a boolean when removing a decorator", () => {
      expectTypeOf<boolean>(engine.removeOperatorDecorator(operatorDecorator));
    });
  });

  describe("fact tests", () => {
    const fact = new Fact<number>("test-fact", 3);
    const dynamicFact = new Fact<number[]>("test-fact", () => [42]);

    it("returns engine when adding a fact value", () => {
      expectTypeOf<Engine>(
        engine.addFact<string>("test-fact", "value", { priority: 10 }),
      );
    });

    it("returns engine when adding a constant fact object", () => {
      expectTypeOf<Engine>(engine.addFact(fact));
    });

    it("returns engine when adding a dynamic fact object", () => {
      expectTypeOf<Engine>(engine.addFact(dynamicFact));
    });

    it("returns boolean when removing a fact", () => {
      expectTypeOf<boolean>(engine.removeFact(fact));
    });

    it("returns fact when getting a fact", () => {
      expectTypeOf<Fact | undefined>(engine.getFact("test"));
    });
  });

  describe("almanac tests", () => {
    const almanac: Almanac = new Almanac();

    it("factValue returns promise of value", () => {
      expectTypeOf<Promise<string>>(almanac.factValue<string>("test-fact"));
    });
  });

  describe("event tests", () => {
    it("standard event has event, almanac, and ruleResult", () => {
      engine.on("success", (event, almanac, ruleResult) => {
        expectTypeOf<Event>(event);
        expectTypeOf<Almanac>(almanac);
        expectTypeOf<RuleResult>(ruleResult);
      });
    });

    it("custom event type has custom type, almanac, and ruleResult", () => {
      engine.on<{ foo: Array<string> }>("foo", (event, almanac, ruleResult) => {
        expectTypeOf<{ foo: Array<string> }>(event);
        expectTypeOf<Almanac>(almanac);
        expectTypeOf<RuleResult>(ruleResult);
      });
    });
  });
});
