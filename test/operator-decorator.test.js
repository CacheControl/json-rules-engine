"use strict";

import { OperatorDecorator, Operator } from "../src/index";

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
      expect(decorator.name).to.equal("test");
      expect(decorator.cb).to.an.instanceof(Function);
    });

    it("decorator name", () => {
      expect(() => {
        subject();
      }).to.throw(/Missing decorator name/);
    });

    it("decorator definition", () => {
      expect(() => {
        subject("test");
      }).to.throw(/Missing decorator callback/);
    });
  });

  describe("decorating", () => {
    const subject = new OperatorDecorator("test", () => false).decorate(
      startsWithLetter,
    );
    it("creates a new operator with the prefixed name", () => {
      expect(subject.name).to.equal("test:startsWithLetter");
    });
  });
});
