"use strict";
/*
 * This is an advanced example demonstrating rules that re-use a condition defined
 * in the engine.
 *
 * Usage:
 *   node ./examples/10-condition-sharing.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/10-condition-sharing.js
 */

require("colors");
const { Engine } = require("json-rules-engine");

async function start() {
  /**
   * Setup a new engine
   */
  const engine = new Engine();

  /**
   * Condition that will be used to determine if a user likes screwdrivers
   */
  engine.setCondition("screwdriverAficionado", {
    all: [
      {
        fact: "drinksOrangeJuice",
        operator: "equal",
        value: true,
      },
      {
        fact: "enjoysVodka",
        operator: "equal",
        value: true,
      },
    ],
  });

  /**
   * Rule for identifying people who should be invited to a screwdriver social
   * - Only invite people who enjoy screw drivers
   * - Only invite people who are sociable
   */
  const inviteRule = {
    conditions: {
      all: [
        {
          condition: "screwdriverAficionado",
        },
        {
          fact: "isSociable",
          operator: "equal",
          value: true,
        },
      ],
    },
    event: { type: "invite-to-screwdriver-social" },
  };
  engine.addRule(inviteRule);

  /**
   * Rule for identifying people who should be invited to the other social
   * - Only invite people who don't enjoy screw drivers
   * - Only invite people who are sociable
   */
  const otherInviteRule = {
    conditions: {
      all: [
        {
          not: {
            condition: "screwdriverAficionado",
          },
        },
        {
          fact: "isSociable",
          operator: "equal",
          value: true,
        },
      ],
    },
    event: { type: "invite-to-other-social" },
  };
  engine.addRule(otherInviteRule);

  /**
   * Register listeners with the engine for rule success and failure
   */
  engine
    .on("success", async (event, almanac) => {
      const accountId = await almanac.factValue("accountId");
      console.log(
        `${accountId}` +
          "DID".green +
          ` meet conditions for the ${event.type.underline} rule.`,
      );
    })
    .on("failure", async (event, almanac) => {
      const accountId = await almanac.factValue("accountId");
      console.log(
        `${accountId} did ` +
          "NOT".red +
          ` meet conditions for the ${event.type.underline} rule.`,
      );
    });

  // define fact(s) known at runtime
  let facts = {
    accountId: "washington",
    drinksOrangeJuice: true,
    enjoysVodka: true,
    isSociable: true,
  };

  // first run, using washington's facts
  await engine.run(facts);

  facts = {
    accountId: "jefferson",
    drinksOrangeJuice: true,
    enjoysVodka: false,
    isSociable: true,
    accountInfo: {},
  };

  // second run, using jefferson's facts; facts & evaluation are independent of the first run
  await engine.run(facts);
}

start();

/*
 * OUTPUT:
 *
 * washington DID meet conditions for the invite-to-screwdriver-social rule.
 * washington did NOT meet conditions for the invite-to-other-social rule.
 * jefferson did NOT meet conditions for the invite-to-screwdriver-social rule.
 * jefferson DID meet conditions for the invite-to-other-social rule.
 */
