import engineFactory from "../src/index.mjs";
import { describe, it, beforeEach, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe('Engine: "not" conditions', () => {
  let engine;

  describe('supports a single "not" condition', () => {
    const event = {
      type: "ageTrigger",
      params: {
        demographic: "under50",
      },
    };
    const conditions = {
      not: {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 50,
      },
    };
    let eventSpy;
    let ageSpy;
    beforeEach(() => {
      eventSpy = vi.fn();
      ageSpy = vi.fn();
      const rule = ruleFactory({ conditions, event });
      engine = engineFactory();
      engine.addRule(rule);
      engine.addFact("age", ageSpy);
      engine.on("success", eventSpy);
    });

    it("emits when the condition is met", async () => {
      ageSpy.mockReturnValue(10);
      await engine.run();
      expect(eventSpy).toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );
    });

    it("does not emit when the condition fails", () => {
      ageSpy.mockReturnValue(75);
      engine.run();
      expect(eventSpy).not.toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
