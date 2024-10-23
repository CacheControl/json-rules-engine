import { Fact } from "../src/index.mjs";
import { describe, it, expect } from "vitest";

describe("Fact", () => {
  function subject(id, definition, options) {
    return new Fact(id, definition, options);
  }
  describe("Fact::constructor", () => {
    it("works for constant facts", () => {
      const fact = subject("factId", 10);
      expect(fact.id).toBe("factId");
      expect(fact.value).toBe(10);
    });

    it("works for dynamic facts", () => {
      const fact = subject("factId", () => 10);
      expect(fact.id).toBe("factId");
      expect(fact.calculate()).toBe(10);
    });

    it("allows options to be passed", () => {
      const opts = { test: true, cache: false };
      const fact = subject("factId", 10, opts);
      expect(fact.options).toEqual(opts);
    });

    describe("validations", () => {
      it("throws if no id provided", () => {
        expect(subject).toThrow(/factId required/);
      });
    });
  });

  describe("Fact::types", () => {
    it("initializes facts with method values as dynamic", () => {
      const fact = subject("factId", () => {});
      expect(fact.type).toBe(Fact.DYNAMIC);
      expect(fact.isDynamic()).toBe(true);
    });

    it("initializes facts with non-methods as constant", () => {
      const fact = subject("factId", 2);
      expect(fact.type).toBe(Fact.CONSTANT);
      expect(fact.isConstant()).toBe(true);
    });
  });
});
