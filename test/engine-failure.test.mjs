import engineFactory from "../src/index.mjs";

import { describe, it, beforeEach, expect, vi } from "vitest";
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
    engine.addFact("age", 10);
  });

  it("emits an event on a rule failing", async () => {
    const failureSpy = vi.fn();
    engine.on("failure", failureSpy);
    await engine.run();
    expect(failureSpy).toHaveBeenCalledWith(
      engine.rules[0].ruleEvent,
      expect.anything(),
      expect.anything(),
    );
  });

  it("does not emit when a rule passes", async () => {
    const failureSpy = vi.fn();
    engine.on("failure", failureSpy);
    engine.addFact("age", 50);
    await engine.run();
    expect(failureSpy).not.toHaveBeenCalledOnce();
  });
});
