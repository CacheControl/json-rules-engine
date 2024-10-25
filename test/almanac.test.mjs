import { Fact } from "../src/index.mjs";
import Almanac from "../src/almanac.mjs";
import { describe, it, beforeEach, expect, vi } from "vitest";

describe("Almanac", () => {
  let almanac;
  let factSpy;

  beforeEach(() => {
    factSpy = vi.fn();
  });

  describe("properties", () => {
    it("has methods for managing facts", () => {
      almanac = new Almanac();
      expect(almanac).toHaveProperty("factValue");
    });

    it("adds runtime facts", () => {
      almanac = new Almanac();
      almanac.addFact("modelId", "XYZ");
      expect(almanac.factMap.get("modelId").value).toBe("XYZ");
    });
  });

  describe("addFact", () => {
    it("supports runtime facts as key => values", () => {
      almanac = new Almanac();
      almanac.addFact("fact1", 3);
      return expect(almanac.factValue("fact1")).resolves.toBe(3);
    });

    it("supporrts runtime facts as dynamic callbacks", async () => {
      almanac = new Almanac();
      almanac.addFact("fact1", () => {
        factSpy();
        return Promise.resolve(3);
      });
      await expect(almanac.factValue("fact1")).resolves.toBe(3);
      await expect(factSpy).toHaveBeenCalledOnce();
    });

    it("supports runtime fact instances", () => {
      const fact = new Fact("fact1", 3);
      almanac = new Almanac();
      almanac.addFact(fact);
      return expect(almanac.factValue("fact1")).resolves.toBe(fact.value);
    });
  });

  describe("addEvent() / getEvents()", () => {
    const event = {};
    ["success", "failure"].forEach((outcome) => {
      it(`manages ${outcome} events`, () => {
        almanac = new Almanac();
        expect(almanac.getEvents(outcome)).toHaveLength(0);
        almanac.addEvent(event, outcome);
        expect(almanac.getEvents(outcome)).toHaveLength(1);
        expect(almanac.getEvents(outcome)[0]).toEqual(event);
      });

      it("getEvent() filters when outcome provided, or returns all events", () => {
        almanac = new Almanac();
        almanac.addEvent(event, "success");
        almanac.addEvent(event, "failure");
        expect(almanac.getEvents("success")).toHaveLength(1);
        expect(almanac.getEvents("failure")).toHaveLength(1);
        expect(almanac.getEvents()).toHaveLength(2);
      });
    });
  });

  describe("arguments", () => {
    beforeEach(() => {
      const fact = new Fact("foo", async (params) => {
        if (params.userId) return params.userId;
        return "unknown";
      });
      almanac = new Almanac();
      almanac.addFact(fact);
    });

    it("allows parameters to be passed to the fact", async () => {
      return expect(almanac.factValue("foo")).resolves.toBe("unknown");
    });

    it("allows parameters to be passed to the fact", async () => {
      return expect(almanac.factValue("foo", { userId: 1 })).resolves.toBe(1);
    });

    it("throws an exception if it encounters an undefined fact", () => {
      return expect(almanac.factValue("bar")).rejects.toThrow(
        /Undefined fact: bar/,
      );
    });
  });

  describe("addRuntimeFact", () => {
    it("adds a key/value pair to the factMap as a fact instance", () => {
      almanac = new Almanac();
      almanac.addRuntimeFact("factId", "factValue");
      expect(almanac.factMap.get("factId").value).toBe("factValue");
    });
  });

  describe("_addConstantFact", () => {
    it("adds fact instances to the factMap", () => {
      const fact = new Fact("factId", "factValue");
      almanac = new Almanac();
      almanac._addConstantFact(fact);
      expect(almanac.factMap.get(fact.id).value).toBe(fact.value);
    });
  });

  describe("_getFact", () => {
    it("retrieves the fact object", () => {
      const fact = new Fact("id", 1);
      almanac = new Almanac();
      almanac.addFact(fact);
      expect(almanac._getFact("id")).toEqual(fact);
    });
  });

  describe("_setFactValue()", () => {
    function expectFactResultsCache(expected) {
      const promise = almanac.factResultsCache.values().next().value;
      expect(promise).toBeInstanceOf(Promise);
      promise.then((value) => expect(value).toEqual(expected));
      return promise;
    }

    function setup(f = new Fact("id", 1)) {
      fact = f;
      almanac = new Almanac();
      almanac.addFact(fact);
    }
    let fact;
    const FACT_VALUE = 2;

    it("updates the fact results and returns a promise", async () => {
      setup();
      almanac._setFactValue(fact, {}, FACT_VALUE);
      await expectFactResultsCache(FACT_VALUE);
    });

    it("honors facts with caching disabled", async () => {
      setup(new Fact("id", 1, { cache: false }));
      const promise = almanac._setFactValue(fact, {}, FACT_VALUE);
      expect(almanac.factResultsCache.values().next().value).toBeUndefined();
      await expect(promise).resolves.toBe(FACT_VALUE);
    });
  });

  describe("factValue()", () => {
    it('allows "path" to be specified to traverse the fact data with json-path', async () => {
      const fact = new Fact("foo", {
        users: [
          {
            name: "George",
          },
          {
            name: "Thomas",
          },
        ],
      });
      almanac = new Almanac();
      almanac.addFact(fact);
      const result = await almanac.factValue("foo", null, "$..name");
      expect(result).toEqual(["George", "Thomas"]);
    });

    describe("caching", () => {
      function setup(factOptions) {
        const fact = new Fact(
          "foo",
          async () => {
            factSpy();
            return "unknown";
          },
          factOptions,
        );
        almanac = new Almanac();
        almanac.addFact(fact);
      }

      it("evaluates the fact every time when fact caching is off", () => {
        setup({ cache: false });
        almanac.factValue("foo");
        almanac.factValue("foo");
        almanac.factValue("foo");
        expect(factSpy).toHaveBeenCalledTimes(3);
      });

      it("evaluates the fact once when fact caching is on", () => {
        setup({ cache: true });
        almanac.factValue("foo");
        almanac.factValue("foo");
        almanac.factValue("foo");
        expect(factSpy).toHaveBeenCalledOnce();
      });
    });
  });
});
