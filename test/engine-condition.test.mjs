import engineFactory from "../src/index.mjs";
import { describe, it, beforeEach, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: condition", () => {
  let engine;

  describe("setCondition()", () => {
    describe("validations", () => {
      beforeEach(() => {
        engine = engineFactory();
      });
      it("throws an exception for invalid root conditions", () => {
        expect(engine.setCondition.bind(engine, "test", { foo: true })).toThrow(
          /"conditions" root must contain a single instance of "all", "any", "not", or "condition"/,
        );
      });
    });
  });

  describe("undefined condition", () => {
    const sendEvent = {
      type: "checkSending",
      params: {
        sendRetirementPayment: true,
      },
    };

    const sendConditions = {
      all: [
        { condition: "over60" },
        {
          fact: "isRetired",
          operator: "equal",
          value: true,
        },
      ],
    };

    describe("allowUndefinedConditions: true", () => {
      let eventSpy;
      beforeEach(() => {
        eventSpy = vi.fn();
        const sendRule = ruleFactory({
          conditions: sendConditions,
          event: sendEvent,
        });
        engine = engineFactory([sendRule], { allowUndefinedConditions: true });

        engine.addFact("isRetired", true);
        engine.on("failure", eventSpy);
      });

      it("evaluates undefined conditions as false", async () => {
        await engine.run();
        expect(eventSpy).toHaveBeenCalled();
      });
    });

    describe("allowUndefinedConditions: false", () => {
      beforeEach(() => {
        const sendRule = ruleFactory({
          conditions: sendConditions,
          event: sendEvent,
        });
        engine = engineFactory([sendRule], { allowUndefinedConditions: false });

        engine.addFact("isRetired", true);
      });

      it("throws error during run", async () => {
        try {
          await engine.run();
        } catch (error) {
          expect(error.message).toBe("No condition over60 exists");
        }
      });
    });
  });

  describe("supports condition shared across multiple rules", () => {
    const name = "over60";
    const condition = {
      all: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 60,
        },
      ],
    };

    const sendEvent = {
      type: "checkSending",
      params: {
        sendRetirementPayment: true,
      },
    };

    const sendConditions = {
      all: [
        { condition: name },
        {
          fact: "isRetired",
          operator: "equal",
          value: true,
        },
      ],
    };

    const outreachEvent = {
      type: "triggerOutreach",
    };

    const outreachConditions = {
      all: [
        { condition: name },
        {
          fact: "requestedOutreach",
          operator: "equal",
          value: true,
        },
      ],
    };

    let eventSpy;
    let ageSpy;
    let isRetiredSpy;
    let requestedOutreachSpy;
    beforeEach(() => {
      eventSpy = vi.fn();
      ageSpy = vi.fn();
      isRetiredSpy = vi.fn();
      requestedOutreachSpy = vi.fn();
      engine = engineFactory();

      const sendRule = ruleFactory({
        conditions: sendConditions,
        event: sendEvent,
      });
      engine.addRule(sendRule);

      const outreachRule = ruleFactory({
        conditions: outreachConditions,
        event: outreachEvent,
      });
      engine.addRule(outreachRule);

      engine.setCondition(name, condition);

      engine.addFact("age", ageSpy);
      engine.addFact("isRetired", isRetiredSpy);
      engine.addFact("requestedOutreach", requestedOutreachSpy);
      engine.on("success", eventSpy);
    });

    it("emits all events when all conditions are met", async () => {
      ageSpy.mockReturnValue(65);
      isRetiredSpy.mockReturnValue(true);
      requestedOutreachSpy.mockReturnValue(true);
      await engine.run();
      expect(eventSpy)
        .toHaveBeenCalledWith(sendEvent, expect.anything(), expect.anything())
        .and.toHaveBeenCalledWith(
          outreachEvent,
          expect.anything(),
          expect.anything(),
        );
    });

    it("expands condition in rule results", async () => {
      ageSpy.mockReturnValue(65);
      isRetiredSpy.mockReturnValue(true);
      requestedOutreachSpy.mockReturnValue(true);
      const { results } = await engine.run();
      expect(results[0]).toMatchObject({
        conditions: {
          all: {
            0: {
              all: [
                {
                  fact: "age",
                  operator: "greaterThanInclusive",
                  value: 60,
                },
              ],
            },
          },
        },
      });
      expect(results[1]).toMatchObject({
        conditions: {
          all: {
            0: {
              all: [
                {
                  fact: "age",
                  operator: "greaterThanInclusive",
                  value: 60,
                },
              ],
            },
          },
        },
      });
    });
  });

  describe("nested condition", () => {
    const name1 = "over60";
    const condition1 = {
      all: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 60,
        },
      ],
    };

    const name2 = "earlyRetirement";
    const condition2 = {
      all: [
        { not: { condition: name1 } },
        {
          fact: "isRetired",
          operator: "equal",
          value: true,
        },
      ],
    };

    const outreachEvent = {
      type: "triggerOutreach",
    };

    const outreachConditions = {
      all: [
        { condition: name2 },
        {
          fact: "requestedOutreach",
          operator: "equal",
          value: true,
        },
      ],
    };

    let eventSpy;
    let ageSpy;
    let isRetiredSpy;
    let requestedOutreachSpy;
    beforeEach(() => {
      eventSpy = vi.fn();
      ageSpy = vi.fn();
      isRetiredSpy = vi.fn();
      requestedOutreachSpy = vi.fn();
      engine = engineFactory();

      const outreachRule = ruleFactory({
        conditions: outreachConditions,
        event: outreachEvent,
      });
      engine.addRule(outreachRule);

      engine.setCondition(name1, condition1);

      engine.setCondition(name2, condition2);

      engine.addFact("age", ageSpy);
      engine.addFact("isRetired", isRetiredSpy);
      engine.addFact("requestedOutreach", requestedOutreachSpy);
      engine.on("success", eventSpy);
    });

    it("emits all events when all conditions are met", async () => {
      ageSpy.mockReturnValue(55);
      isRetiredSpy.mockReturnValue(true);
      requestedOutreachSpy.mockReturnValue(true);
      await engine.run();
      expect(eventSpy).toHaveBeenCalledWith(
        outreachEvent,
        expect.anything(),
        expect.anything(),
      );
    });

    it("expands condition in rule results", async () => {
      ageSpy.mockReturnValue(55);
      isRetiredSpy.mockReturnValue(true);
      requestedOutreachSpy.mockReturnValue(true);
      const { results } = await engine.run();
      expect(results[0]).toMatchObject({
        conditions: {
          all: {
            0: {
              all: [
                {
                  not: {
                    all: [
                      {
                        fact: "age",
                        operator: "greaterThanInclusive",
                        value: 60,
                      },
                    ],
                  },
                },
                {
                  fact: "isRetired",
                  operator: "equal",
                  value: true,
                },
              ],
            },
          },
        },
      });
    });
  });

  describe("top-level condition reference", () => {
    const sendEvent = {
      type: "checkSending",
      params: {
        sendRetirementPayment: true,
      },
    };

    const retiredName = "retired";
    const retiredCondition = {
      all: [{ fact: "isRetired", operator: "equal", value: true }],
    };

    const sendConditions = {
      condition: retiredName,
    };

    let eventSpy;
    beforeEach(() => {
      eventSpy = vi.fn();
      const sendRule = ruleFactory({
        conditions: sendConditions,
        event: sendEvent,
      });
      engine = engineFactory();

      engine.addRule(sendRule);
      engine.setCondition(retiredName, retiredCondition);

      engine.addFact("isRetired", true);
      engine.on("success", eventSpy);
    });

    it("evaluates top level conditions correctly", async () => {
      await engine.run();
      expect(eventSpy).toHaveBeenCalled();
    });
  });
});
