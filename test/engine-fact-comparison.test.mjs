import engineFactory from "../src/index.mjs";

import { describe, it, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: fact to fact comparison", () => {
  let engine;

  let eventSpy;

  function setup(conditions) {
    const event = { type: "success-event" };
    eventSpy = vi.fn();
    engine = engineFactory();
    const rule = ruleFactory({ conditions, event });
    engine.addRule(rule);
    engine.on("success", eventSpy);
  }

  describe("constant facts", () => {
    const constantCondition = {
      all: [
        {
          fact: "height",
          operator: "lessThanInclusive",
          value: {
            fact: "width",
          },
        },
      ],
    };
    it("allows a fact to retrieve other fact values", async () => {
      setup(constantCondition);
      await engine.run({ height: 1, width: 2 });
      expect(eventSpy).toHaveBeenCalledOnce();

      eventSpy.mockReset();

      await engine.run({ height: 2, width: 1 }); // negative case
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe("rules with parameterized conditions", () => {
    const paramsCondition = {
      all: [
        {
          fact: "widthMultiplier",
          params: {
            multiplier: 2,
          },
          operator: "equal",
          value: {
            fact: "heightMultiplier",
            params: {
              multiplier: 4,
            },
          },
        },
      ],
    };
    it("honors the params", async () => {
      setup(paramsCondition);
      engine.addFact("heightMultiplier", async (params, almanac) => {
        const height = await almanac.factValue("height");
        return params.multiplier * height;
      });
      engine.addFact("widthMultiplier", async (params, almanac) => {
        const width = await almanac.factValue("width");
        return params.multiplier * width;
      });
      await engine.run({ height: 5, width: 10 });
      expect(eventSpy).toHaveBeenCalledOnce();

      eventSpy.mockReset();

      await engine.run({ height: 5, width: 9 }); // negative case
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe("rules with parameterized conditions and path values", () => {
    const pathCondition = {
      all: [
        {
          fact: "widthMultiplier",
          params: {
            multiplier: 2,
          },
          path: "$.feet",
          operator: "equal",
          value: {
            fact: "heightMultiplier",
            params: {
              multiplier: 4,
            },
            path: "$.meters",
          },
        },
      ],
    };
    it("honors the path", async () => {
      setup(pathCondition);
      engine.addFact("heightMultiplier", async (params, almanac) => {
        const height = await almanac.factValue("height");
        return { meters: params.multiplier * height };
      });
      engine.addFact("widthMultiplier", async (params, almanac) => {
        const width = await almanac.factValue("width");
        return { feet: params.multiplier * width };
      });
      await engine.run({ height: 5, width: 10 });
      expect(eventSpy).toHaveBeenCalledOnce();

      eventSpy.mockReset();

      await engine.run({ height: 5, width: 9 }); // negative case
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('constant facts: checking valueResult and factResult', () => {
    const constantCondition = {
      all: [{
        fact: 'height',
        operator: 'lessThanInclusive',
        value: {
          fact: 'width'
        }
      }]
    }
    it('result has the correct valueResult and factResult properties', async () => {
      setup(constantCondition)
      const result = await engine.run({ height: 1, width: 2 })

      expect(result.results[0].conditions.all[0].factResult).toEqual(1)
      expect(result.results[0].conditions.all[0].valueResult).toEqual(2)
    })
  })
});
