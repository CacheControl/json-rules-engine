import engineFactory from "../src/index.mjs";
import { describe, it, beforeEach, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

async function factSenior() {
  return 65;
}

async function factChild() {
  return 10;
}

async function factAdult() {
  return 30;
}

describe('Engine: "all" conditions', () => {
  let engine;

  describe('supports a single "all" condition', () => {
    const event = {
      type: "ageTrigger",
      params: {
        demographic: "under50",
      },
    };
    const conditions = {
      all: [
        {
          fact: "age",
          operator: "lessThan",
          value: 50,
        },
      ],
    };
    let eventSpy;
    beforeEach(() => {
      eventSpy = vi.fn();
      const rule = ruleFactory({ conditions, event });
      engine = engineFactory();
      engine.addRule(rule);
      engine.on("success", eventSpy);
    });

    it("emits when the condition is met", async () => {
      engine.addFact("age", factChild);
      await engine.run();
      expect(eventSpy).toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );
    });

    it("does not emit when the condition fails", () => {
      engine.addFact("age", factSenior);
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
      all: [
        {
          fact: "age",
          operator: "lessThan",
          value: 50,
        },
        {
          fact: "age",
          operator: "greaterThan",
          value: 21,
        },
      ],
    };
    const event = {
      type: "ageTrigger",
      params: {
        demographic: "adult",
      },
    };
    let eventSpy;
    beforeEach(() => {
      eventSpy = vi.fn();
      const rule = ruleFactory({ conditions, event });
      engine = engineFactory();
      engine.addRule(rule);
      engine.on("success", eventSpy);
    });

    it("emits an event when every condition is met", async () => {
      engine.addFact("age", factAdult);
      await engine.run();
      expect(eventSpy).toHaveBeenCalledWith(
        event,
        expect.anything(),
        expect.anything(),
      );
    });

    describe("a condition fails", () => {
      it("does not emit when the first condition fails", async () => {
        engine.addFact("age", factChild);
        await engine.run();
        expect(eventSpy).not.toHaveBeenCalledWith(
          event,
          expect.anything(),
          expect.anything(),
        );
      });

      it("does not emit when the second condition", async () => {
        engine.addFact("age", factSenior);
        await engine.run();
        expect(eventSpy).not.toHaveBeenCalledWith(
          event,
          expect.anything(),
          expect.anything(),
        );
      });
    });
  });
});
