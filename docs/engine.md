# Engine

The Engine stores and executes rules, emits events, and maintains state.

* [Methods](#methods)
    * [constructor([Array rules], Object [options])](#constructorarray-rules-object-options)
      * [Options](#options)
    * [engine.addFact(String id, Function [definitionFunc], Object [options])](#engineaddfactstring-id-function-definitionfunc-object-options)
    * [engine.removeFact(String id)](#engineremovefactstring-id)
    * [engine.addRule(Rule instance|Object options)](#engineaddrulerule-instanceobject-options)
    * [engine.updateRule(Rule instance|Object options)](#engineupdaterulerule-instanceobject-options)
    * [engine.removeRule(Rule instance | String ruleId)](#engineremoverulerule-instance)
    * [engine.addOperator(String operatorName, Function evaluateFunc(factValue, jsonValue))](#engineaddoperatorstring-operatorname-function-evaluatefuncfactvalue-jsonvalue)
    * [engine.removeOperator(String operatorName)](#engineremoveoperatorstring-operatorname)
    * [engine.addOperatorDecorator(String decoratorName, Function evaluateFunc(factValue, jsonValue, next))](#engineaddoperatordecoratorstring-decoratorname-function-evaluatefuncfactvalue-jsonvalue-next)
    * [engine.removeOperatorDecorator(String decoratorName)](#engineremoveoperatordecoratorstring-decoratorname)
    * [engine.setCondition(String name, Object conditions)](#enginesetconditionstring-name-object-conditions)
    * [engine.removeCondition(String name)](#engineremovecondtionstring-name)
    * [engine.run([Object facts], [Object options]) -&gt; Promise ({ events: [], failureEvents: [], almanac: Almanac, results: [], failureResults: []})](#enginerunobject-facts-object-options---promise--events--failureevents--almanac-almanac-results--failureresults-)
    * [engine.stop() -&gt; Engine](#enginestop---engine)
      * [engine.on('success', Function(Object event, Almanac almanac, RuleResult ruleResult))](#engineonsuccess-functionobject-event-almanac-almanac-ruleresult-ruleresult)
      * [engine.on('failure', Function(Object event, Almanac almanac, RuleResult ruleResult))](#engineonfailure-functionobject-event-almanac-almanac-ruleresult-ruleresult)

## Methods

### constructor([Array rules], Object [options])

```js
let Engine = require('json-rules-engine').Engine

let engine = new Engine()

// initialize with rules
let engine = new Engine([Array rules])

// initialize with options
let options = {
  allowUndefinedFacts: false,
  pathResolver: (object, path) => _.get(object, path)
};
let engine = new Engine([Array rules], options)
```

#### Options

`allowUndefinedFacts` - By default, when a running engine encounters an undefined fact,
an exception is thrown.  Turning this option on will cause the engine to treat
undefined facts as `undefined`.  (default: false)

`allowUndefinedConditions` - By default, when a running engine encounters a
condition reference that cannot be resolved an exception is thrown. Turning
this option on will cause the engine to treat unresolvable condition references
as failed conditions. (default: false)

`replaceFactsInEventParams` - By default when rules succeed or fail the events emitted are clones of the event in the rule declaration. When setting this option to true the parameters on the events will be have any fact references resolved. (default: false)

`pathResolver` - Allows a custom object path resolution library to be used. (default: `json-path` syntax). See [custom path resolver](./rules.md#condition-helpers-custom-path-resolver) docs.

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

### engine.removeFact(String id)

```js
engine.addFact('speed-of-light', 299792458)

// removes the fact
engine.removeFact('speed-of-light')
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

 ### engine.removeRule(Rule instance | Any ruleName) -> Boolean

 Removes a rule from the engine, either by passing a rule object or a rule name. When removing by rule name, all rules matching the provided name will be removed.

 Method returns true when rule was successfully remove, or false when not found.

```javascript
// adds a rule
let rule = new Rule()
engine.addRule(rule)

//remove it
engine.removeRule(rule)
//or
engine.removeRule(rule.name)
```

 ### engine.updateRule(Rule instance|Object options)

 Updates a rule in the engine.

```javascript
// adds a rule
let rule = new Rule()
engine.addRule(rule)

// change rule condition
rule.conditions.all = []

//update it in the engine
engine.updateRule(rule)
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



### engine.removeOperator(String operatorName)

Removes a operator from the engine

```javascript
engine.addOperator('startsWithLetter', (factValue, jsonValue) => {
  if (!factValue.length) return false
  return factValue[0].toLowerCase() === jsonValue.toLowerCase()
})

engine.removeOperator('startsWithLetter');
```

### engine.addOperatorDecorator(String decoratorName, Function evaluateFunc(factValue, jsonValue, next))

Adds a custom operator decorator to the engine.

```js
/*
 * decoratorName - operator decorator identifier used in the rule condition
 * evaluateFunc(factValue, jsonValue, next) - uses the decorated operator to compare the fact result to the condition 'value'
 *    factValue - the value returned from the fact
 *    jsonValue - the "value" property stored in the condition itself
 *    next - the evaluateFunc of the decorated operator
 */
engine.addOperatorDecorator('first', (factValue, jsonValue, next) => {
  if (!factValue.length) return false
  return next(factValue[0], jsonValue)
})

engine.addOperatorDecorator('caseInsensitive', (factValue, jsonValue, next) => {
  return next(factValue.toLowerCase(), jsonValue.toLowerCase())
})

// and to use the decorator...
let rule = new Rule(
  conditions: {
    all: [
      {
        fact: 'username',
        operator: 'first:caseInsensitive:equal', // reference the decorator:operator in the rule
        value: 'a'
      }
    ]
  }
)
```

See the [operator decorator example](../examples/13-using-operator-decorators.js)



### engine.removeOperatorDecorator(String decoratorName)

Removes a operator decorator from the engine

```javascript
engine.addOperatorDecorator('first', (factValue, jsonValue, next) => {
  if (!factValue.length) return false
  return next(factValue[0], jsonValue)
})

engine.addOperatorDecorator('caseInsensitive', (factValue, jsonValue, next) => {
  return next(factValue.toLowerCase(), jsonValue.toLowerCase())
})

engine.removeOperatorDecorator('first');
```

### engine.setCondition(String name, Object conditions)

Adds or updates a condition to the engine. Rules may include references to this condition. Conditions must start with `all`, `any`, `not`, or reference a condition.

```javascript
engine.setCondition('validLogin', {
  all: [
    {
      operator: 'notEqual',
      fact: 'loginToken',
      value: null
    },
    {
      operator: 'greaterThan',
      fact: 'loginToken',
      path: '$.expirationTime',
      value: { fact: 'now' }
    }
  ]
});

engine.addRule({
  condtions: {
    all: [
      {
        condition: 'validLogin'
      },
      {
        operator: 'contains',
        fact: 'loginToken',
        path: '$.role',
        value: 'admin'
      }
    ]
  },
  event: {
    type: 'AdminAccessAllowed'
  }
})

```

### engine.removeCondition(String name)

Removes the condition that was previously added.

```javascript
engine.setCondition('validLogin', {
  all: [
    {
      operator: 'notEqual',
      fact: 'loginToken',
      value: null
    },
    {
      operator: 'greaterThan',
      fact: 'loginToken',
      path: '$.expirationTime',
      value: { fact: 'now' }
    }
  ]
});

engine.removeCondition('validLogin');
```


### engine.run([Object facts], [Object options]) -> Promise ({ events: [], failureEvents: [], almanac: Almanac, results: [], failureResults: []})

Runs the rules engine.  Returns a promise which resolves when all rules have been run.

```js
// run the engine
await engine.run()

// with constant facts
await engine.run({ userId: 1 })

const {
  results,         // rule results for successful rules
  failureResults,  // rule results for failed rules
  events,          // array of successful rule events
  failureEvents,   // array of failed rule events
  almanac          // Almanac instance representing the run
} = await engine.run({ userId: 1 })
```
Link to the [Almanac documentation](./almanac.md)

Optionally, you may specify a specific almanac instance via the almanac property.

```js
// create a custom Almanac
const myCustomAlmanac = new CustomAlmanac();

// run the engine with the custom almanac
await engine.run({}, { almanac: myCustomAlmanac })
```

### engine.stop() -> Engine

Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
and no further events emitted.

Be aware that since rules of the *same* priority are evaluated in parallel(not series), other rules of
the same priority may still emit events, even though the engine has been told to stop.

```js
engine.stop()
```

There are two generic event emissions that trigger automatically:

#### ```engine.on('success', Function(Object event, Almanac almanac, RuleResult ruleResult))```

Fires when a rule passes. The callback will receive the event object, the current [Almanac](./almanac.md), and the [Rule Result](./rules.md#rule-results). Any promise returned by the callback will be waited on to resolve before execution continues.

```js
engine.on('success', function(event, almanac, ruleResult) {
  console.log(event) // { type: 'my-event', params: { id: 1 }
})
```

#### ```engine.on('failure', Function(Object event, Almanac almanac, RuleResult ruleResult))```

Companion to 'success', except fires when a rule fails.  The callback will receive the event object, the current [Almanac](./almanac.md), and the [Rule Result](./rules.md#rule-results). Any promise returned by the callback will be waited on to resolve before execution continues.

```js
engine.on('failure', function(event, almanac, ruleResult) {
  console.log(event) // { type: 'my-event', params: { id: 1 }
})
```
