/*
 * This is a basic example demonstrating a condition that compares two facts
 *
 * Usage:
 *   node ./examples/08-fact-comparison.js
 *
 * For detailed output:
 *   DEBUG=json-rules-engine node ./examples/08-fact-comparison.js
 */

import "colors";
import { Engine } from "json-rules-engine";

async function start() {
  /**
   * Setup a new engine
   */
  const engine = new Engine();

  /**
   * Rule for determining if account has enough money to purchase a $50 gift card product
   *
   * customer-account-balance >= $50 gift card
   */
  const rule = {
    conditions: {
      all: [
        {
          // extract 'balance' from the 'customer' account type
          fact: "account",
          path: "$.balance",
          params: {
            accountType: "customer",
          },

          operator: "greaterThanInclusive", // >=

          // "value" in this instance is an object containing a fact definition
          // fact helpers "path" and "params" are supported here as well
          value: {
            fact: "product",
            path: "$.price",
            params: {
              productId: "giftCard",
            },
          },
        },
      ],
    },
    event: { type: "customer-can-afford-gift-card" },
  };
  engine.addRule(rule);

  engine.addFact("account", async (params, almanac) => {
    // get account list
    const accounts = await almanac.factValue<{ type: string }[]>("accounts");
    // use "params" to filter down to the type specified, in this case the "customer" account
    const customerAccount = accounts.filter(
      (account) => account.type === params.accountType,
    );
    // return the customerAccount object, which "path" will use to pull the "balance" property
    return customerAccount[0];
  });

  engine.addFact("product", async (params, almanac) => {
    // get product list
    const products =
      await almanac.factValue<{ productId: string }[]>("products");
    // use "params" to filter down to the product specified, in this case the "giftCard" product
    const product = products.filter(
      (product) => product.productId === params.productId,
    );
    // return the product object, which "path" will use to pull the "price" property
    return product[0];
  });

  /**
   * Register listeners with the engine for rule success and failure
   */
  let facts: Record<string, unknown>;
  engine
    .on("success", (event) => {
      console.log(
        facts.userId +
          " DID ".green +
          "meet conditions for the " +
          event.type.underline +
          " rule.",
      );
    })
    .on("failure", (event) => {
      console.log(
        facts.userId +
          " did " +
          "NOT".red +
          " meet conditions for the " +
          event.type.underline +
          " rule.",
      );
    });

  // define fact(s) known at runtime
  const productList = {
    products: [
      {
        productId: "giftCard",
        price: 50,
      },
      {
        productId: "widget",
        price: 45,
      },
      {
        productId: "widget-plus",
        price: 800,
      },
    ],
  };

  let userFacts = {
    userId: "washington",
    accounts: [
      {
        type: "customer",
        balance: 500,
      },
      {
        type: "partner",
        balance: 0,
      },
    ],
  };

  // compile facts to be fed to the engine
  facts = Object.assign({}, userFacts, productList);

  // first run, user can afford a gift card
  await engine.run(facts);

  // second run; a user that cannot afford a gift card
  userFacts = {
    userId: "jefferson",
    accounts: [
      {
        type: "customer",
        balance: 30,
      },
    ],
  };
  facts = Object.assign({}, userFacts, productList);
  await engine.run(facts);
}
export default start();
/*
 * OUTPUT:
 *
 * washington DID meet conditions for the customer-can-afford-gift-card rule.
 * jefferson did NOT meet conditions for the customer-can-afford-gift-card rule.
 */
