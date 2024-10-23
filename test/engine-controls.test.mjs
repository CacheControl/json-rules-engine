import engineFactory from "../src/index.mjs";

import { describe, it, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: fact priority", () => {
  let engine;

  const event = { type: "adult-human-admins" };

  let eventSpy;
  let ageStub;
  let segmentStub;

  function setup() {
    ageStub = vi.fn();
    segmentStub = vi.fn();
    eventSpy = vi.fn();
    engine = engineFactory();

    let conditions = {
      any: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 18,
        },
      ],
    };
    let rule = ruleFactory({ conditions, event, priority: 100 });
    engine.addRule(rule);

    conditions = {
      any: [
        {
          fact: "segment",
          operator: "equal",
          value: "human",
        },
      ],
    };
    rule = ruleFactory({ conditions, event });
    engine.addRule(rule);

    engine.addFact("age", ageStub, { priority: 100 });
    engine.addFact("segment", segmentStub, { priority: 50 });
  }

  describe("stop()", () => {
    it("stops the rules from executing", async () => {
      setup();
      ageStub.mockReturnValue(20); // success
      engine.on("success", () => {
        eventSpy();
        engine.stop();
      });
      await engine.run();
      expect(eventSpy).toHaveBeenCalledOnce();
      expect(ageStub).toHaveBeenCalledOnce();
      expect(segmentStub).not.toHaveBeenCalled();
    });
  });
});
