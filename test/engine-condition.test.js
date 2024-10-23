"use strict";

import sinon from "sinon";
import engineFactory from "../src/index";

describe("Engine: condition", () => {
  let engine;
  let sandbox;
  before(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe("setCondition()", () => {
    describe("validations", () => {
      beforeEach(() => {
        engine = engineFactory();
      });
      it("throws an exception for invalid root conditions", () => {
        expect(
          engine.setCondition.bind(engine, "test", { foo: true }),
        ).to.throw(
          /"conditions" root must contain a single instance of "all", "any", "not", or "condition"/,
        );
      });
    });
  });

  describe("undefined condition", () => {
    const sendEvent = {
      type: "checkSending",
      params: {
        sendRetirementPayment: true,
      },
    };

    const sendConditions = {
      all: [
        { condition: "over60" },
        {
          fact: "isRetired",
          operator: "equal",
          value: true,
        },
      ],
    };

    describe("allowUndefinedConditions: true", () => {
      let eventSpy;
      beforeEach(() => {
        eventSpy = sandbox.spy();
        const sendRule = factories.rule({
          conditions: sendConditions,
          event: sendEvent,
        });
        engine = engineFactory([sendRule], { allowUndefinedConditions: true });

        engine.addFact("isRetired", true);
        engine.on("failure", eventSpy);
      });

      it("evaluates undefined conditions as false", async () => {
        await engine.run();
        expect(eventSpy).to.have.been.called();
      });
    });

    describe("allowUndefinedConditions: false", () => {
      beforeEach(() => {
        const sendRule = factories.rule({
          conditions: sendConditions,
          event: sendEvent,
        });
        engine = engineFactory([sendRule], { allowUndefinedConditions: false });

        engine.addFact("isRetired", true);
      });

      it("throws error during run", async () => {
        try {
          await engine.run();
        } catch (error) {
          expect(error.message).to.equal("No condition over60 exists");
        }
      });
    });
  });

  describe("supports condition shared across multiple rules", () => {
    const name = "over60";
    const condition = {
      all: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 60,
        },
      ],
    };

    const sendEvent = {
      type: "checkSending",
      params: {
        sendRetirementPayment: true,
      },
    };

    const sendConditions = {
      all: [
        { condition: name },
        {
          fact: "isRetired",
          operator: "equal",
          value: true,
        },
      ],
    };

    const outreachEvent = {
      type: "triggerOutreach",
    };

    const outreachConditions = {
      all: [
        { condition: name },
        {
          fact: "requestedOutreach",
          operator: "equal",
          value: true,
        },
      ],
    };

    let eventSpy;
    let ageSpy;
    let isRetiredSpy;
    let requestedOutreachSpy;
    beforeEach(() => {
      eventSpy = sandbox.spy();
      ageSpy = sandbox.stub();
      isRetiredSpy = sandbox.stub();
      requestedOutreachSpy = sandbox.stub();
      engine = engineFactory();

      const sendRule = factories.rule({
        conditions: sendConditions,
        event: sendEvent,
      });
      engine.addRule(sendRule);

      const outreachRule = factories.rule({
        conditions: outreachConditions,
        event: outreachEvent,
      });
      engine.addRule(outreachRule);

      engine.setCondition(name, condition);

      engine.addFact("age", ageSpy);
      engine.addFact("isRetired", isRetiredSpy);
      engine.addFact("requestedOutreach", requestedOutreachSpy);
      engine.on("success", eventSpy);
    });

    it("emits all events when all conditions are met", async () => {
      ageSpy.returns(65);
      isRetiredSpy.returns(true);
      requestedOutreachSpy.returns(true);
      await engine.run();
      expect(eventSpy)
        .to.have.been.calledWith(sendEvent)
        .and.to.have.been.calledWith(outreachEvent);
    });

    it("expands condition in rule results", async () => {
      ageSpy.returns(65);
      isRetiredSpy.returns(true);
      requestedOutreachSpy.returns(true);
      const { results } = await engine.run();
      const nestedCondition = {
        "conditions.all[0].all[0].fact": "age",
        "conditions.all[0].all[0].operator": "greaterThanInclusive",
        "conditions.all[0].all[0].value": 60,
      };
      expect(results[0]).to.nested.include(nestedCondition);
      expect(results[1]).to.nested.include(nestedCondition);
    });
  });

  describe("nested condition", () => {
    const name1 = "over60";
    const condition1 = {
      all: [
        {
          fact: "age",
          operator: "greaterThanInclusive",
          value: 60,
        },
      ],
    };

    const name2 = "earlyRetirement";
    const condition2 = {
      all: [
        { not: { condition: name1 } },
        {
          fact: "isRetired",
          operator: "equal",
          value: true,
        },
      ],
    };

    const outreachEvent = {
      type: "triggerOutreach",
    };

    const outreachConditions = {
      all: [
        { condition: name2 },
        {
          fact: "requestedOutreach",
          operator: "equal",
          value: true,
        },
      ],
    };

    let eventSpy;
    let ageSpy;
    let isRetiredSpy;
    let requestedOutreachSpy;
    beforeEach(() => {
      eventSpy = sandbox.spy();
      ageSpy = sandbox.stub();
      isRetiredSpy = sandbox.stub();
      requestedOutreachSpy = sandbox.stub();
      engine = engineFactory();

      const outreachRule = factories.rule({
        conditions: outreachConditions,
        event: outreachEvent,
      });
      engine.addRule(outreachRule);

      engine.setCondition(name1, condition1);

      engine.setCondition(name2, condition2);

      engine.addFact("age", ageSpy);
      engine.addFact("isRetired", isRetiredSpy);
      engine.addFact("requestedOutreach", requestedOutreachSpy);
      engine.on("success", eventSpy);
    });

    it("emits all events when all conditions are met", async () => {
      ageSpy.returns(55);
      isRetiredSpy.returns(true);
      requestedOutreachSpy.returns(true);
      await engine.run();
      expect(eventSpy).to.have.been.calledWith(outreachEvent);
    });

    it("expands condition in rule results", async () => {
      ageSpy.returns(55);
      isRetiredSpy.returns(true);
      requestedOutreachSpy.returns(true);
      const { results } = await engine.run();
      const nestedCondition = {
        "conditions.all[0].all[0].not.all[0].fact": "age",
        "conditions.all[0].all[0].not.all[0].operator": "greaterThanInclusive",
        "conditions.all[0].all[0].not.all[0].value": 60,
        "conditions.all[0].all[1].fact": "isRetired",
        "conditions.all[0].all[1].operator": "equal",
        "conditions.all[0].all[1].value": true,
      };
      expect(results[0]).to.nested.include(nestedCondition);
    });
  });

  describe("top-level condition reference", () => {
    const sendEvent = {
      type: "checkSending",
      params: {
        sendRetirementPayment: true,
      },
    };

    const retiredName = "retired";
    const retiredCondition = {
      all: [{ fact: "isRetired", operator: "equal", value: true }],
    };

    const sendConditions = {
      condition: retiredName,
    };

    let eventSpy;
    beforeEach(() => {
      eventSpy = sandbox.spy();
      const sendRule = factories.rule({
        conditions: sendConditions,
        event: sendEvent,
      });
      engine = engineFactory();

      engine.addRule(sendRule);
      engine.setCondition(retiredName, retiredCondition);

      engine.addFact("isRetired", true);
      engine.on("success", eventSpy);
    });

    it("evaluates top level conditions correctly", async () => {
      await engine.run();
      expect(eventSpy).to.have.been.called();
    });
  });
});
