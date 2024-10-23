import engineFactory, { Fact, Rule, Operator } from "../src/index.mjs";
import defaultOperators from "../src/engine-default-operators.mjs";
import { describe, it, beforeEach, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine", () => {
  let engine;

  beforeEach(() => {
    engine = engineFactory();
  });

  it("has methods for managing facts and rules, and running itself", () => {
    expect(engine).toHaveProperty("addRule");
    expect(engine).toHaveProperty("removeRule");
    expect(engine).toHaveProperty("addOperator");
    expect(engine).toHaveProperty("removeOperator");
    expect(engine).toHaveProperty("addFact");
    expect(engine).toHaveProperty("removeFact");
    expect(engine).toHaveProperty("run");
    expect(engine).toHaveProperty("stop");
  });

  describe("constructor", () => {
    it("initializes with the default state", () => {
      expect(engine.status).toBe("READY");
      expect(engine.rules.length).toBe(0);
      defaultOperators.forEach((op) => {
        expect(engine.operators.get(op.name)).toBeInstanceOf(Operator);
      });
    });

    it("can be initialized with rules", () => {
      const rules = [ruleFactory(), ruleFactory(), ruleFactory()];
      engine = engineFactory(rules);
      expect(engine.rules.length).toBe(rules.length);
    });
  });

  describe("stop()", () => {
    it('changes the status to "FINISHED"', () => {
      expect(engine.stop().status).toBe("FINISHED");
    });
  });

  describe("addRule()", () => {
    describe("rule instance", () => {
      it("adds the rule", () => {
        const rule = new Rule(ruleFactory());
        expect(engine.rules.length).toBe(0);
        engine.addRule(rule);
        expect(engine.rules.length).toBe(1);
        expect(engine.rules).toContain(rule);
      });
    });

    describe("required fields", () => {
      it(".conditions", () => {
        const rule = ruleFactory();
        delete rule.conditions;
        expect(() => {
          engine.addRule(rule);
        }).toThrow(
          /Engine: addRule\(\) argument requires "conditions" property/,
        );
      });

      it(".event", () => {
        const rule = ruleFactory();
        delete rule.event;
        expect(() => {
          engine.addRule(rule);
        }).toThrow(/Engine: addRule\(\) argument requires "event" property/);
      });
    });
  });

  describe("updateRule()", () => {
    it("updates rule", () => {
      let rule1 = new Rule(ruleFactory({ name: "rule1" }));
      let rule2 = new Rule(ruleFactory({ name: "rule2" }));
      engine.addRule(rule1);
      engine.addRule(rule2);
      expect(engine.rules[0].conditions.all.length).toBe(2);
      expect(engine.rules[1].conditions.all.length).toBe(2);

      rule1.conditions = { all: [] };
      engine.updateRule(rule1);

      rule1 = engine.rules.find((rule) => rule.name === "rule1");
      rule2 = engine.rules.find((rule) => rule.name === "rule2");
      expect(rule1.conditions.all.length).toBe(0);
      expect(rule2.conditions.all.length).toBe(2);
    });

    it("should throw error if rule not found", () => {
      const rule1 = new Rule(ruleFactory({ name: "rule1" }));
      engine.addRule(rule1);
      const rule2 = new Rule(ruleFactory({ name: "rule2" }));
      expect(() => {
        engine.updateRule(rule2);
      }).toThrow(/Engine: updateRule\(\) rule not found/);
    });
  });

  describe("removeRule()", () => {
    function setup() {
      const rule1 = new Rule(ruleFactory({ name: "rule1" }));
      const rule2 = new Rule(ruleFactory({ name: "rule2" }));
      engine.addRule(rule1);
      engine.addRule(rule2);
      engine.prioritizeRules();

      return [rule1, rule2];
    }
    describe("remove by rule.name", () => {
      it("removes a single rule", () => {
        const [rule1] = setup();
        expect(engine.rules.length).toBe(2);

        const isRemoved = engine.removeRule(rule1.name);

        expect(isRemoved).toBe(true);
        expect(engine.rules.length).toBe(1);
        expect(engine.prioritizedRules).toBeNull();
      });

      it("removes multiple rules with the same name", () => {
        const [rule1] = setup();
        const rule3 = new Rule(ruleFactory({ name: rule1.name }));
        engine.addRule(rule3);
        expect(engine.rules.length).toBe(3);

        const isRemoved = engine.removeRule(rule1.name);

        expect(isRemoved).toBe(true);
        expect(engine.rules.length).toBe(1);
        expect(engine.prioritizedRules).toBeNull();
      });

      it("returns false when rule cannot be found", () => {
        setup();
        expect(engine.rules.length).toBe(2);

        const isRemoved = engine.removeRule("not-found-name");

        expect(isRemoved).toBe(false);
        expect(engine.rules.length).toBe(2);
        expect(engine.prioritizedRules).not.toBeNull();
      });
    });
    describe("remove by rule object", () => {
      it("removes a single rule", () => {
        const [rule1] = setup();
        expect(engine.rules.length).toBe(2);

        const isRemoved = engine.removeRule(rule1);

        expect(isRemoved).toBe(true);
        expect(engine.rules.length).toBe(1);
        expect(engine.prioritizedRules).toBeNull();
      });

      it("removes a single rule, even if two have the same name", () => {
        const [rule1] = setup();
        const rule3 = new Rule(ruleFactory({ name: rule1.name }));
        engine.addRule(rule3);
        expect(engine.rules.length).toBe(3);

        const isRemoved = engine.removeRule(rule1);

        expect(isRemoved).toBe(true);
        expect(engine.rules.length).toBe(2);
        expect(engine.prioritizedRules).toBeNull();
      });

      it("returns false when rule cannot be found", () => {
        setup();
        expect(engine.rules.length).toBe(2);

        const rule3 = new Rule(ruleFactory({ name: "rule3" }));
        const isRemoved = engine.removeRule(rule3);

        expect(isRemoved).toBe(false);
        expect(engine.rules.length).toBe(2);
        expect(engine.prioritizedRules).not.toBeNull();
      });
    });
  });

  describe("addOperator()", () => {
    it("adds the operator", () => {
      engine.addOperator("startsWithLetter", (factValue, jsonValue) => {
        return factValue[0] === jsonValue;
      });
      expect(engine.operators.get("startsWithLetter")).toBeDefined();
      expect(engine.operators.get("startsWithLetter")).toBeInstanceOf(Operator);
    });

    it("accepts an operator instance", () => {
      const op = new Operator("my-operator", () => true);
      engine.addOperator(op);
      expect(engine.operators.get("my-operator")).toEqual(op);
    });
  });

  describe("removeOperator()", () => {
    it("removes the operator", () => {
      engine.addOperator("startsWithLetter", (factValue, jsonValue) => {
        return factValue[0] === jsonValue;
      });
      expect(engine.operators.get("startsWithLetter")).toBeInstanceOf(Operator);
      engine.removeOperator("startsWithLetter");
      expect(engine.operators.get("startsWithLetter")).toBeNull();
    });

    it("can only remove added operators", () => {
      const isRemoved = engine.removeOperator("nonExisting");
      expect(isRemoved).toBe(false);
    });
  });

  describe("addFact()", () => {
    const FACT_NAME = "FACT_NAME";
    const FACT_VALUE = "FACT_VALUE";

    function assertFact(engine) {
      expect(engine.facts.size).toBe(1);
      expect(engine.facts.has(FACT_NAME)).toBe(true);
    }

    it("allows a constant fact", () => {
      engine.addFact(FACT_NAME, FACT_VALUE);
      assertFact(engine);
      expect(engine.facts.get(FACT_NAME).value).toBe(FACT_VALUE);
    });

    it("allows options to be passed", () => {
      const options = { cache: false };
      engine.addFact(FACT_NAME, FACT_VALUE, options);
      assertFact(engine);
      expect(engine.facts.get(FACT_NAME).value).toBe(FACT_VALUE);
      expect(engine.facts.get(FACT_NAME).options).toEqual(options);
    });

    it("allows a lamba fact with no options", () => {
      engine.addFact(FACT_NAME, async () => {
        return FACT_VALUE;
      });
      assertFact(engine);
      expect(engine.facts.get(FACT_NAME).value).toBeUndefined();
    });

    it("allows a lamba fact with options", () => {
      const options = { cache: false };
      engine.addFact(
        FACT_NAME,
        async () => {
          return FACT_VALUE;
        },
        options,
      );
      assertFact(engine);
      expect(engine.facts.get(FACT_NAME).options).toEqual(options);
      expect(engine.facts.get(FACT_NAME).value).toBeUndefined();
    });

    it("allows a fact instance", () => {
      const options = { cache: false };
      const fact = new Fact(FACT_NAME, 50, options);
      engine.addFact(fact);
      assertFact(engine);
      expect(engine.facts.get(FACT_NAME)).toBeDefined();
      expect(engine.facts.get(FACT_NAME).options).toEqual(options);
    });
  });

  describe("removeFact()", () => {
    it("removes a Fact", () => {
      expect(engine.facts.size).toBe(0);
      const fact = new Fact("newFact", 50, { cache: false });
      engine.addFact(fact);
      expect(engine.facts.size).toBe(1);
      engine.removeFact("newFact");
      expect(engine.facts.size).toBe(0);
    });

    it("can only remove added facts", () => {
      expect(engine.facts.size).toBe(0);
      const isRemoved = engine.removeFact("newFact");
      expect(isRemoved).toBe(false);
    });
  });

  describe("run()", () => {
    beforeEach(() => {
      const conditions = {
        all: [
          {
            fact: "age",
            operator: "greaterThanInclusive",
            value: 18,
          },
        ],
      };
      const event = { type: "generic" };
      const rule = ruleFactory({ conditions, event });
      engine.addRule(rule);
      engine.addFact("age", 20);
    });

    it('changes the status to "RUNNING"', () => {
      const eventSpy = vi.fn();
      engine.on("success", () => {
        eventSpy();
        expect(engine.status).toBe("RUNNING");
      });
      return engine.run();
    });

    it("changes status to FINISHED once complete", async () => {
      expect(engine.status).toBe("READY");
      await engine.run();
      expect(engine.status).toBe("FINISHED");
    });
  });
});
