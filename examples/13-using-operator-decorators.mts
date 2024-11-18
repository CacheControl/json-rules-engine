/*
 * This example demonstrates using operator decorators.
 *
 * In this example, a fact contains a list of strings and we want to check if any of these are valid.
 *
 * Usage:
 *   node ./examples/12-using-operator-decorators.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/12-using-operator-decorators.js
 */

import "colors";
import { Engine } from "json-rules-engine";

async function start() {
  /**
   * Setup a new engine
   */
  const engine = new Engine();

  /**
   * Add a rule for validating a tag (fact)
   * against a set of tags that are valid (also a fact)
   */
  const validTags = {
    conditions: {
      all: [
        {
          fact: "tags",
          operator: "everyFact:in",
          value: { fact: "validTags" },
        },
      ],
    },
    event: {
      type: "valid tags",
    },
  };

  engine.addRule(validTags);

  engine.addFact("validTags", ["dev", "staging", "load", "prod"]);

  let facts: { tags: string[] };

  engine
    .on("success", (event) => {
      console.log(facts.tags.join(", ") + " WERE".green + " all " + event.type);
    })
    .on("failure", (event) => {
      console.log(
        facts.tags.join(", ") + " WERE NOT".red + " all " + event.type,
      );
    });

  // first run with valid tags
  facts = { tags: ["dev", "prod"] };
  await engine.run(facts);

  // second run with an invalid tag
  facts = { tags: ["dev", "deleted"] };
  await engine.run(facts);

  // add a new decorator to allow for a case-insensitive match
  engine.addOperatorDecorator(
    "caseInsensitive",
    (factValue: string, jsonValue: string, next) => {
      return next(factValue.toLowerCase(), jsonValue.toLowerCase());
    },
  );

  // new rule for case-insensitive validation
  const caseInsensitiveValidTags = {
    conditions: {
      all: [
        {
          fact: "tags",
          // everyFact has someValue that caseInsensitive is equal
          operator: "everyFact:someValue:caseInsensitive:equal",
          value: { fact: "validTags" },
        },
      ],
    },
    event: {
      type: "valid tags (case insensitive)",
    },
  };

  engine.addRule(caseInsensitiveValidTags);

  // third run with a tag that is valid if case insensitive
  facts = { tags: ["dev", "PROD"] };
  await engine.run(facts);
}
export default start();

/*
 * OUTPUT:
 *
 * dev, prod WERE all valid tags
 * dev, deleted WERE NOT all valid tags
 * dev, PROD WERE NOT all valid tags
 * dev, PROD WERE all valid tags (case insensitive)
 */
