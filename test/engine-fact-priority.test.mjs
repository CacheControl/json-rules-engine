import engineFactory from "../src/index.mjs";

import { describe, it, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: fact priority", () => {
  let engine;

  const event = { type: "adult-human-admins" };

  let eventSpy;
  let failureSpy;
  let ageStub;
  let segmentStub;
  let accountTypeStub;

  function setup(conditions) {
    ageStub = vi.fn();
    segmentStub = vi.fn();
    accountTypeStub = vi.fn();
    eventSpy = vi.fn();
    failureSpy = vi.fn();

    engine = engineFactory();
    const rule = ruleFactory({ conditions, event });
    engine.addRule(rule);
    engine.addFact("age", ageStub, { priority: 100 });
    engine.addFact("segment", segmentStub, { priority: 50 });
    engine.addFact("accountType", accountTypeStub, { priority: 25 });
    engine.on("success", eventSpy);
    engine.on("failure", failureSpy);
  }

  describe("all conditions", () => {
    const allCondition = {
      all: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 18,
        },
        {
          fact: "segment",
          operator: "equal",
          value: "human",
        },
        {
          fact: "accountType",
          operator: "equal",
          value: "admin",
        },
      ],
    };

    it("stops on the first fact to fail, part 1", async () => {
      setup(allCondition);
      ageStub.mockReturnValue(10); // fail
      await engine.run();
      expect(failureSpy).toHaveBeenCalled();
      expect(eventSpy).not.toHaveBeenCalled();
      expect(ageStub).toHaveBeenCalledOnce();
      expect(segmentStub).not.toHaveBeenCalled();
      expect(accountTypeStub).not.toHaveBeenCalled();
    });

    it("stops on the first fact to fail, part 2", async () => {
      setup(allCondition);
      ageStub.mockReturnValue(20); // pass
      segmentStub.mockReturnValue("android"); // fail
      await engine.run();
      expect(failureSpy).toHaveBeenCalled();
      expect(eventSpy).not.toHaveBeenCalled();
      expect(ageStub).toHaveBeenCalledOnce();
      expect(segmentStub).toHaveBeenCalledOnce();
      expect(accountTypeStub).not.toHaveBeenCalled();
    });

    describe("sub-conditions", () => {
      const allSubCondition = {
        all: [
          {
            fact: "age",
            operator: "greaterThanInclusive",
            value: 18,
          },
          {
            all: [
              {
                fact: "segment",
                operator: "equal",
                value: "human",
              },
              {
                fact: "accountType",
                operator: "equal",
                value: "admin",
              },
            ],
          },
        ],
      };

      it("stops after the first sub-condition fact fails", async () => {
        setup(allSubCondition);
        ageStub.mockReturnValue(20); // pass
        segmentStub.mockReturnValue("android"); // fail
        await engine.run();
        expect(failureSpy).toHaveBeenCalled();
        expect(eventSpy).not.toHaveBeenCalled();
        expect(ageStub).toHaveBeenCalledOnce();
        expect(segmentStub).toHaveBeenCalledOnce();
        expect(accountTypeStub).not.toHaveBeenCalled();
      });
    });
  });

  describe("any conditions", () => {
    const anyCondition = {
      any: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 18,
        },
        {
          fact: "segment",
          operator: "equal",
          value: "human",
        },
        {
          fact: "accountType",
          operator: "equal",
          value: "admin",
        },
      ],
    };
    it("complete on the first fact to succeed, part 1", async () => {
      setup(anyCondition);
      ageStub.mockReturnValue(20); // succeed
      await engine.run();
      expect(eventSpy).toHaveBeenCalledOnce();
      expect(failureSpy).not.toHaveBeenCalled();
      expect(ageStub).toHaveBeenCalledOnce();
      expect(segmentStub).not.toHaveBeenCalled();
      expect(accountTypeStub).not.toHaveBeenCalled();
    });

    it("short circuits on the first fact to fail, part 2", async () => {
      setup(anyCondition);
      ageStub.mockReturnValue(10); // fail
      segmentStub.mockReturnValue("human"); // pass
      await engine.run();
      expect(eventSpy).toHaveBeenCalledOnce();
      expect(failureSpy).not.toHaveBeenCalled();
      expect(ageStub).toHaveBeenCalledOnce();
      expect(segmentStub).toHaveBeenCalledOnce();
      expect(accountTypeStub).not.toHaveBeenCalled();
    });

    describe("sub-conditions", () => {
      const anySubCondition = {
        all: [
          {
            fact: "age",
            operator: "greaterThanInclusive",
            value: 18,
          },
          {
            any: [
              {
                fact: "segment",
                operator: "equal",
                value: "human",
              },
              {
                fact: "accountType",
                operator: "equal",
                value: "admin",
              },
            ],
          },
        ],
      };

      it("stops after the first sub-condition fact succeeds", async () => {
        setup(anySubCondition);
        ageStub.mockReturnValue(20); // success
        segmentStub.mockReturnValue("human"); // success
        await engine.run();
        expect(failureSpy).not.toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalled();
        expect(ageStub).toHaveBeenCalledOnce();
        expect(segmentStub).toHaveBeenCalledOnce();
        expect(accountTypeStub).not.toHaveBeenCalled();
      });
    });
  });
});
