# Engine

The Engine stores and executes rules, emits events, and maintains state.

## Methods

### constructor([Array rules], Object [options])

```js
let Engine = require('json-rules-engine').Engine

let engine = new Engine()

// initialize with rules
let engine = new Engine([Array rules])

// initialize with options
let options = {
  allowUndefinedFacts: false
};
let engine = new Engine([Array rules], options)
```

#### Options

`allowUndefinedFacts` - By default, when a running engine encounters an undefined fact,
an exception is thrown.  Turning this option on will cause the engine to treat
undefined facts as falsey conditions.  (default: false)

### engine.addFact(String id, Function [definitionFunc], Object [options])

```js
// constant facts:
engine.addFact('speed-of-light', 299792458)

// facts computed via function
engine.addFact('account-type', function getAccountType(params, almanac) {
  // ...
})

// facts with options:
engine.addFact('account-type', function getAccountType(params, almanac) {
  // ...
}, { cache: false, priority: 500 })
```

### engine.addRule(Rule instance|Object options)

Adds a rule to the engine.  The engine will execute the rule upon the next ```run()```

```js
let Rule = require('json-rules-engine').Rule

// via rule properties:
engine.addRule({
  conditions: {},
  event: {},
  priority: 1,                             // optional, default: 1
  onSuccess: function (event, almanac) {}, // optional
  onFailure: function (event, almanac) {}, // optional
})

// or rule instance:
let rule = new Rule()
engine.addRule(rule)
```

### engine.addOperator(String operatorName, Function evaluateFunc(factValue, jsonValue))

Adds a custom operator to the engine.  For situations that require going beyond the generic, built-in operators (`equal`, `greaterThan`, etc).

```js
/*
 * operatorName - operator identifier mentioned in the rule condition
 * evaluateFunc(factValue, jsonValue) - compares fact result to the condition 'value', returning boolean
 *    factValue - the value returned from the fact
 *    jsonValue - the "value" property stored in the condition itself
 */
engine.addOperator('startsWithLetter', (factValue, jsonValue) => {
  if (!factValue.length) return false
  return factValue[0].toLowerCase() === jsonValue.toLowerCase()
})

// and to use the operator...
let rule = new Rule(
  conditions: {
    all: [
      {
        fact: 'username',
        operator: 'startsWithLetter', // reference the operator name in the rule
        value: 'a'
      }
    ]
  }
)
```

See the [operator example](../examples/06-custom-operators.js)

### engine.run([Object facts], [Object options]) -> Promise (Events)

Runs the rules engine.  Returns a promise which resolves when all rules have been run.

```js
// run the engine
engine.run()

// with constant facts
engine.run({ userId: 1 })

// returns rule events that were triggered
engine
  .run({ userId: 1 })
  .then(function(events) {
    console.log(events)
  })
```

### engine.stop() -> Engine

Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
and no further events emitted.

Be aware that since rules of the *same* priority are evaluated in parallel(not series), other rules of
the same priority may still emit events, even though the engine has been told to stop.

```js
engine.stop()
```

### engine.on(String event, Function callback) -> Engine

Listens for events emitted as rules are being evaluated.  "event" is determined by the [rule event](./rules.md#Events).

```js
let rule = new Rule({
  event: {
    type: 'my-event',
    params: {
      customValue: 'my-custom-value'
    }
  }
})

// whenever rule is evaluated and conditions pass, 'my-event' will trigger
engine.on('my-event', function(params) {
  console.log(params) // { customValue: 'my-custom-value' }
})
```

There are two generic event emissions that trigger automatically:

#### ```engine.on('success', cb)```

Fires when *any* rule passes.  In this case the callback will receive the entire event object.

```js
engine.on('success', function(event, almanac) {
})
```

#### ```engine.on('failure', cb)```

Companion to 'success', except fires when any rule fails.

```js
engine.on('failure', function(rule, almanac) {
})
```
