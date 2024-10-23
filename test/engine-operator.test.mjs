import engineFactory from "../src/index.mjs";
import { describe, it, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

async function dictionary(params) {
  const words = ["coffee", "Aardvark", "moose", "ladder", "antelope"];
  return words[params.wordIndex];
}

describe("Engine: operator", () => {
  const event = {
    type: "operatorTrigger",
  };
  const baseConditions = {
    any: [
      {
        fact: "dictionary",
        operator: "startsWithLetter",
        value: "a",
        params: {
          wordIndex: null,
        },
      },
    ],
  };
  let eventSpy;
  function setup(conditions = baseConditions) {
    eventSpy = vi.fn();
    const engine = engineFactory();
    const rule = ruleFactory({ conditions, event });
    engine.addRule(rule);
    engine.addOperator("startsWithLetter", (factValue, jsonValue) => {
      if (!factValue.length) return false;
      return factValue[0].toLowerCase() === jsonValue.toLowerCase();
    });
    engine.addFact("dictionary", dictionary);
    engine.on("success", eventSpy);
    return engine;
  }

  describe("evaluation", () => {
    it("emits when the condition is met", async () => {
      const conditions = Object.assign({}, baseConditions);
      conditions.any[0].params.wordIndex = 1;
      const engine = setup();
      await engine.run();
      expect(eventSpy).toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );
    });

    it("does not emit when the condition fails", async () => {
      const conditions = Object.assign({}, baseConditions);
      conditions.any[0].params.wordIndex = 0;
      const engine = setup();
      await engine.run();
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it("throws when it encounters an unregistered operator", async () => {
      const conditions = Object.assign({}, baseConditions);
      conditions.any[0].operator = "unknown-operator";
      const engine = setup();
      return expect(engine.run()).rejects.toThrow(
        "Unknown operator: unknown-operator",
      );
    });
  });
});
