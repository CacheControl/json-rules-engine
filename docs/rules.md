
# Rules

Rules contain a set of _conditions_ and a single _event_.  When the engine is run, each rule condition is evaluated.  If the results are truthy, the rule's _event_ is triggered.

* [Methods](#methods)
    * [constructor([Object options|String json])](#constructorobject-optionsstring-json)
    * [setConditions(Array conditions)](#setconditionsarray-conditions)
    * [getConditions() -&gt; Object](#getconditions---object)
    * [setEvent(Object event)](#seteventobject-event)
    * [getEvent() -&gt; Object](#getevent---object)
    * [setPriority(Integer priority = 1)](#setpriorityinteger-priority--1)
    * [getPriority() -&gt; Integer](#getpriority---integer)
    * [toJSON(Boolean stringify = true)](#tojsonboolean-stringify--true)
* [Conditions](#conditions)
    * [Basic conditions](#basic-conditions)
    * [Boolean expressions: all and any](#boolean-expressions-all-and-any)
    * [Condition helpers: params](#condition-helpers-params)
    * [Condition helpers: path](#condition-helpers-path)
    * [Condition helpers: custom path resolver](#condition-helpers-custom-path-resolver)
    * [Comparing facts](#comparing-facts)
* [Events](#events)
  * [rule.on('success', Function(Object event, Almanac almanac, RuleResult ruleResult))](#ruleonsuccess-functionobject-event-almanac-almanac-ruleresult-ruleresult)
  * [rule.on('failure', Function(Object event, Almanac almanac, RuleResult ruleResult))](#ruleonfailure-functionobject-event-almanac-almanac-ruleresult-ruleresult)
* [Operators](#operators)
    * [String and Numeric operators:](#string-and-numeric-operators)
    * [Numeric operators:](#numeric-operators)
    * [Array operators:](#array-operators)
* [Rule Results](#rule-results)
* [Persisting](#persisting)

## Methods

### constructor([Object options|String json])

Returns a new rule instance

```js
let options = {
  conditions: {
    all: [
      {
        fact: 'my-fact',
        operator: 'equal',
        value: 'some-value'
      }
    ]
  },
  event: {
    type: 'my-event',
    params: {
      customProperty: 'customValue'
    }
  },
  name: any,                               // optional
  priority: 1,                             // optional, default: 1
  onSuccess: function (event, almanac) {}, // optional
  onFailure: function (event, almanac) {}, // optional
}
let rule = new Rule(options)
```

**options.conditions** : `[Object]` Rule conditions object

**options.event** : `[Object]` Sets the `.on('success')` and `on('failure')` event argument emitted whenever the rule passes.  Event objects must have a ```type``` property, and an optional ```params``` property.

**options.priority** : `[Number, default 1]` Dictates when rule should be run, relative to other rules.  Higher priority rules are run before lower priority rules.  Rules with the same priority are run in parallel.  Priority must be a positive, non-zero integer.

**options.onSuccess** : `[Function(Object event, Almanac almanac)]` Registers callback with the rule's `on('success')` listener.  The rule's `event` property and the current [Almanac](./almanac.md) are passed as arguments. Any promise returned by the callback will be waited on to resolve before execution continues.

**options.onFailure** : `[Function(Object event, Almanac almanac)]` Registers callback with the rule's `on('failure')` listener.  The rule's `event` property and the current [Almanac](./almanac.md) are passed as arguments. Any promise returned by the callback will be waited on to resolve before execution continues.

**options.name** : `[Any]` A way of naming your rules, allowing them to be easily identifiable in [Rule Results](#rule-results).  This is usually of type `String`, but could also be `Object`, `Array`, or `Number`. Note that the name need not be unique, and that it has no impact on execution of the rule.

### setConditions(Array conditions)

Helper for setting rule conditions. Alternative to passing the `conditions` option to the rule constructor.

### getConditions() -> Object

Retrieves rule condition set by constructor or `setCondition()`

### setEvent(Object event)

Helper for setting rule event.  Alternative to passing the `event` option to the rule constructor.

### getEvent() -> Object

Retrieves rule event set by constructor or `setEvent()`

### setPriority(Integer priority = 1)

Helper for setting rule priority. Alternative to passing the `priority` option to the rule constructor.

### getPriority() -> Integer

Retrieves rule priority set by constructor or `setPriority()`

### toJSON(Boolean stringify = true)

Serializes the rule into a JSON string.  Often used when persisting rules.

```js
let jsonString = rule.toJSON() // string: '{"conditions":{"all":[]},"priority":50 ...

let rule = new Rule(jsonString) // restored rule; same conditions, priority, event

// without stringifying
let jsonObject = rule.toJSON(false) // object: {conditions:{ all: [] }, priority: 50 ...
```

## Conditions

Rule conditions are a combination of facts, operators, and values that determine whether the rule is a `success` or a `failure`.

### Basic conditions

The simplest form of a condition consists of a `fact`, an `operator`, and a `value`.  When the engine runs, the operator is used to compare the fact against the value.

```js
// my-fact <= 1
let rule = new Rule({
  conditions: {
    all: [
      {
        fact: 'my-fact',
        operator: 'lessThanInclusive',
        value: 1
      }
    ]
  }
})
```

See the [hello-world](../examples/01-hello-world.js) example.

### Boolean expressions: `all` and `any`

Each rule's conditions *must* have either an `all` or an `any` operator at its root, containing an array of conditions.  The `all` operator specifies that all conditions contained within must be truthy for the rule to be considered a `success`.  The `any` operator only requires one condition to be truthy for the rule to succeed.

```js
// all:
let rule = new Rule({
  conditions: {
    all: [
      { /* condition 1 */ },
      { /* condition 2 */ },
      { /* condition n */ },
    ]
  }
})

// any:
let rule = new Rule({
  conditions: {
    any: [
      { /* condition 1 */ },
      { /* condition 2 */ },
      { /* condition n */ },
      {
        all: [ /* more conditions */ ]
      }
    ]
  }
})
```

Notice in the second example how `all` and `any` can be nested within one another to produce complex boolean expressions.  See the [nested-boolean-logic](../examples/02-nested-boolean-logic.js) example.

### Condition helpers: `params`

Sometimes facts require additional input to perform calculations.  For this, the `params` property is passed as an argument to the fact handler.  `params` essentially functions as fact arguments, enabling fact handlers to be more generic and reusable.

```js
// product-price retrieves any product's price based on the "productId" in "params"
engine.addFact('product-price', function (params, almanac) {
  return productLoader(params.productId) // loads the "widget" product
    .then(product => product.price)
})

// identifies whether the current widget price is above $100
let rule = new Rule({
  conditions: {
    all: [
      {
        fact: 'product-price',
        params: {
          productId: 'widget' // specifies which product to load
        },
        operator: 'greaterThan',
        value: 100
      }
    ]
  }
})
```

See the [dynamic-facts](../examples/03-dynamic-facts) example

### Condition helpers: `path`

In the `params` example above, the dynamic fact handler loads an object, then returns a specific object property. For more complex data structures, writing a separate fact handler for each object property quickly becomes verbose and unwieldy.

To address this, a `path` property may be provided to traverse fact data using [json-path](https://goessner.net/articles/JsonPath/) syntax. The example above becomes simpler, and only one fact handler must be written:

```js

// product-price retrieves any product's price based on the "productId" in "params"
engine.addFact('product-price', function (params, almanac) {
  // NOTE: `then` is not required; .price is specified via "path" below
  return productLoader(params.productId)
})

// identifies whether the current widget price is above $100
let rule = new Rule({
  conditions: {
    all: [
      {
        fact: 'product-price',
        path: '$.price',
        params: {
          productId: 'widget'
        },
        operator: 'greaterThan',
        value: 100
      }
    ]
  }
})
```

json-path support is provided by [jsonpath-plus](https://github.com/s3u/JSONPath)

For an example, see [fact-dependency](../examples/04-fact-dependency.js)

### Condition helpers: custom `path` resolver

To use a custom path resolver instead of the `json-path` default, a `pathResolver` callback option may be passed to the engine. The callback will be invoked during execution when a `path` property is encountered.

```js
const { get } = require('lodash') // to use the lodash path resolver, for example

function pathResolver (object, path) {
  // when the rule below is evaluated:
  //   "object" will be the 'fact1' value
  //   "path" will be '.price[0]'
  return get(object, path)
}
const engine = new Engine(rules, { pathResolver })
engine.addRule(new Rule({
  conditions: {
    all: [
      {
        fact: 'fact1',
        path: '.price[0]', // uses lodash path syntax
        operator: 'equal',
        value: 1
      }
    ]
  })
)
```

This feature may be useful in cases where the higher performance offered by simpler object traversal DSLs are preferable to the advanced expressions provided by `json-path`. It can also be useful for leveraging more complex DSLs ([jsonata](https://jsonata.org/), for example) that offer more advanced capabilities than `json-path`.

### Comparing facts

Sometimes it is necessary to compare facts against other facts.  This can be accomplished by nesting the second fact within the `value` property.  This second fact has access to the same `params` and `path` helpers as the primary fact.

```js
// identifies whether the current widget price is above a maximum
let rule = new Rule({
  conditions: {
    all: [
      // widget-price > budget
      {
        fact: 'product-price',
        params: {
          productId: 'widget',
          path: '$.price'
        },
        operator: 'greaterThan',
        // "value" contains a fact
        value: {
          fact: 'budget' // "params" and "path" helpers are available as well
        }
      }
    ]
  }
})
```
See the [fact-comparison](../examples/08-fact-comparison.js) example

## Events

Listen for `success` and `failure` events emitted when rule is evaluated.

#### ```rule.on('success', Function(Object event, Almanac almanac, RuleResult ruleResult))```

The callback will receive the event object, the current [Almanac](./almanac.md), and the [Rule Result](./rules.md#rule-results).

```js
// whenever rule is evaluated and the conditions pass, 'success' will trigger
rule.on('success', function(event, almanac, ruleResult) {
  console.log(event) // { type: 'my-event', params: { id: 1 }
})
```

#### ```rule.on('failure', Function(Object event, Almanac almanac, RuleResult ruleResult))```

Companion to `success`, except fires when the rule fails.  The callback will receive the event object, the current [Almanac](./almanac.md), and the [Rule Result](./rules.md#rule-results).

```js
engine.on('failure', function(event, almanac, ruleResult) {
  console.log(event) // { type: 'my-event', params: { id: 1 }
})
```

## Operators

Each rule condition must begin with a boolean operator(```all``` or ```any```) at its root.

The ```operator``` compares the value returned by the ```fact``` to what is stored in the ```value``` property.  If the result is truthy, the condition passes.

### String and Numeric operators:

  ```equal``` - _fact_ must equal _value_

  ```notEqual```  - _fact_ must not equal _value_

  _these operators use strict equality (===) and inequality (!==)_

### Numeric operators:

  ```lessThan``` - _fact_ must be less than _value_

  ```lessThanInclusive```- _fact_ must be less than or equal to _value_

  ```greaterThan``` - _fact_ must be greater than _value_

  ```greaterThanInclusive```- _fact_ must be greater than or equal to _value_

### Array operators:

  ```in```  - _fact_ must be included in _value_ (an array)

  ```notIn```  - _fact_ must not be included in _value_ (an array)

  ```contains```  - _fact_ (an array) must include _value_

  ```doesNotContain```  - _fact_ (an array) must not include _value_

## Rule Results

After a rule is evaluated, a `rule result` object is provided to the `success` and `failure` events.  This argument is similar to a regular rule, and contains additional metadata about how the rule was evaluated.  Rule results can be used to extract the results of individual conditions, computed fact values, and boolean logic results.  `name` can be used to easily identify a given rule.

Rule results are structured similar to rules, with two additional pieces of metadata sprinkled throughout: `result` and `factResult`
```js
{
  result: false,                    // denotes whether rule computed truthy or falsey
  conditions: {
    all: [
      {
        fact: 'my-fact',
        operator: 'equal',
        value: 'some-value',
        result: false,             // denotes whether condition computed truthy or falsey
        factResult: 'other-value'  // denotes what 'my-fact' was computed to be
      }
    ]
  },
  event: {
    type: 'my-event',
    params: {
      customProperty: 'customValue'
    }
  },
  priority: 1,
  name: 'someName'
}
```

A demonstration can be found in the [rule-results](../examples/09-rule-results.js) example.

## Persisting

Rules may be easily converted to JSON and persisted to a database, file system, or elsewhere.  To convert a rule to JSON, simply call the ```rule.toJSON()``` method.  Later, a rule may be restored by feeding the json into the Rule constructor.

```js
// save somewhere...
let jsonString = rule.toJSON()

// ...later:
let rule = new Rule(jsonString)
```

_Why aren't "fact" methods persistable?_  This is by design, for several reasons.  Firstly, facts are by definition business logic bespoke to your application, and therefore lie outside the scope of this library.  Secondly, many times this request indicates a design smell; try thinking of other ways to compose the rules and facts to accomplish the same objective. Finally, persisting fact methods would involve serializing javascript code, and restoring it later via ``eval()``.
