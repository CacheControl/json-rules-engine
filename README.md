# Json Rules Engine
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![Build Status](https://travis-ci.org/CacheControl/json-rules-engine.svg?branch=master)](https://travis-ci.org/CacheControl/json-rules-engine)

A rules engine, expressed in pure json

## Synopsis

```json-rules-engine``` is a powerful, lightweight rules engine.  Rules and triggers are composed of simple json structures, making them human readable and easy to persist.  Performance controls and built-in caching mechanisms make the engine performant.

## Features

* Rules and Actions are expressed in JSON
* Facts provide mechanisms for pulling data asynchronously and evaluating the results
* Priority levels can be set at the rule, fact, and condition levels, to ensure
* ```ALL``` and ```ANY``` boolean operators, including recursive nesting support
* operators:  ```equal```, ```notEqual```, ```in```, ```notIn```, ```lessThan```, ```lessThanInclusive```, ```greaterThan```, ```greaterThanInclusive```
* Lightweight & extendable; less than 500 lines of javascript & few dependencies

## Conceptual Overview

The engine is composed of 4 basic building blocks: *engine*, *rules*, *conditions* and *actions*.

### Step 1: Creating an Engine
The engine executes rules, emits actions, and maintains state.  Most applications will have a single instance of an engine.

```js
  let Engine = require('json-rules-engine')
  let engine = new Engine()
```

### Step 2: Add a Rule

Rules are composed of two components: conditions and actions.  _Conditions_ are a set of requirements that must be met to trigger the rule's _action_.  Actions are emitted as events and may subscribed to by the application (see step X).

```js
let action = {
  type: 'young-adult-colorado',
  params: {  // optional
    giftCard: 'amazon',
    value: 50
  }
}
let conditions = {
  all: [
    {
      fact: 'age',
      operator: 'lessThanInclusive',
      value: 18
    }, {
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 25
    }, {
      fact: 'state',
      params: {
        zipCode: 80211
      },
      operator: 'equal',
      value: 'colorado'
    }
  ]
}
let rule = new Rule({ conditions, action})
engine.addRule(rule)
```

The example above demonstrates a rule that detects _male_ users between the ages of _18 and 25_.

More on rules can be found [here](./docs/rules.md)

### Step 3: Define Facts

Facts are constants or pure functions that may return different results during run-time.  Using the current example, if the engine were to be run, it would throw an error: "Undefined fact: 'age'".  So let's define some facts!

```js

/*
 * Define the 'state' fact
 */
let stateFact = function(params, engine) {
  return new Promise((resolve, reject) => {
    // facts can perform asynchronous operations such as database calls, http requests, etc to gather data
    request(`/state-lookup/${params.zipCode}`, function(err, resp, body) {
      if (err) return reject(err)
      resolve(body.state)
    })
  })
}
engine.addFact('state', stateFact)

/*
 * Define the 'age' fact
 */
let ageFact = function(params, engine) {
  return new Promise((resolve, reject) => {
    // facts can also access other facts via 'engine.factValue(factId, params = {})'
    engine.factValue('userId').then((userId) => {
      return db.getUser(userId)
    }).then((user) => {
      return user.age
    })
  })
}
engine.addFact('age', ageFact)
```

Now when the engine is run, it will call the methods above whenever it encounters the ```fact: "age"``` or ```fact: "state"```properties.

**Important:** facts should be *pure functions*, meaning their values will always evaluate based on the ```params``` argument.  By establishing facts are pure functions, it allows the rules engine to cache results; if the same fact is called multiple times with the same ```params```, it will trigger the computation once, and cache the results for future calls.  If fact caching not desired, this behavior can be turned off via the options; see the [docs](./docs/facts.md).

More on facts can be found [here](./docs/facts.md)


### Step 4: Handing Actions

When rule conditions are met, the application needs to respond to the action that is emitted.

```js
// subscribe directly to the 'young-adult' action from Step 1
engine.on('young-adult', (params) => {
  // params: {
  //   giftCard: 'amazon',
  //   value: 50
  // }
})

// - or -

// subscribe to any action emitted by the engine
engine.on('action', function (action, engine) {
  // action: {
  //   type: "young-adult",
  //   params: {  // optional
  //     giftCard: 'amazon',
  //     value: 50
  //   }
  // }
})
```

## Basic Example
