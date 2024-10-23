"use strict";
/*
 * This is an advanced example demonstrating an event that emits the value
 * of a fact in it's parameters.
 *
 * Usage:
 *   node ./examples/11-using-facts-in-events.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/11-using-facts-in-events.js
 */

require("colors");
const { Engine, Fact } = require("json-rules-engine");

async function start() {
  /**
   * Setup a new engine
   */
  const engine = new Engine([], { replaceFactsInEventParams: true });

  // in-memory "database"
  let currentHighScore = null;
  const currentHighScoreFact = new Fact(
    "currentHighScore",
    () => currentHighScore,
  );

  /**
   * Rule for when you've gotten the high score
   * event will include your score and initials.
   */
  const highScoreRule = {
    conditions: {
      any: [
        {
          fact: "currentHighScore",
          operator: "equal",
          value: null,
        },
        {
          fact: "score",
          operator: "greaterThan",
          value: {
            fact: "currentHighScore",
            path: "$.score",
          },
        },
      ],
    },
    event: {
      type: "highscore",
      params: {
        initials: { fact: "initials" },
        score: { fact: "score" },
      },
    },
  };

  /**
   * Rule for when the game is over and you don't have the high score
   * event will include the previous high score
   */
  const gameOverRule = {
    conditions: {
      all: [
        {
          fact: "score",
          operator: "lessThanInclusive",
          value: {
            fact: "currentHighScore",
            path: "$.score",
          },
        },
      ],
    },
    event: {
      type: "gameover",
      params: {
        initials: {
          fact: "currentHighScore",
          path: "$.initials",
        },
        score: {
          fact: "currentHighScore",
          path: "$.score",
        },
      },
    },
  };
  engine.addRule(highScoreRule);
  engine.addRule(gameOverRule);
  engine.addFact(currentHighScoreFact);

  /**
   * Register listeners with the engine for rule success
   */
  engine
    .on("success", async ({ params: { initials, score } }) => {
      console.log(`HIGH SCORE\n${initials} - ${score}`);
    })
    .on("success", ({ type, params }) => {
      if (type === "highscore") {
        currentHighScore = params;
      }
    });

  let facts = {
    initials: "DOG",
    score: 968,
  };

  // first run, without a high score
  await engine.run(facts);

  console.log("\n");

  // new player
  facts = {
    initials: "AAA",
    score: 500,
  };

  // new player hasn't gotten the high score yet
  await engine.run(facts);

  console.log("\n");

  facts = {
    initials: "AAA",
    score: 1000,
  };

  // second run, with a high score
  await engine.run(facts);
}

start();

/*
 * OUTPUT:
 *
 * NEW SCORE:
 * DOG - 968
 *
 * HIGH SCORE:
 * DOG - 968
 *
 * HIGH SCORE:
 * AAA - 1000
 */
