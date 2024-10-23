import Engine from "../src/index.mjs";
import Rule from "../src/rule.mjs";

import { describe, it, beforeEach, expect, vi } from "vitest";
import conditionFactory from "./support/condition-factory.mjs";

describe("Rule", () => {
  const rule = new Rule();
  const conditionBase = conditionFactory({
    fact: "age",
    value: 50,
  });

  describe("constructor()", () => {
    it("can be initialized with priority, conditions, event, and name", () => {
      const condition = {
        all: [Object.assign({}, conditionBase)],
      };
      condition.operator = "all";
      condition.priority = 25;
      const opts = {
        priority: 50,
        conditions: condition,
        event: {
          type: "awesome",
        },
        name: "testName",
      };
      const rule = new Rule(opts);
      expect(rule.priority).toEqual(opts.priority);
      expect(rule.conditions).toEqual(opts.conditions);
      expect(rule.ruleEvent).toEqual(opts.event);
      expect(rule.name).toBe(opts.name);
    });

    it("it can be initialized with a json string", () => {
      const condition = {
        all: [Object.assign({}, conditionBase)],
      };
      condition.operator = "all";
      condition.priority = 25;
      const opts = {
        priority: 50,
        conditions: condition,
        event: {
          type: "awesome",
        },
        name: "testName",
      };
      const json = JSON.stringify(opts);
      const rule = new Rule(json);
      expect(rule.priority).toEqual(opts.priority);
      expect(rule.conditions).toEqual(opts.conditions);
      expect(rule.ruleEvent).toEqual(opts.event);
      expect(rule.name).toEqual(opts.name);
    });
  });

  describe("event emissions", () => {
    it("can emit", () => {
      const rule = new Rule();
      const successSpy = vi.fn();
      rule.on("test", successSpy);
      rule.emit("test");
      expect(successSpy).toHaveBeenCalledOnce();
    });

    it("can be initialized with an onSuccess option", () => {
      const event = { type: "test" };
      const onSuccess = vi.fn();
      const rule = new Rule({ onSuccess });
      rule.emit("success", event);
      expect(onSuccess).toHaveBeenCalledWith(event);
    });

    it("can be initialized with an onFailure option", () => {
      const event = { type: "test" };
      const onFailure = vi.fn();
      const rule = new Rule({ onFailure });
      rule.emit("failure", event);
      expect(onFailure).toHaveBeenCalledWith(event);
    });
  });

  describe("setEvent()", () => {
    it("throws if no argument provided", () => {
      expect(() => rule.setEvent()).toThrow(
        /Rule: setEvent\(\) requires event object/,
      );
    });

    it('throws if argument is missing "type" property', () => {
      expect(() => rule.setEvent({})).toThrow(
        /Rule: setEvent\(\) requires event object with "type" property/,
      );
    });
  });

  describe("setEvent()", () => {
    it("throws if no argument provided", () => {
      expect(() => rule.setEvent()).toThrow(
        /Rule: setEvent\(\) requires event object/,
      );
    });

    it('throws if argument is missing "type" property', () => {
      expect(() => rule.setEvent({})).toThrow(
        /Rule: setEvent\(\) requires event object with "type" property/,
      );
    });
  });

  describe("setConditions()", () => {
    describe("validations", () => {
      it("throws an exception for invalid root conditions", () => {
        expect(rule.setConditions.bind(rule, { foo: true })).toThrow(
          /"conditions" root must contain a single instance of "all", "any", "not", or "condition"/,
        );
      });
    });
  });

  describe("setPriority", () => {
    it("defaults to a priority of 1", () => {
      expect(rule.priority).toBe(1);
    });

    it("allows a priority to be set", () => {
      rule.setPriority(10);
      expect(rule.priority).toBe(10);
    });

    it("errors if priority is less than 0", () => {
      expect(rule.setPriority.bind(null, 0)).toThrow(/greater than zero/);
    });
  });

  describe("accessors", () => {
    it("retrieves event", () => {
      const event = { type: "e", params: { a: "b" } };
      rule.setEvent(event);
      expect(rule.getEvent()).toEqual(event);
    });

    it("retrieves priority", () => {
      const priority = 100;
      rule.setPriority(priority);
      expect(rule.getPriority()).toBe(priority);
    });

    it("retrieves conditions", () => {
      const condition = { all: [] };
      rule.setConditions(condition);
      expect(rule.getConditions()).toEqual({
        all: [],
        operator: "all",
        priority: 1,
      });
    });
  });

  describe("setName", () => {
    it("defaults to undefined", () => {
      expect(rule.name).toBeUndefined();
    });

    it("allows the name to be set", () => {
      rule.setName("Test Name");
      expect(rule.name).toBe("Test Name");
    });

    it("allows input of the number 0", () => {
      rule.setName(0);
      expect(rule.name).toBe(0);
    });

    it("allows input of an object", () => {
      rule.setName({
        id: 123,
        name: "myRule",
      });
      expect(rule.name).toEqual({
        id: 123,
        name: "myRule",
      });
    });

    it("errors if name is an empty string", () => {
      expect(rule.setName.bind(null, "")).toThrow(
        /Rule "name" must be defined/,
      );
    });
  });

  describe("priotizeConditions()", () => {
    const conditions = [
      {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 18,
      },
      {
        fact: "segment",
        operator: "equal",
        value: "human",
      },
      {
        fact: "accountType",
        operator: "equal",
        value: "admin",
      },
      {
        fact: "state",
        operator: "equal",
        value: "admin",
      },
    ];

    it("orders based on priority", async () => {
      const engine = new Engine();
      engine.addFact("state", async () => {}, { priority: 500 });
      engine.addFact("segment", async () => {}, { priority: 50 });
      engine.addFact("accountType", async () => {}, { priority: 25 });
      engine.addFact("age", async () => {}, { priority: 100 });
      const rule = new Rule();
      rule.setEngine(engine);

      const prioritizedConditions = rule.prioritizeConditions(conditions);
      expect(prioritizedConditions.length).toBe(4);
      expect(prioritizedConditions[0][0].fact).toBe("state");
      expect(prioritizedConditions[1][0].fact).toBe("age");
      expect(prioritizedConditions[2][0].fact).toBe("segment");
      expect(prioritizedConditions[3][0].fact).toBe("accountType");
    });
  });

  describe("evaluate()", () => {
    function setup() {
      const engine = new Engine();
      const rule = new Rule();
      rule.setConditions({
        all: [],
      });
      engine.addRule(rule);

      return { engine, rule };
    }
    it("evalutes truthy when there are no conditions", async () => {
      const engineSuccessSpy = vi.fn();
      const { engine } = setup();

      engine.on("success", engineSuccessSpy);

      await engine.run();

      expect(engineSuccessSpy).toHaveBeenCalledOnce();
    });

    it('waits for all on("success") event promises to be resolved', async () => {
      const engineSuccessSpy = vi.fn();
      const ruleSuccessSpy = vi.fn();
      const engineRunSpy = vi.fn();
      const { engine, rule } = setup();
      rule.on("success", () => {
        return new Promise(function (resolve) {
          setTimeout(function () {
            ruleSuccessSpy();
            resolve();
          }, 5);
        });
      });
      engine.on("success", engineSuccessSpy);

      await engine.run().then(() => engineRunSpy());

      expect(ruleSuccessSpy).toHaveBeenCalledOnce();
      expect(engineSuccessSpy).toHaveBeenCalledOnce();
      expect(Math.min(...ruleSuccessSpy.mock.invocationCallOrder)).toBeLessThan(
        Math.min(...engineRunSpy.mock.invocationCallOrder),
      );
      expect(Math.min(...ruleSuccessSpy.mock.invocationCallOrder)).toBeLessThan(
        Math.min(...engineSuccessSpy.mock.invocationCallOrder),
      );
    });
  });

  describe("toJSON() and fromJSON()", () => {
    const priority = 50;
    const event = {
      type: "to-json!",
      params: { id: 1 },
    };
    const conditions = {
      priority: 1,
      all: [
        {
          value: 10,
          operator: "equals",
          fact: "user",
          params: {
            foo: true,
          },
          path: "$.id",
        },
      ],
    };
    const name = "testName";
    let rule;
    beforeEach(() => {
      rule = new Rule();
      rule.setConditions(conditions);
      rule.setPriority(priority);
      rule.setEvent(event);
      rule.setName(name);
    });

    it("serializes itself", () => {
      const json = rule.toJSON(false);
      expect(Object.keys(json).length).toBe(4);
      expect(json.conditions).toEqual(conditions);
      expect(json.priority).toBe(priority);
      expect(json.event).toEqual(event);
      expect(json.name).toBe(name);
    });

    it("serializes itself as json", () => {
      const jsonString = rule.toJSON();
      expect(jsonString).toBeTypeOf("string");
      const json = JSON.parse(jsonString);
      expect(Object.keys(json).length).toBe(4);
      expect(json.conditions).toEqual(conditions);
      expect(json.priority).toBe(priority);
      expect(json.event).toEqual(event);
      expect(json.name).toBe(name);
    });

    it("rehydrates itself using a JSON string", () => {
      const jsonString = rule.toJSON();
      expect(jsonString).toBeTypeOf("string");
      const hydratedRule = new Rule(jsonString);
      expect(hydratedRule.conditions).toEqual(rule.conditions);
      expect(hydratedRule.priority).toBe(rule.priority);
      expect(hydratedRule.ruleEvent).toEqual(rule.ruleEvent);
      expect(hydratedRule.name).toBe(rule.name);
    });

    it("rehydrates itself using an object from JSON.parse()", () => {
      const jsonString = rule.toJSON();
      expect(jsonString).toBeTypeOf("string");
      const json = JSON.parse(jsonString);
      const hydratedRule = new Rule(json);
      expect(hydratedRule.conditions).toEqual(rule.conditions);
      expect(hydratedRule.priority).toBe(rule.priority);
      expect(hydratedRule.ruleEvent).toEqual(rule.ruleEvent);
      expect(hydratedRule.name).toBe(rule.name);
    });
  });
});
