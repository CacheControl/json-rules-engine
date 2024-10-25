import engineFactory from "../src/index.mjs";
import { describe, it, beforeEach, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe('Engine: "any" conditions', () => {
  let engine;

  describe('supports a single "any" condition', () => {
    const event = {
      type: "ageTrigger",
      params: {
        demographic: "under50",
      },
    };
    const conditions = {
      any: [
        {
          fact: "age",
          operator: "lessThan",
          value: 50,
        },
      ],
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

  describe('supports "any" with multiple conditions', () => {
    const conditions = {
      any: [
        {
          fact: "age",
          operator: "lessThan",
          value: 50,
        },
        {
          fact: "segment",
          operator: "equal",
          value: "european",
        },
      ],
    };
    const event = {
      type: "ageTrigger",
      params: {
        demographic: "under50",
      },
    };
    let eventSpy;
    let ageSpy;
    let segmentSpy;
    beforeEach(() => {
      eventSpy = vi.fn();
      ageSpy = vi.fn();
      segmentSpy = vi.fn();
      const rule = ruleFactory({ conditions, event });
      engine = engineFactory();
      engine.addRule(rule);
      engine.addFact("segment", segmentSpy);
      engine.addFact("age", ageSpy);
      engine.on("success", eventSpy);
    });

    it("emits an event when any condition is met", async () => {
      segmentSpy.mockReturnValue("north-american");
      ageSpy.mockReturnValue(25);
      await engine.run();
      expect(eventSpy).toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );

      segmentSpy.mockReturnValue("european");
      ageSpy.mockReturnValue(100);
      await engine.run();
      expect(eventSpy).toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );
    });

    it("does not emit when all conditions fail", async () => {
      segmentSpy.mockReturnValue("north-american");
      ageSpy.mockReturnValue(100);
      await engine.run();
      expect(eventSpy).not.toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
