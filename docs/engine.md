# Engine

## Methods

### constructor([Array rules])

```js
let Engine = require('json-rules-engine').Engine

let engine = new Engine()

// initialize with rules
let engine = new Engine(ruleArray)
```

### engine.addFact(String id, Object [options], Function [definitionFunc])

```js
// constant facts:
engine.addFact('speed-of-light', 299792458)

// facts computed via function
engine.addFact('account-type', function getAccountType() {
  // ...
})

// facts with options:
engine.addFact('account-type', { cache: false, priority: 500 }, function getAccountType() {
  // ...
})
```

### engine.addRule(Rule instance|Object options)

Adds a rule to the engine.  The engine will execute the rule upon the next ```run()```

```js
let Rule = require('json-rules-engine').Rule

// via rule properties:
engine.addRule({
  conditions: {},
  action: {},
  priority: 1
})

// or rule instance:
let rule = new Rule()
engine.addRule(rule)
```

### engine.run([Object facts], [Object options]) -> Promise

Runs the rules engine.  Returns a promise which resolves when all rules have been run.

```js
// run the engine
engine.run()

// with constant facts
engine.run({ userId: 1 })

// run with all fact caching turned off
async run ({}, { clearfactResultsCache: true })

```

### engine.stop() -> Engine

Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
and no further actions emitted.

Be aware that since rules of the *same* priority are evaluated in parallel(not series), other rules of
the same priority may still emit actions, even though the engine has been told to stop.

```js
engine.stop()
```
