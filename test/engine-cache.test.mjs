import engineFactory from "../src/index.mjs";
import { describe, it, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: cache", () => {
  let engine;

  const event = { type: "setDrinkingFlag" };
  const collegeSeniorEvent = { type: "isCollegeSenior" };
  const conditions = {
    any: [
      {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 21,
      },
    ],
  };

  let factSpy;
  let eventSpy;
  const ageFact = () => {
    factSpy();
    return 22;
  };
  function setup(factOptions) {
    factSpy = vi.fn();
    eventSpy = vi.fn();
    engine = engineFactory();
    const determineDrinkingAge = ruleFactory({
      conditions,
      event,
      priority: 100,
    });
    engine.addRule(determineDrinkingAge);
    const determineCollegeSenior = ruleFactory({
      conditions,
      event: collegeSeniorEvent,
      priority: 1,
    });
    engine.addRule(determineCollegeSenior);
    const over20 = ruleFactory({
      conditions,
      event: collegeSeniorEvent,
      priority: 50,
    });
    engine.addRule(over20);
    engine.addFact("age", ageFact, factOptions);
    engine.on("success", eventSpy);
  }

  it("loads facts once and caches the results for future use", async () => {
    setup({ cache: true });
    await engine.run();
    expect(eventSpy).toHaveBeenCalledTimes(3);
    expect(factSpy).toHaveBeenCalledOnce();
  });

  it("allows caching to be turned off", async () => {
    setup({ cache: false });
    await engine.run();
    expect(eventSpy).toHaveBeenCalledTimes(3);
    expect(factSpy).toHaveBeenCalledTimes(3);
  });
});
