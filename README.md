# Json Rules Engine
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![Build Status](https://travis-ci.org/CacheControl/json-rules-engine.svg?branch=master)](https://travis-ci.org/CacheControl/json-rules-engine)

A rules engine expressed in JSON

## Synopsis

```json-rules-engine``` is a powerful, lightweight rules engine.  Rules are composed of simple json structures, making them human readable and easy to persist.  Performance controls and built-in caching mechanisms help make the engine sufficiently performant to handle most use cases.

## Features

* Rules and Actions expressed in JSON
* Facts provide the mechanism for pulling data asynchronously during runtime
* Priority levels can be set at the rule, fact, and condition levels to optimize performance
* Full support for ```ALL``` and ```ANY``` boolean operators, including recursive nesting
* Comparison operators:  ```equal```, ```notEqual```, ```in```, ```notIn```, ```lessThan```, ```lessThanInclusive```, ```greaterThan```, ```greaterThanInclusive```
* Lightweight & extendable; less than 500 lines of javascript w/few dependencies

## Installation

```bash
$ npm install json-rules-engine
```

## Conceptual Overview

An _engine_ is composed of 4 basic building blocks: *rules*, *rule conditions*, *rule actions*, and *facts*.

_Engine_ - executes rules, emits actions, and maintains state.  Most applications will have a single instance.

```js
let engine = new Engine()
```

_Rule_ - contains a set of _conditions_ and a single _action_.  When the engine is run, each rule condition is evaluated.  If the results are truthy, the rule's _action_ is triggered.

```js
let rule = new Rule({ priority: 25 })  // the higher the priority, the earlier the rule will run.  default=1
```

_Rule Condition_ - Each condition consists of a constant _value_, an _operator_, a _fact_, and (optionally) fact _params_.  The _operator_ compares the fact result to the _value_.

```js
// engine will call the "new-years" method at runtime with "params" and compare the results to "true"
rule.setConditions({
  fact: 'new-years',
  params: {
    calendar: 'gregorian'
  }
  operator: 'equal',
  value: true
})
```

_Rule Action_ - Actions are event emissions triggered by the engine when conditions are met.  Actions must have a _type_ property which acts as an identifier.  Optionally, actions may also have _params_.

```js
rule.setAction({
  type: 'celebrate',
  params: {
    balloons: true,
    cake: false
  }
})
engine.on('celebrate', function (params) {
  // handle action business logic
  // params = { balloons: true, cake: false }
})
```

_Fact_ - Methods or constants registered with the engine prior to runtime, and referenced within rule conditions.  Each fact method is a pure function that may return a computed value or promise. As rule conditions are evaluated during runtime, they retrieve fact values dynamically and use the condition _operator_ to compare the fact result with the condition _value_.

```js
let fact = function(params, engine) {
  // business logic for computing fact value based on params
  return dayOfYearByCalendar(params.calendar)
}
engine.addFact('year', fact)
```

## Usage Example

### Step 1: Create an Engine

```js
  let Engine = require('json-rules-engine')
  let engine = new Engine()
```

### Step 2: Add Rules

Rules are composed of two components: conditions and actions.  _Conditions_ are a set of requirements that must be met to trigger the rule's _action_.  Actions are emitted as events and may subscribed to by the application (see step 4).

```js
let action = {
  type: 'young-adult-rocky-mnts',
  params: {  // optional
    giftCard: 'amazon',
    value: 50
  }
}
let conditions = {
  all: [
    {
      fact: 'age',
      operator: 'greaterThanInclusive',
      value: 18
    }, {
      fact: 'age',
      operator: 'lessThanInclusive',
      value: 25
    },
    any: [
      {
        fact: 'state',
        params: {
          country: 'us'
        },
        operator: 'equal',
        value: 'colorado'
      }, {
        fact: 'state',
        params: {
          country: 'us'
        },
        operator: 'equal',
        value: 'utah'
      }
    ]
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
  // rule "params" value is passed to the fact
  // other fact values accessible via engine.factValue()
  return stateLookupByZip(params.country, engine.factValue('zip-code'))
}
engine.addFact('state', stateFact)

/*
 * Define the 'age' fact
 */
let ageFact = function(params, engine) {
  // facts may return a promise when performing asynchronous operations
  // such as database calls, http requests, etc to gather data
  return engine.factValue('userId').then((userId) => {
    return db.getUser(userId)
  }).then((user) => {
    return user.age
  })
}
engine.addFact('age', ageFact)
```

Now when the engine is run, it will call the methods above whenever it encounters the ```fact: "age"``` or ```fact: "state"```properties.

**Important:** facts should be *pure functions*, meaning their values will always evaluate based on the ```params``` argument.  By establishing facts are pure functions, it allows the rules engine to cache results throughout a ```run()```; if the same fact is called multiple times with the same ```params```, it will trigger the computation once and cache the results for future calls.  If fact caching not desired, this behavior can be turned off via the options; see the [docs](./docs/facts.md).

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

// - OR -

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

### Step 5: Run the engine

Running an engine executes the rules, and fires off action events for conditions that were met.  The fact results cache will be cleared with each ```run()```

```js
// evaluate the rules
engine.run()

// Optionally, constant facts may be provided
engine.run({ userId: 1 })  // any time a rule condition requires 'userId', '1' will be returned

// run() returns a promise
engine.run().then(() => {
  console.log('all rules executed')
})
```

## Debugging

To see what the engine is doing under the hood, debug output can be turned on via:

```bash
DEBUG=json-rules-engine
```
