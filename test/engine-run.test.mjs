import engineFactory from "../src/index.mjs";
import Almanac from "../src/almanac.mjs";

import { describe, it, beforeEach, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: run", () => {
  let engine, rule, rule2;

  const condition21 = {
    any: [
      {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 21,
      },
    ],
  };
  const condition75 = {
    any: [
      {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 75,
      },
    ],
  };
  let eventSpy;

  beforeEach(() => {
    eventSpy = vi.fn();
    engine = engineFactory();
    rule = ruleFactory({
      conditions: condition21,
      event: { type: "generic1" },
    });
    engine.addRule(rule);
    rule2 = ruleFactory({
      conditions: condition75,
      event: { type: "generic2" },
    });
    engine.addRule(rule2);
    engine.on("success", eventSpy);
  });

  describe("independent runs", () => {
    it("treats each run() independently", async () => {
      await Promise.all(
        [50, 10, 12, 30, 14, 15, 25].map((age) => engine.run({ age })),
      );
      expect(eventSpy).toHaveBeenCalledTimes(3);
    });

    it("allows runtime facts to override engine facts for a single run()", async () => {
      engine.addFact("age", 30);

      await engine.run({ age: 85 }); // override 'age' with runtime fact
      expect(eventSpy).toHaveBeenCalledTimes(2);

      eventSpy.mockReset();
      await engine.run(); // no runtime fact; revert to age: 30
      expect(eventSpy).toHaveBeenCalledOnce();

      eventSpy.mockReset();
      await engine.run({ age: 2 }); // override 'age' with runtime fact
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe("returns", () => {
    it("activated events", async () => {
      const { events, failureEvents } = await engine.run({ age: 30 });
      expect(events.length).toBe(1);
      expect(events).toContainEqual(rule.event);
      expect(failureEvents.length).toBe(1);
      expect(failureEvents).toContainEqual(rule2.event);
    });

    it("multiple activated events", () => {
      return engine.run({ age: 90 }).then((results) => {
        expect(results.events.length).toBe(2);
        expect(results.events).toContainEqual(rule.event);
        expect(results.events).toContainEqual(rule2.event);
      });
    });

    it("does not include unactived triggers", () => {
      return engine.run({ age: 10 }).then((results) => {
        expect(results.events.length).toBe(0);
      });
    });

    it("includes the almanac", () => {
      return engine
        .run({ age: 10 })
        .then((results) => {
          expect(results.almanac).toBeInstanceOf(Almanac);
          return results.almanac.factValue("age");
        })
        .then((ageFact) => expect(ageFact).toBe(10));
    });
  });

  describe("facts updated during run", () => {
    beforeEach(() => {
      engine.on("success", (event, almanac, ruleResult) => {
        // Assign unique runtime facts per event
        almanac.addRuntimeFact(
          `runtime-fact-${event.type}`,
          ruleResult.conditions.any[0].value,
        );
      });
    });

    it("returns an almanac with runtime facts added", () => {
      return engine
        .run({ age: 90 })
        .then((results) => {
          return Promise.all([
            results.almanac.factValue("runtime-fact-generic1"),
            results.almanac.factValue("runtime-fact-generic2"),
          ]);
        })
        .then((promiseValues) => {
          expect(promiseValues[0]).toBe(21);
          expect(promiseValues[1]).toBe(75);
        });
    });
  });

  describe("custom alamanc", () => {
    class CapitalAlmanac extends Almanac {
      factValue(factId, params, path) {
        return super.factValue(factId, params, path).then((value) => {
          if (typeof value === "string") {
            return value.toUpperCase();
          }
          return value;
        });
      }
    }

    it("returns the capitalized value when using the CapitalAlamanc", () => {
      return engine
        .run({ greeting: "hello", age: 30 }, { almanac: new CapitalAlmanac() })
        .then((results) => {
          const fact = results.almanac.factValue("greeting");
          return expect(fact).resolves.toBe("HELLO");
        });
    });
  });
});
