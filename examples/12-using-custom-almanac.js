"use strict";

require("colors");
const { Almanac, Engine } = require("json-rules-engine");

/**
 * Almanac that support piping values through named functions
 */
class PipedAlmanac extends Almanac {
  constructor(options) {
    super(options);
    this.pipes = new Map();
  }

  addPipe(name, pipe) {
    this.pipes.set(name, pipe);
  }

  factValue(factId, params, path) {
    let pipes = [];
    if (params && "pipes" in params && Array.isArray(params.pipes)) {
      pipes = params.pipes;
      delete params.pipes;
    }
    return super.factValue(factId, params, path).then((value) => {
      return pipes.reduce((value, pipeName) => {
        const pipe = this.pipes.get(pipeName);
        if (pipe) {
          return pipe(value);
        }
        return value;
      }, value);
    });
  }
}

async function start() {
  const engine = new Engine().addRule({
    conditions: {
      all: [
        {
          fact: "age",
          params: {
            // the addOne pipe adds one to the value
            pipes: ["addOne"],
          },
          operator: "greaterThanInclusive",
          value: 21,
        },
      ],
    },
    event: {
      type: "Over 21(ish)",
    },
  });

  engine.on("success", async (event, almanac) => {
    const name = await almanac.factValue("name");
    const age = await almanac.factValue("age");
    console.log(`${name} is ${age} years old and ${"is".green} ${event.type}`);
  });

  engine.on("failure", async (event, almanac) => {
    const name = await almanac.factValue("name");
    const age = await almanac.factValue("age");
    console.log(
      `${name} is ${age} years old and ${"is not".red} ${event.type}`,
    );
  });

  const createAlmanacWithPipes = () => {
    const almanac = new PipedAlmanac();
    almanac.addPipe("addOne", (v) => v + 1);
    return almanac;
  };

  // first run Bob who is less than 20
  await engine.run(
    { name: "Bob", age: 19 },
    { almanac: createAlmanacWithPipes() },
  );

  // second run Alice who is 21
  await engine.run(
    { name: "Alice", age: 21 },
    { almanac: createAlmanacWithPipes() },
  );

  // third run Chad who is 20
  await engine.run(
    { name: "Chad", age: 20 },
    { almanac: createAlmanacWithPipes() },
  );
}

start();

/*
 * OUTPUT:
 *
 * Bob is 19 years old and is not Over 21(ish)
 * Alice is 21 years old and is Over 21(ish)
 * Chad is 20 years old and is Over 21(ish)
 */
