# Json Rules Engine
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)
[![Build Status](https://travis-ci.org/CacheControl/json-rules-engine.svg?branch=master)](https://travis-ci.org/CacheControl/json-rules-engine)

A rules engine expressed in JSON

## Synopsis

```json-rules-engine``` is a powerful, lightweight rules engine.  Rules are composed of simple json structures, making them human readable and easy to persist.  Performance controls and built-in caching mechanisms help make the engine sufficiently performant to handle most use cases.

## Features

* Rules and Events expressed in JSON
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

An _engine_ is composed of 4 basic building blocks: *rules*, *rule conditions*, *rule events*, and *facts*.

_Engine_ - executes rules, emits events, and maintains state.  Most applications will have a single instance.

```js
let engine = new Engine()
```

_Rule_ - contains a set of _conditions_ and a single _event_.  When the engine is run, each rule condition is evaluated.  If the results are truthy, the rule's _event_ is triggered.

```js
let rule = new Rule({ priority: 25 })  // the higher the priority, the earlier the rule will run.  default=1
engine.addRule(rule)
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

_Rule Event_ - Defines an event emitter that is triggered when conditions are met.  Events must have a _type_ property which acts as an identifier.  Optionally, events may also have _params_.

```js
rule.setEvent({
  type: 'celebrate',
  params: {
    balloons: true,
    cake: false
  }
})
engine.on('celebrate', function (params) {
  // handle event business logic
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

More on engines can be found [here](./docs/engine.md)

### Step 2: Add Rules

Rules are composed of two components: conditions and events.  _Conditions_ are a set of requirements that must be met to trigger the rule's _event_.

```js
let event = {
  type: 'young-adult-rocky-mnts',
  params: {
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
let rule = new Rule({ conditions, event})
engine.addRule(rule)
```

The example above demonstrates a rule for finding individuals between _18 and 25_ who live in either _Utah or Colorado_.

More on rules can be found [here](./docs/rules.md)

### Step 3: Define Facts

Facts are constant values or pure functions.  Using the current example, if the engine were to be run, it would throw an error: "Undefined fact: 'age'".  So let's define some facts!

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

**Important:** facts should be *pure functions*; their computed values will vary based on the ```params``` argument.  By establishing facts as pure functions, it allows the rules engine to cache results throughout each ```run()```; facts called multiple times with the same ```params``` will trigger the computation once and cache the results for future calls.  If fact caching not desired, this behavior can be turned off via the options; see the [docs](./docs/facts.md).

More on facts can be found [here](./docs/facts.md)


### Step 4: Handing Events

When rule conditions are met, the application needs to respond to the event that is emitted.

```js
// subscribe directly to the 'young-adult' event
engine.on('young-adult-rocky-mnts', (params) => {
  // params: {
  //   giftCard: 'amazon',
  //   value: 50
  // }
})

// - OR -

// subscribe to any event emitted by the engine
engine.on('event', function (event, engine) {
  // event: {
  //   type: "young-adult-rocky-mnts",
  //   params: {
  //     giftCard: 'amazon',
  //     value: 50
  //   }
  // }
})
```

### Step 5: Run the engine

Running an engine executes the rules, and fires off event events for conditions that were met.  The fact results cache will be cleared with each ```run()```

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
