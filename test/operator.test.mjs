import { Operator } from "../src/index.mjs";
import { describe, it, expect } from "vitest";

describe("Operator", () => {
  describe("constructor()", () => {
    function subject(...args) {
      return new Operator(...args);
    }

    it("adds the operator", () => {
      const operator = subject("startsWithLetter", (factValue, jsonValue) => {
        return factValue[0] === jsonValue;
      });
      expect(operator.name).toBe("startsWithLetter");
      expect(operator.cb).toBeInstanceOf(Function);
    });

    it("operator name", () => {
      expect(() => {
        subject();
      }).toThrow(/Missing operator name/);
    });

    it("operator definition", () => {
      expect(() => {
        subject("startsWithLetter");
      }).toThrow(/Missing operator callback/);
    });
  });
});
