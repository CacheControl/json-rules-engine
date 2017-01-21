# Walkthrough

## Step 1: Create an Engine

```js
  let Engine = require('json-rules-engine')
  let engine = new Engine()
```

More on engines can be found [here](./docs/engine.md)

## Step 2: Add Rules

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

Facts are constant values or pure functions.  Using the current example, if the engine were to be run, it would throw an exception: `Undefined fact:'age'` (note: this behavior can be disable via [engine options](./engine.md#Options)).

Let's define some facts:

```js

/*
 * Define the 'state' fact
 */
let stateFact = function(params, almanac) {
  // rule "params" value is passed to the fact
  // 'almanac' can be used to lookup other facts
  // via almanac.factValue()
  return stateLookupByZip(params.country, almanac.factValue('zip-code'))
}
engine.addFact('state', stateFact)

/*
 * Define the 'age' fact
 */
let ageFact = function(params, almanac) {
  // facts may return a promise when performing asynchronous operations
  // such as database calls, http requests, etc to gather data
  return almanac.factValue('userId').then((userId) => {
    return db.getUser(userId)
  }).then((user) => {
    return user.age
  })
}
engine.addFact('age', ageFact)
```

Now when the engine is run, it will call the methods above whenever it encounters the ```fact: "age"``` or ```fact: "state"``` properties.

**Important:** facts should be *pure functions*; their computed values will vary based on the ```params``` argument.  By establishing facts as pure functions, it allows the rules engine to cache results throughout each ```run()```; facts called multiple times with the same ```params``` will trigger the computation once and cache the results for future calls.  If fact caching not desired, this behavior can be turned off via the options; see the [docs](./docs/facts.md).

More on facts can be found [here](./docs/facts.md).  More on almanacs can be found [here](./docs/almanac.md)


## Step 4: Handing Events

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
engine.on('success', function (event, engine) {
  // event: {
  //   type: "young-adult-rocky-mnts",
  //   params: {
  //     giftCard: 'amazon',
  //     value: 50
  //   }
  // }
})
```

## Step 5: Run the engine

Running an engine executes the rules, and fires off event events for conditions that were met.  The fact results cache will be cleared with each ```run()```

```js
// evaluate the rules
engine.run()

// Optionally, facts known at runtime may be passed to run()
engine.run({ userId: 1 })  // any time a rule condition requires 'userId', '1' will be returned

// run() returns a promise
engine.run().then((events) => {
  console.log('all rules executed; the following events were triggered: ', events)
})
```
