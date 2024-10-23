"use strict";

import sinon from "sinon";
import engineFactory from "../src/index";

describe('Engine: "not" conditions', () => {
  let engine;
  let sandbox;
  before(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('supports a single "not" condition', () => {
    const event = {
      type: "ageTrigger",
      params: {
        demographic: "under50",
      },
    };
    const conditions = {
      not: {
        fact: "age",
        operator: "greaterThanInclusive",
        value: 50,
      },
    };
    let eventSpy;
    let ageSpy;
    beforeEach(() => {
      eventSpy = sandbox.spy();
      ageSpy = sandbox.stub();
      const rule = factories.rule({ conditions, event });
      engine = engineFactory();
      engine.addRule(rule);
      engine.addFact("age", ageSpy);
      engine.on("success", eventSpy);
    });

    it("emits when the condition is met", async () => {
      ageSpy.returns(10);
      await engine.run();
      expect(eventSpy).to.have.been.calledWith(event);
    });

    it("does not emit when the condition fails", () => {
      ageSpy.returns(75);
      engine.run();
      expect(eventSpy).to.not.have.been.calledWith(event);
    });
  });
});
