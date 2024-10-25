import engineFactory from "../src/index.mjs";

import { describe, it, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: rule priorities", () => {
  let engine;

  const highPriorityEvent = { type: "highPriorityEvent" };
  const midPriorityEvent = { type: "midPriorityEvent" };
  const lowestPriorityEvent = { type: "lowestPriorityEvent" };
  const conditions = {
    any: [
      {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 21,
      },
    ],
  };

  function setup() {
    const factSpy = vi.fn().mockReturnValue(22);
    const eventSpy = vi.fn();
    engine = engineFactory();

    const highPriorityRule = ruleFactory({
      conditions,
      event: midPriorityEvent,
      priority: 50,
    });
    engine.addRule(highPriorityRule);

    const midPriorityRule = ruleFactory({
      conditions,
      event: highPriorityEvent,
      priority: 100,
    });
    engine.addRule(midPriorityRule);

    const lowPriorityRule = ruleFactory({
      conditions,
      event: lowestPriorityEvent,
      priority: 1,
    });
    engine.addRule(lowPriorityRule);

    engine.addFact("age", factSpy);
    engine.on("success", eventSpy);
  }

  it("runs the rules in order of priority", () => {
    setup();
    expect(engine.prioritizedRules).toBeNull();
    engine.prioritizeRules();
    expect(engine.prioritizedRules.length).toBe(3);
    expect(engine.prioritizedRules[0][0].priority).toBe(100);
    expect(engine.prioritizedRules[1][0].priority).toBe(50);
    expect(engine.prioritizedRules[2][0].priority).toBe(1);
  });

  it("clears re-propriorizes the rules when a new Rule is added", () => {
    engine.prioritizeRules();
    expect(engine.prioritizedRules.length).toBe(3);
    engine.addRule(ruleFactory());
    expect(engine.prioritizedRules).toBeNull();
  });

  it("resolves all events returning promises before executing the next rule", async () => {
    setup();

    const highPrioritySpy = vi.fn();
    const midPrioritySpy = vi.fn();
    const lowPrioritySpy = vi.fn();

    engine.on(highPriorityEvent.type, () => {
      return new Promise(function (resolve) {
        setTimeout(function () {
          highPrioritySpy();
          resolve();
        }, 10); // wait longest
      });
    });
    engine.on(midPriorityEvent.type, () => {
      return new Promise(function (resolve) {
        setTimeout(function () {
          midPrioritySpy();
          resolve();
        }, 5); // wait half as much
      });
    });

    engine.on(lowestPriorityEvent.type, () => {
      lowPrioritySpy(); // emit immediately. this event should still be triggered last
    });

    await engine.run();

    expect(Math.min(...highPrioritySpy.mock.invocationCallOrder)).toBeLessThan(
      Math.min(...midPrioritySpy.mock.invocationCallOrder),
    );
    expect(Math.min(...midPrioritySpy.mock.invocationCallOrder)).toBeLessThan(
      Math.min(...lowPrioritySpy.mock.invocationCallOrder),
    );
  });
});
