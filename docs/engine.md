# Engine

## Methods

### constructor([Array rules])

```js
let Engine = require('json-rules-engine').Engine

let engine = new Engine()

// initialize with rules
let engine = new Engine([Array rules])
```

### engine.addFact(String id, Function [definitionFunc], Object [options])

```js
// constant facts:
engine.addFact('speed-of-light', 299792458)

// facts computed via function
engine.addFact('account-type', function getAccountType() {
  // ...
})

// facts with options:
engine.addFact('account-type', function getAccountType() {
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

Listens for events emitted as rules are being evaluated.  "event" is determined by [rule.setEvent](./rules.md#seteventobject-event).

```js
rule.setEvent({
  type: 'my-event',
  params: {
    id: 1
  }
})

// whenever rule is evaluated and the conditions pass, 'my-event' will trigger
engine.on('my-event', function(params) {
  console.log(params) // id: 1
})
```

There are two generic event emissions that trigger automatically:

#### ```engine.on('success', cb)```

Fires when *any* rule passes.  In this case the callback will receive the entire event object.

```js
engine.on('success', function(event) {
  console.log(event) // { type: 'my-event', params: { id: 1 } }
})
```

#### ```engine.on('failure', cb)```

Companion to 'success', except fires when any rule fails.

```js
engine.on('failure', function(event) {
  console.log(event) // { type: 'my-event', params: { id: 1 } }
})
```
