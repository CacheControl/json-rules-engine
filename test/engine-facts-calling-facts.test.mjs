import engineFactory, { Fact } from "../src/index.mjs";

import { describe, it, beforeEach, expect, vi } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("Engine: custom cache keys", () => {
  let engine;

  const event = { type: "early-twenties" };
  const conditions = {
    all: [
      {
        fact: "demographics",
        params: {
          field: "age",
        },
        operator: "lessThanInclusive",
        value: 25,
      },
      {
        fact: "demographics",
        params: {
          field: "zipCode",
        },
        operator: "equal",
        value: 80211,
      },
    ],
  };

  let eventSpy;
  let demographicDataSpy;
  let demographicSpy;
  beforeEach(() => {
    demographicSpy = vi.fn();
    demographicDataSpy = vi.fn();
    eventSpy = vi.fn();

    const demographicsDataDefinition = async () => {
      demographicDataSpy();
      return {
        age: 20,
        zipCode: 80211,
      };
    };

    const demographicsDefinition = async (params, engine) => {
      demographicSpy();
      const data = await engine.factValue("demographic-data");
      return data[params.field];
    };
    const demographicsFact = new Fact("demographics", demographicsDefinition);
    const demographicsDataFact = new Fact(
      "demographic-data",
      demographicsDataDefinition,
    );

    engine = engineFactory();
    const rule = ruleFactory({ conditions, event });
    engine.addRule(rule);
    engine.addFact(demographicsFact);
    engine.addFact(demographicsDataFact);
    engine.on("success", eventSpy);
  });

  describe("1 rule", () => {
    it("allows a fact to retrieve other fact values", async () => {
      await engine.run();
      expect(eventSpy).toHaveBeenCalledOnce();
      expect(demographicDataSpy).toHaveBeenCalledOnce();
      expect(demographicSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("2 rules with parallel conditions", () => {
    it("calls the fact definition once", async () => {
      const conditions = {
        all: [
          {
            fact: "demographics",
            params: {
              field: "age",
            },
            operator: "greaterThanInclusive",
            value: 20,
          },
        ],
      };
      const rule = ruleFactory({ conditions, event });
      engine.addRule(rule);

      await engine.run();
      expect(eventSpy).toHaveBeenCalledTimes(2);
      expect(demographicDataSpy).toHaveBeenCalledOnce();
      expect(demographicSpy).toHaveBeenCalledTimes(2);
      expect(demographicDataSpy).toHaveBeenCalledOnce();
    });
  });
});
