![json-rules-engine](http://i.imgur.com/MAzq7l2.png)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![Build Status](https://travis-ci.org/CacheControl/json-rules-engine.svg?branch=master)](https://travis-ci.org/CacheControl/json-rules-engine)
[![npm version](https://badge.fury.io/js/json-rules-engine.svg)](https://badge.fury.io/js/json-rules-engine)

A rules engine expressed in JSON

## Synopsis

```json-rules-engine``` is a powerful, lightweight rules engine.  Rules are composed of simple json structures, making them human readable and easy to persist.

## Features

* Rules expressed in simple, easy to read JSON
* Full support for ```ALL``` and ```ANY``` boolean operators, including recursive nesting
* Fast by default, faster with configuration; priority levels and cache settings for fine tuning performance
* Secure; no use of eval()
* Lightweight & extendable; less than 500 lines of javascript w/few dependencies

## Installation

```bash
$ npm install json-rules-engine
```

## Documentation

It's best to start with the [overview](./docs/overview.md) to understand the terminology.  Next, see the [walkthrough](./docs/overview.md) and try out some [examples](./examples).

To dive right in, start with the [basic example](./examples/basic.js).

## Example

In basketball, a player who commits five personal fouls over the course of a 40-minute game, or six in a 48-minute game, fouls out.

This example demonstrates an engine for detecting whether an individual player has fouled out.

```js
import { Engine } from 'json-rules-engine'

/**
 * Setup a new engine
 */
let engine = new Engine()

// define a rule for detecting the player has exceeded foul limits.  Foul out any player who:
// (has committed 5 fouls AND game is 40 minutes) OR (has committed 6 fouls AND game is 48 minutes)
engine.addRule({
  conditions: {
    any: [{
      all: [{
        fact: 'gameDuration',
        operator: 'equal',
        value: 40
      }, {
        fact: 'personalFoulCount',
        operator: 'greaterThanInclusive',
        value: 5
      }]
    }, {
      all: [{
        fact: 'gameDuration',
        operator: 'equal',
        value: 48
      }, {
        fact: 'personalFoulCount',
        operator: 'greaterThanInclusive',
        value: 6
      }]
    }]
  },
  event: {  // define the event to fire when the conditions evaluate truthy
    type: 'fouledOut',
    params: {
      message: 'Player has fouled out!'
    }
  }
})

/**
 * define the facts
 * note: facts may be loaded asynchronously at runtime; see the advanced example below
 */
let facts = {
  personalFoulCount: 6,
  gameDuration: 40
}

// run the engine
engine
  .run(facts)
  .then(events => { // run() return events with truthy conditions
    events.map(event => console.log(event.params.message))
  })

/*
 * Player has fouled out!
 */
```

Run this example [here](./examples/nested-boolean-logic.js)


## Persisting Rules

Rules may be easily converted to JSON and persisted to a database, file system, or elsewhere.  To convert a rule to JSON, simply call the ```rule.toJSON()``` method.  Later, a rule may be restored by feeding the json into the Rule constructor.

```js
// save somewhere...
let jsonString = rule.toJSON()

// ...later:
let rule = new Rule(jsonString)
```

_Why aren't "fact" methods persistable?_  This is by design, for several reasons.  Firstly, facts are by definition business logic bespoke to your application, and therefore lie outside the scope of this library.  Secondly, many times this request indicates a design smell; try thinking of other ways to compose the rules and facts to accomplish the same objective. Finally, persisting fact methods would involve serializing javascript code, and restoring it later via ``eval()``.  If you have a strong desire for this feature, the [node-rules](https://github.com/mithunsatheesh/node-rules) project supports this (though be aware the capability is enabled via ``eval()``.

## Debugging

To see what the engine is doing under the hood, debug output can be turned on via:

```bash
DEBUG=json-rules-engine
```
