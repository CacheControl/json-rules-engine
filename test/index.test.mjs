import subject from "../src/index.mjs";
import { describe, it, expect } from "vitest";
import ruleFactory from "./support/rule-factory.mjs";

describe("json-business-subject", () => {
  it("treats each rule engine independently", () => {
    const engine1 = subject();
    const engine2 = subject();
    engine1.addRule(ruleFactory());
    engine2.addRule(ruleFactory());
    expect(engine1.rules.length).toBe(1);
    expect(engine2.rules.length).toBe(1);
  });
});
