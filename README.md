![json-rules-engine](http://i.imgur.com/MAzq7l2.png)
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![Build Status](https://github.com/cachecontrol/json-rules-engine/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/cachecontrol/json-rules-engine/workflows/Node.js%20CI/badge.svg?branch=master)

[![npm version](https://badge.fury.io/js/json-rules-engine.svg)](https://badge.fury.io/js/json-rules-engine)
[![install size](https://packagephobia.now.sh/badge?p=json-rules-engine)](https://packagephobia.now.sh/result?p=json-rules-engine)
[![npm downloads](https://img.shields.io/npm/dm/json-rules-engine.svg)](https://www.npmjs.com/package/json-rules-engine)

A rules engine expressed in JSON

* [Synopsis](#synopsis)
* [Features](#features)
* [Installation](#installation)
* [Docs](#docs)
* [Examples](#examples)
* [Basic Example](#basic-example)
* [Advanced Example](#advanced-example)
* [Debugging](#debugging)
    * [Node](#node)
    * [Browser](#browser)
* [Related Projects](#related-projects)
* [License](#license)

## Synopsis

```json-rules-engine``` is a powerful, lightweight rules engine.  Rules are composed of simple json structures, making them human readable and easy to persist.

## Features

* Rules expressed in simple, easy to read JSON
* Full support for ```ALL``` and ```ANY``` boolean operators, including recursive nesting
* Fast by default, faster with configuration; priority levels and cache settings for fine tuning performance
* Secure; no use of eval()
* Isomorphic; runs in node and browser
* Lightweight & extendable; 17kb gzipped w/few dependencies

## Installation

```bash
$ npm install json-rules-engine
```

## Docs

- [engine](./docs/engine.md)
- [rules](./docs/rules.md)
- [almanac](./docs/almanac.md)
- [facts](./docs/facts.md)

## Examples

See the [Examples](./examples), which demonstrate the major features and capabilities.

## Basic Example

This example demonstrates an engine for detecting whether a basketball player has fouled out (a player who commits five personal fouls over the course of a 40-minute game, or six in a 48-minute game, fouls out).

```js
const { Engine } = require('json-rules-engine')


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
 * Define facts the engine will use to evaluate the conditions above.
 * Facts may also be loaded asynchronously at runtime; see the advanced example below
 */
let facts = {
  personalFoulCount: 6,
  gameDuration: 40
}

// Run the engine to evaluate
engine
  .run(facts)
  .then(({ events }) => {
    events.map(event => console.log(event.params.message))
  })

/*
 * Output:
 *
 * Player has fouled out!
 */
```

This is available in the [examples](./examples/02-nested-boolean-logic.js)

## Advanced Example

This example demonstates an engine for identifying employees who work for Microsoft and are taking Christmas day off.

This  demonstrates an engine which uses asynchronous fact data.
Fact information is loaded via API call during runtime, and the results are cached and recycled for all 3 conditions.
It also demonstates use of the condition _path_ feature to reference properties of objects returned by facts.

```js
const { Engine } = require('json-rules-engine')

// example client for making asynchronous requests to an api, database, etc
import apiClient from './account-api-client'

/**
 * Setup a new engine
 */
let engine = new Engine()

/**
 * Rule for identifying microsoft employees taking pto on christmas
 *
 * the account-information fact returns:
 *  { company: 'XYZ', status: 'ABC', ptoDaysTaken: ['YYYY-MM-DD', 'YYYY-MM-DD'] }
 */
let microsoftRule = {
  conditions: {
    all: [{
      fact: 'account-information',
      operator: 'equal',
      value: 'microsoft',
      path: '$.company' // access the 'company' property of "account-information"
    }, {
      fact: 'account-information',
      operator: 'in',
      value: ['active', 'paid-leave'], // 'status' can be active or paid-leave
      path: '$.status' // access the 'status' property of "account-information"
    }, {
      fact: 'account-information',
      operator: 'contains', // the 'ptoDaysTaken' property (an array) must contain '2016-12-25'
      value: '2016-12-25',
      path: '$.ptoDaysTaken' // access the 'ptoDaysTaken' property of "account-information"
    }]
  },
  event: {
    type: 'microsoft-christmas-pto',
    params: {
      message: 'current microsoft employee taking christmas day off'
    }
  }
}
engine.addRule(microsoftRule)

/**
 * 'account-information' fact executes an api call and retrieves account data, feeding the results
 * into the engine.  The major advantage of this technique is that although there are THREE conditions
 * requiring this data, only ONE api call is made.  This results in much more efficient runtime performance
 * and fewer network requests.
 */
engine.addFact('account-information', function (params, almanac) {
  console.log('loading account information...')
  return almanac.factValue('accountId')
    .then((accountId) => {
      return apiClient.getAccountInformation(accountId)
    })
})

// define fact(s) known at runtime
let facts = { accountId: 'lincoln' }
engine
  .run(facts)
  .then(({ events }) => {
    console.log(facts.accountId + ' is a ' + events.map(event => event.params.message))
  })

/*
 * OUTPUT:
 *
 * loading account information... // <-- API call is made ONCE and results recycled for all 3 conditions
 * lincoln is a current microsoft employee taking christmas day off
 */
```

This is available in the [examples](./examples/03-dynamic-facts.js)

## Debugging

To see what the engine is doing under the hood, debug output can be turned on via:

### Node

```bash
DEBUG=json-rules-engine
```

### Browser
```js
// set debug flag in local storage & refresh page to see console output
localStorage.debug = 'json-rules-engine'
```

## Related Projects

https://github.com/vinzdeveloper/json-rule-editor - configuration ui for json-rules-engine:

<img width="1680" alt="rule editor 2" src="https://user-images.githubusercontent.com/61467683/82750274-dd3b3b80-9da6-11ea-96eb-434a6a1a9bc1.png">


## License
[ISC](./LICENSE)
