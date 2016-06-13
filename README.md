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

## Hello World
```js
import { Engine } from 'json-rules-engine'
import { Rule } from 'json-rules-engine'

/**
 * Setup a new engine
 */
let engine = new Engine()

/**
 * Create a rule
 */
let rule = new Rule()

// define the 'conditions' for when "hello world" should display
rule.setConditions({
  all: [{
    fact: 'displayMessage',
    operator: 'equal',
    value: true
  }]
})
// define the 'event' that will fire when the condition evaluates truthy
rule.setEvent({
  type: 'message',
  params: {
    data: 'hello-world!'
  }
})
// add rule to engine
engine.addRule(rule)

/**
 * Pass initial values into the engine.
 * Fact values do NOT need to be known at engine runtime; see the
 * examples for how to pull in data asynchronously throughout a run()
 */
let facts = { displayMessage: true }

// run the engine
engine
  .run(facts)
  .then(triggeredEvents => { // run() return events with truthy conditions
    triggeredEvents.map(event => console.log(event.params.data))
  })
  .catch(console.log)

/*
 * hello-world!
 */
```

[Try it out!](https://tonicdev.com/cachecontrol/json-rules-engine.hello-world)


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
