import Almanac from "../src/almanac.mjs";
import engineFactory, { Fact } from "../src/index.mjs";

import { beforeEach, describe, expect, it, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: event", () => {
  let engine;

  const event = {
    type: "setDrinkingFlag",
    params: {
      canOrderDrinks: true,
    },
  };
  /**
   * sets up a simple 'any' rule with 2 conditions
   */
  function simpleSetup() {
    const conditions = {
      any: [
        {
          name: "over 21",
          fact: "age",
          operator: "greaterThanInclusive",
          value: 21,
        },
        {
          fact: "qualified",
          operator: "equal",
          value: true,
        },
      ],
    };
    engine = engineFactory();
    const ruleOptions = { conditions, event, priority: 100 };
    const determineDrinkingAgeRule = ruleFactory(ruleOptions);
    engine.addRule(determineDrinkingAgeRule);
    // age will succeed because 21 >= 21
    engine.addFact("age", 21);
    // set 'qualified' to fail. rule will succeed because of 'any'
    engine.addFact("qualified", false);
  }

  /**
   * sets up a complex rule with nested conditions
   */
  function advancedSetup() {
    const conditions = {
      any: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 21,
        },
        {
          fact: "qualified",
          operator: "equal",
          value: true,
        },
        {
          all: [
            {
              fact: "zipCode",
              operator: "in",
              value: [80211, 80403],
            },
            {
              fact: "gender",
              operator: "notEqual",
              value: "female",
            },
          ],
        },
      ],
    };
    engine = engineFactory();
    const ruleOptions = { conditions, event, priority: 100 };
    const determineDrinkingAgeRule = ruleFactory(ruleOptions);
    engine.addRule(determineDrinkingAgeRule);
    // rule will succeed because of 'any'
    engine.addFact("age", 10); // age fails
    engine.addFact("qualified", false); // qualified fails.
    engine.addFact("zipCode", 80403); // zipCode succeeds
    engine.addFact("gender", "male"); // gender succeeds
  }

  describe("engine events: simple", () => {
    beforeEach(() => simpleSetup());

    it('"success" passes the event, almanac, and results', async () => {
      const failureSpy = vi.fn();
      const successSpy = vi.fn();
      function assertResult(ruleResult) {
        expect(ruleResult.result).toBe(true);
        expect(ruleResult.conditions.any[0].result).toBe(true);
        expect(ruleResult.conditions.any[0].factResult).toBe(21);
        expect(ruleResult.conditions.any[0].name).toBe("over 21");
        expect(ruleResult.conditions.any[1].result).toBe(false);
        expect(ruleResult.conditions.any[1].factResult).toBe(false);
      }
      engine.on("success", function (e, almanac, ruleResult) {
        expect(e).toEqual(event);
        expect(almanac).toBeInstanceOf(Almanac);
        assertResult(ruleResult);
        successSpy();
      });
      engine.on("failure", failureSpy);

      const { results, failureResults } = await engine.run();

      expect(failureResults).toHaveLength(0);
      expect(results).toHaveLength(1);
      assertResult(results[0]);
      expect(failureSpy).not.toHaveBeenCalled();
      expect(successSpy).toHaveBeenCalledOnce();
    });

    it('"event.type" passes the event parameters, almanac, and results', async () => {
      const failureSpy = vi.fn();
      const successSpy = vi.fn();
      function assertResult(ruleResult) {
        expect(ruleResult.result).toBe(true);
        expect(ruleResult.conditions.any[0].result).toBe(true);
        expect(ruleResult.conditions.any[0].factResult).toBe(21);
        expect(ruleResult.conditions.any[1].result).toBe(false);
        expect(ruleResult.conditions.any[1].factResult).toBe(false);
      }
      engine.on(event.type, function (params, almanac, ruleResult) {
        expect(params).toEqual(event.params);
        expect(almanac).toBeInstanceOf(Almanac);
        assertResult(ruleResult);
        successSpy();
      });
      engine.on("failure", failureSpy);

      const { results, failureResults } = await engine.run();

      expect(failureResults).toHaveLength(0);
      expect(results).toHaveLength(1);
      assertResult(results[0]);

      expect(failureSpy).not.toHaveBeenCalled();
      expect(successSpy).toHaveBeenCalledOnce();
    });

    it('"failure" passes the event, almanac, and results', async () => {
      const AGE = 10;
      const failureSpy = vi.fn();
      const successSpy = vi.fn();
      function assertResult(ruleResult) {
        expect(ruleResult.result).toBe(false);
        expect(ruleResult.conditions.any[0].result).toBe(false);
        expect(ruleResult.conditions.any[0].factResult).toBe(AGE);
        expect(ruleResult.conditions.any[1].result).toBe(false);
        expect(ruleResult.conditions.any[1].factResult).toBe(false);
      }

      engine.on("failure", function (e, almanac, ruleResult) {
        expect(e).toEqual(event);
        expect(almanac).toBeInstanceOf(Almanac);
        assertResult(ruleResult);
        failureSpy();
      });
      engine.on("success", successSpy);
      engine.addFact("age", AGE); // age fails

      const { results, failureResults } = await engine.run();

      expect(failureResults).toHaveLength(1);
      expect(results).toHaveLength(0);
      assertResult(failureResults[0]);

      expect(failureSpy).toHaveBeenCalledOnce();
      expect(successSpy).not.toHaveBeenCalled();
    });

    it("allows facts to be added by the event handler, affecting subsequent rules", () => {
      const drinkOrderParams = { wine: "merlot", quantity: 2 };
      const drinkOrderEvent = {
        type: "offerDrink",
        params: drinkOrderParams,
      };
      const drinkOrderConditions = {
        any: [
          {
            fact: "canOrderDrinks",
            operator: "equal",
            value: true,
          },
        ],
      };
      const drinkOrderRule = ruleFactory({
        conditions: drinkOrderConditions,
        event: drinkOrderEvent,
        priority: 1,
      });
      engine.addRule(drinkOrderRule);
      return new Promise((resolve, reject) => {
        engine.on("success", function (event, almanac) {
          switch (event.type) {
            case "setDrinkingFlag":
              almanac.addRuntimeFact(
                "canOrderDrinks",
                event.params.canOrderDrinks,
              );
              break;
            case "offerDrink":
              expect(event.params).toEqual(drinkOrderParams);
              break;
            default:
              reject(new Error("default case not expected"));
          }
        });
        engine.run().then(resolve).catch(reject);
      });
    });
  });

  describe("engine events: advanced", () => {
    beforeEach(() => advancedSetup());

    it('"success" passes the event, almanac, and results', async () => {
      const failureSpy = vi.fn();
      const successSpy = vi.fn();

      function assertResult(ruleResult) {
        expect(ruleResult.result).toBe(true);
        expect(ruleResult.conditions.any[0].result).toBe(false);
        expect(ruleResult.conditions.any[0].factResult).toBe(10);
        expect(ruleResult.conditions.any[1].result).toBe(false);
        expect(ruleResult.conditions.any[1].factResult).toBe(false);
        expect(ruleResult.conditions.any[2].result).toBe(true);
        expect(ruleResult.conditions.any[2].all[0].result).toBe(true);
        expect(ruleResult.conditions.any[2].all[0].factResult).toBe(80403);
        expect(ruleResult.conditions.any[2].all[1].result).toBe(true);
        expect(ruleResult.conditions.any[2].all[1].factResult).toBe("male");
      }

      engine.on("success", function (e, almanac, ruleResult) {
        expect(e).toEqual(event);
        expect(almanac).toBeInstanceOf(Almanac);
        assertResult(ruleResult);
        successSpy();
      });
      engine.on("failure", failureSpy);

      const { results, failureResults } = await engine.run();

      assertResult(results[0]);
      expect(failureResults).toHaveLength(0);
      expect(results).toHaveLength(1);
      expect(failureSpy).not.toHaveBeenCalled();
      expect(successSpy).toHaveBeenCalledOnce();
    });

    it('"failure" passes the event, almanac, and results', async () => {
      const ZIP_CODE = 99992;
      const GENDER = "female";
      const failureSpy = vi.fn();
      const successSpy = vi.fn();
      function assertResult(ruleResult) {
        expect(ruleResult.result).toBe(false);
        expect(ruleResult.conditions.any[0].result).toBe(false);
        expect(ruleResult.conditions.any[0].factResult).toBe(10);
        expect(ruleResult.conditions.any[1].result).toBe(false);
        expect(ruleResult.conditions.any[1].factResult).toBe(false);
        expect(ruleResult.conditions.any[2].result).toBe(false);
        expect(ruleResult.conditions.any[2].all[0].result).toBe(false);
        expect(ruleResult.conditions.any[2].all[0].factResult).toBe(ZIP_CODE);
        expect(ruleResult.conditions.any[2].all[1].result).toBe(false);
        expect(ruleResult.conditions.any[2].all[1].factResult).toBe(GENDER);
      }
      engine.on("failure", function (e, almanac, ruleResult) {
        expect(e).toEqual(event);
        expect(almanac).toBeInstanceOf(Almanac);
        assertResult(ruleResult);
        failureSpy();
      });
      engine.on("success", successSpy);
      engine.addFact("zipCode", ZIP_CODE); // zipCode fails
      engine.addFact("gender", GENDER); // gender fails

      const { results, failureResults } = await engine.run();

      assertResult(failureResults[0]);
      expect(failureResults).toHaveLength(1);
      expect(results).toHaveLength(0);

      expect(failureSpy).toHaveBeenCalledOnce();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe("engine events: with facts", () => {
    const eventWithFact = {
      type: "countedEnough",
      params: {
        count: { fact: "count" },
      },
    };

    const expectedEvent = { type: "countedEnough", params: { count: 5 } };

    function setup(replaceFactsInEventParams, event = eventWithFact) {
      const conditions = {
        any: [
          {
            fact: "success",
            operator: "equal",
            value: true,
          },
        ],
      };

      const ruleOptions = { conditions, event, priority: 100 };
      const countedEnoughRule = ruleFactory(ruleOptions);
      engine = engineFactory([countedEnoughRule], {
        replaceFactsInEventParams,
      });
    }
    describe("without flag", () => {
      beforeEach(() => setup(false));
      it('"success" passes the event without resolved facts', async () => {
        const successSpy = vi.fn();
        engine.on("success", successSpy);
        const { results } = await engine.run({ success: true, count: 5 });
        expect(results[0].event).toEqual(eventWithFact);
        expect(successSpy).toHaveBeenCalledWith(
          eventWithFact,
          expect.anything(),
          expect.anything(),
        );
      });

      it("failure passes the event without resolved facts", async () => {
        const failureSpy = vi.fn();
        engine.on("failure", failureSpy);
        const { failureResults } = await engine.run({
          success: false,
          count: 5,
        });
        expect(failureResults[0].event).toEqual(eventWithFact);
        expect(failureSpy).toHaveBeenCalledWith(
          eventWithFact,
          expect.anything(),
          expect.anything(),
        );
      });
    });
    describe("with flag", () => {
      beforeEach(() => setup(true));
      it('"success" passes the event with resolved facts', async () => {
        const successSpy = vi.fn();
        engine.on("success", successSpy);
        const { results } = await engine.run({ success: true, count: 5 });
        expect(results[0].event).toEqual(expectedEvent);
        expect(successSpy).toHaveBeenCalledWith(
          expectedEvent,
          expect.anything(),
          expect.anything(),
        );
      });

      it("failure passes the event with resolved facts", async () => {
        const failureSpy = vi.fn();
        engine.on("failure", failureSpy);
        const { failureResults } = await engine.run({
          success: false,
          count: 5,
        });
        expect(failureResults[0].event).toEqual(expectedEvent);
        expect(failureSpy).toHaveBeenCalledWith(
          expectedEvent,
          expect.anything(),
          expect.anything(),
        );
      });
      describe("using fact params and path", () => {
        const eventWithFactWithParamsAndPath = {
          type: "countedEnough",
          params: {
            count: {
              fact: "count",
              params: { incrementBy: 5 },
              path: "$.next",
            },
          },
        };

        beforeEach(() => {
          setup(true, eventWithFactWithParamsAndPath);
          engine.addFact(
            new Fact("count", async ({ incrementBy }) => {
              return {
                previous: 0,
                next: incrementBy,
              };
            }),
          );
        });
        it('"success" passes the event with resolved facts', async () => {
          const successSpy = vi.fn();
          engine.on("success", successSpy);
          const { results } = await engine.run({ success: true });
          expect(results[0].event).toEqual(expectedEvent);
          expect(successSpy).toHaveBeenCalledWith(
            expectedEvent,
            expect.anything(),
            expect.anything(),
          );
        });

        it("failure passes the event with resolved facts", async () => {
          const failureSpy = vi.fn();
          engine.on("failure", failureSpy);
          const { failureResults } = await engine.run({ success: false });
          expect(failureResults[0].event).toEqual(expectedEvent);
          expect(failureSpy).toHaveBeenCalledWith(
            expectedEvent,
            expect.anything(),
            expect.anything(),
          );
        });
      });
    });
  });

  describe("rule events: simple", () => {
    beforeEach(() => simpleSetup());

    it("the rule result is a _copy_ of the rule`s conditions, and unaffected by mutation", async () => {
      const rule = engine.rules[0];
      let firstPass;
      rule.on("success", function (e, almanac, ruleResult) {
        firstPass = ruleResult;
        delete ruleResult.conditions.any; // subsequently modify the conditions in this rule result
      });
      await engine.run();

      // run the engine again, now that ruleResult.conditions was modified
      let secondPass;
      rule.on("success", function (e, almanac, ruleResult) {
        secondPass = ruleResult;
      });
      await engine.run();

      expect(firstPass).toEqual(secondPass); // second pass was unaffected by first pass
    });

    it("on-success, it passes the event type and params", async () => {
      const failureSpy = vi.fn();
      const successSpy = vi.fn();
      const rule = engine.rules[0];
      function assertResult(ruleResult) {
        expect(ruleResult.result).toBe(true);
        expect(ruleResult.conditions.any[0].result).toBe(true);
        expect(ruleResult.conditions.any[0].factResult).toBe(21);
        expect(ruleResult.conditions.any[1].result).toBe(false);
        expect(ruleResult.conditions.any[1].factResult).toBe(false);
      }

      rule.on("success", function (e, almanac, ruleResult) {
        expect(e).toEqual(event);
        expect(almanac).toBeInstanceOf(Almanac);
        expect(failureSpy).not.toHaveBeenCalled();
        assertResult(ruleResult);
        successSpy();
      });
      rule.on("failure", failureSpy);

      const { results, failureResults } = await engine.run();

      assertResult(results[0]);
      expect(failureResults).toHaveLength(0);
      expect(results).toHaveLength(1);

      expect(successSpy).toHaveBeenCalledOnce();
      expect(failureSpy).not.toHaveBeenCalled();
    });

    it("on-failure, it passes the event type and params", async () => {
      const AGE = 10;
      const successSpy = vi.fn();
      const failureSpy = vi.fn();
      const rule = engine.rules[0];
      function assertResult(ruleResult) {
        expect(ruleResult.result).toBe(false);
        expect(ruleResult.conditions.any[0].result).toBe(false);
        expect(ruleResult.conditions.any[0].factResult).toBe(AGE);
        expect(ruleResult.conditions.any[1].result).toBe(false);
        expect(ruleResult.conditions.any[1].factResult).toBe(false);
      }
      rule.on("failure", function (e, almanac, ruleResult) {
        expect(e).toEqual(event);
        expect(almanac).toBeInstanceOf(Almanac);
        expect(successSpy).not.toHaveBeenCalled();
        assertResult(ruleResult);
        failureSpy();
      });
      rule.on("success", successSpy);
      // both conditions will fail
      engine.addFact("age", AGE);
      const { results, failureResults } = await engine.run();

      assertResult(failureResults[0]);
      expect(failureResults).toHaveLength(1);
      expect(results).toHaveLength(0);
      expect(failureSpy).toHaveBeenCalledOnce();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe("rule events: with facts", () => {
    const expectedEvent = { type: "countedEnough", params: { count: 5 } };
    const eventWithFact = {
      type: "countedEnough",
      params: {
        count: { fact: "count" },
      },
    };

    function setup(replaceFactsInEventParams, event = eventWithFact) {
      const conditions = {
        any: [
          {
            fact: "success",
            operator: "equal",
            value: true,
          },
        ],
      };

      const ruleOptions = { conditions, event, priority: 100 };
      const countedEnoughRule = ruleFactory(ruleOptions);
      engine = engineFactory([countedEnoughRule], {
        replaceFactsInEventParams,
      });
    }
    describe("without flag", () => {
      beforeEach(() => setup(false));
      it('"success" passes the event without resolved facts', async () => {
        const successSpy = vi.fn();
        engine.rules[0].on("success", successSpy);
        await engine.run({ success: true, count: 5 });
        expect(successSpy).toHaveBeenCalledWith(
          eventWithFact,
          expect.anything(),
          expect.anything(),
        );
      });

      it("failure passes the event without resolved facts", async () => {
        const failureSpy = vi.fn();
        engine.rules[0].on("failure", failureSpy);
        await engine.run({ success: false, count: 5 });
        expect(failureSpy).toHaveBeenCalledWith(
          eventWithFact,
          expect.anything(),
          expect.anything(),
        );
      });
    });
    describe("with flag", () => {
      beforeEach(() => setup(true));
      it('"success" passes the event with resolved facts', async () => {
        const successSpy = vi.fn();
        engine.rules[0].on("success", successSpy);
        await engine.run({ success: true, count: 5 });
        expect(successSpy).toHaveBeenCalledWith(
          expectedEvent,
          expect.anything(),
          expect.anything(),
        );
      });

      it("failure passes the event with resolved facts", async () => {
        const failureSpy = vi.fn();
        engine.rules[0].on("failure", failureSpy);
        await engine.run({ success: false, count: 5 });
        expect(failureSpy).toHaveBeenCalledWith(
          expectedEvent,
          expect.anything(),
          expect.anything(),
        );
      });
      describe("using fact params and path", () => {
        const eventWithFactWithParamsAndPath = {
          type: "countedEnough",
          params: {
            count: {
              fact: "count",
              params: { incrementBy: 5 },
              path: "$.next",
            },
          },
        };

        beforeEach(() => {
          setup(true, eventWithFactWithParamsAndPath);
          engine.addFact(
            new Fact("count", async ({ incrementBy }) => {
              return {
                previous: 0,
                next: incrementBy,
              };
            }),
          );
        });
        it('"success" passes the event with resolved facts', async () => {
          const successSpy = vi.fn();
          engine.on("success", successSpy);
          const { results } = await engine.run({ success: true });
          expect(results[0].event).toEqual(expectedEvent);
          expect(successSpy).toHaveBeenCalledWith(
            expectedEvent,
            expect.anything(),
            expect.anything(),
          );
        });

        it("failure passes the event with resolved facts", async () => {
          const failureSpy = vi.fn();
          engine.on("failure", failureSpy);
          const { failureResults } = await engine.run({ success: false });
          expect(failureResults[0].event).toEqual(expectedEvent);
          expect(failureSpy).toHaveBeenCalledWith(
            expectedEvent,
            expect.anything(),
            expect.anything(),
          );
        });
      });
    });
  });

  describe("rule events: json serializing", () => {
    beforeEach(() => simpleSetup());
    it("serializes properties", async () => {
      const successSpy = vi.fn();
      const rule = engine.rules[0];
      rule.on("success", successSpy);
      await engine.run();
      const ruleResult = successSpy.mock.calls[0][2];
      const expected =
        '{"conditions":{"priority":1,"any":[{"name":"over 21","operator":"greaterThanInclusive","value":21,"fact":"age","factResult":21,"result":true},{"operator":"equal","value":true,"fact":"qualified","factResult":false,"result":false}]},"event":{"type":"setDrinkingFlag","params":{"canOrderDrinks":true}},"priority":100,"result":true}';
      expect(JSON.stringify(ruleResult)).toBe(expected);
    });
  });
});
