import engineFactory from "../src/index.mjs";

import { describe, it, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine", () => {
  let engine;

  const event = { type: "early-twenties" };
  const conditions = {
    all: [
      {
        fact: "age",
        operator: "lessThanInclusive",
        value: 25,
      },
      {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 20,
      },
      {
        fact: "age",
        operator: "notIn",
        value: [21, 22],
      },
    ],
  };

  let eventSpy;
  let factSpy;
  function setup(factOptions) {
    factSpy = vi.fn();
    eventSpy = vi.fn();

    const factDefinition = () => {
      factSpy();
      return 24;
    };

    engine = engineFactory();
    const rule = ruleFactory({ conditions, event });
    engine.addRule(rule);
    engine.addFact("age", factDefinition, factOptions);
    engine.on("success", eventSpy);
  }

  describe("1 rule with parallel conditions", () => {
    it("calls the fact definition once for each condition if caching is off", async () => {
      setup({ cache: false });
      await engine.run();
      expect(eventSpy).toHaveBeenCalledOnce();
      expect(factSpy).toHaveBeenCalledTimes(3);
    });

    it("calls the fact definition once", async () => {
      setup();
      await engine.run();
      expect(eventSpy).toHaveBeenCalledOnce();
      expect(factSpy).toHaveBeenCalledOnce();
    });
  });

  describe("2 rules with parallel conditions", () => {
    it("calls the fact definition once", async () => {
      setup();
      const conditions = {
        all: [
          {
            fact: "age",
            operator: "notIn",
            value: [21, 22],
          },
        ],
      };
      const rule = ruleFactory({ conditions, event });
      engine.addRule(rule);

      await engine.run();
      expect(eventSpy).toHaveBeenCalledTimes(2);
      expect(factSpy).toHaveBeenCalledOnce();
    });
  });
});
