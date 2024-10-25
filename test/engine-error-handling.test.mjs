import engineFactory from "../src/index.mjs";
import { describe, it, beforeEach, expect } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: failure", () => {
  let engine;

  const event = { type: "generic" };
  const conditions = {
    any: [
      {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 21,
      },
    ],
  };
  beforeEach(() => {
    engine = engineFactory();
    const determineDrinkingAgeRule = ruleFactory({ conditions, event });
    engine.addRule(determineDrinkingAgeRule);
    engine.addFact("age", function () {
      throw new Error("problem occurred");
    });
  });

  it("surfaces errors", () => {
    return expect(engine.run()).rejects.toThrow(/problem occurred/);
  });
});
