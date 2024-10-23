import { OperatorDecorator, Operator } from "../src/index.mjs";
import { describe, it, expect } from "vitest";

const startsWithLetter = new Operator(
  "startsWithLetter",
  (factValue, jsonValue) => {
    return factValue[0] === jsonValue;
  },
);

describe("OperatorDecorator", () => {
  describe("constructor()", () => {
    function subject(...args) {
      return new OperatorDecorator(...args);
    }

    it("adds the decorator", () => {
      const decorator = subject("test", () => false);
      expect(decorator.name).toBe("test");
      expect(decorator.cb).toBeInstanceOf(Function);
    });

    it("decorator name", () => {
      expect(() => {
        subject();
      }).toThrow(/Missing decorator name/);
    });

    it("decorator definition", () => {
      expect(() => {
        subject("test");
      }).toThrow(/Missing decorator callback/);
    });
  });

  describe("decorating", () => {
    const subject = new OperatorDecorator("test", () => false).decorate(
      startsWithLetter,
    );
    it("creates a new operator with the prefixed name", () => {
      expect(subject.name).toBe("test:startsWithLetter");
    });
  });
});
