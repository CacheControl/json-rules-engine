/*
 * This is a basic example demonstrating how to leverage the metadata supplied by rule results
 *
 * Usage:
 *   node ./examples/09-rule-results.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/09-rule-results.js
 */
import "colors";
import { Engine, NestedCondition, RuleResult } from "json-rules-engine";

async function start() {
  /**
   * Setup a new engine
   */
  const engine = new Engine();

  // rule for determining honor role student athletes (student has GPA >= 3.5 AND is an athlete)
  engine.addRule({
    conditions: {
      all: [
        {
          fact: "athlete",
          operator: "equal",
          value: true,
        },
        {
          fact: "GPA",
          operator: "greaterThanInclusive",
          value: 3.5,
        },
      ],
    },
    event: {
      // define the event to fire when the conditions evaluate truthy
      type: "honor-roll",
      params: {
        message: "Student made the athletics honor-roll",
      },
    },
    name: "Athlete GPA Rule",
  });

  function render(message: string, ruleResult: RuleResult) {
    // if rule succeeded, render success message
    if (ruleResult.result) {
      return console.log(`${message}`.green);
    }
    // if rule failed, iterate over each failed condition to determine why the student didn't qualify for athletics honor roll
    const detail = (ruleResult.conditions as { all: NestedCondition[] }).all
      .filter((condition) => !(condition as { result?: boolean }).result)
      .map((condition) => {
        switch ((condition as { operator?: string }).operator) {
          case "equal":
            return `was not an ${(condition as { fact?: string }).fact}`;
          case "greaterThanInclusive":
            return `${(condition as { fact: string }).fact} of ${(condition as { factResult?: unknown }).factResult} was too low`;
          default:
            return "";
        }
      })
      .join(" and ");
    console.log(`${message} ${detail}`.red);
  }

  /**
   * On success, retrieve the student's username and print rule name for display purposes, and render
   */
  engine.on("success", (event, almanac, ruleResult) => {
    almanac.factValue<string>("username").then((username) => {
      render(
        `${username.bold} succeeded ${ruleResult.name}! ${event.params!.message}`,
        ruleResult,
      );
    });
  });

  /**
   * On failure, retrieve the student's username and print rule name for display purposes, and render
   */
  engine.on("failure", (_event, almanac, ruleResult) => {
    almanac.factValue<string>("username").then((username) => {
      render(`${username.bold} failed ${ruleResult.name} - `, ruleResult);
    });
  });

  // Run the engine for 5 different students
  await Promise.all([
    engine.run({ athlete: false, GPA: 3.9, username: "joe" }),
    engine.run({ athlete: true, GPA: 3.5, username: "larry" }),
    engine.run({ athlete: false, GPA: 3.1, username: "jane" }),
    engine.run({ athlete: true, GPA: 4.0, username: "janet" }),
    engine.run({ athlete: true, GPA: 1.1, username: "sarah" }),
  ]);
}
export default start();
/*
 * OUTPUT:
 *
 * joe failed Athlete GPA Rule -  was not an athlete
 * larry succeeded Athlete GPA Rule! Student made the athletics honor-roll
 * jane failed Athlete GPA Rule -  was not an athlete and GPA of 3.1 was too low
 * janet succeeded Athlete GPA Rule! Student made the athletics honor-roll
 * sarah failed Athlete GPA Rule -  GPA of 1.1 was too low
 */
