"use strict";

import { expect } from "chai";
import engineFactory, { Operator, OperatorDecorator } from "../src/index";

const startsWithLetter = new Operator(
  "startsWithLetter",
  (factValue, jsonValue) => {
    return factValue[0] === jsonValue;
  },
);

const never = new OperatorDecorator("never", () => false);

describe("Engine Operator Map", () => {
  let engine;
  beforeEach(() => {
    engine = engineFactory();
    engine.addOperator(startsWithLetter);
    engine.addOperatorDecorator(never);
  });

  describe("undecorated operator", () => {
    let op;
    beforeEach(() => {
      op = engine.operators.get("startsWithLetter");
    });

    it("has the operator", () => {
      expect(op).not.to.be.null();
    });

    it("the operator evaluates correctly", () => {
      expect(op.evaluate("test", "t")).to.be.true();
    });

    it("after being removed the operator is null", () => {
      engine.operators.removeOperator(startsWithLetter);
      op = engine.operators.get("startsWithLetter");
      expect(op).to.be.null();
    });
  });

  describe("decorated operator", () => {
    let op;
    beforeEach(() => {
      op = engine.operators.get("never:startsWithLetter");
    });

    it("has the operator", () => {
      expect(op).not.to.be.null();
    });

    it("the operator evaluates correctly", () => {
      expect(op.evaluate("test", "t")).to.be.false();
    });

    it("removing the base operator removes the decorated version", () => {
      engine.operators.removeOperator(startsWithLetter);
      op = engine.operators.get("never:startsWithLetter");
      expect(op).to.be.null();
    });

    it("removing the decorator removes the decorated operator", () => {
      engine.operators.removeOperatorDecorator(never);
      op = engine.operators.get("never:startsWithLetter");
      expect(op).to.be.null();
    });
  });

  describe("combinatorics with default operators", () => {
    it("combines every, some, not, and greaterThanInclusive operators", () => {
      const odds = [1, 3, 5, 7];
      const evens = [2, 4, 6, 8];

      // technically not:greaterThanInclusive is the same as lessThan
      const op = engine.operators.get(
        "everyFact:someValue:not:greaterThanInclusive",
      );
      expect(op.evaluate(odds, evens)).to.be.true();
    });
  });

  it("the swap decorator", () => {
    const factValue = 1;
    const jsonValue = [1, 2, 3];

    const op = engine.operators.get("swap:contains");
    expect(op.evaluate(factValue, jsonValue)).to.be.true();
  });
});
