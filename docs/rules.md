# Rules

Rules contain a set of _conditions_ and a single _event_.  When the engine is run, each rule condition is evaluated.  If the results are truthy, the rule's _event_ is triggered.

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
  priority: 1,                             // optional, default: 1
  onSuccess: function (event, almanac) {}, // optional
  onFailure: function (event, almanac) {}, // optional
}
let rule = new Rule(options)
```

**options.conditions** : `[Object]` Rule conditions object

**options.event** : `[Object]` Sets the `.on('success')` and `on('failure')` event argument emitted whenever the rule passes.  Event objects must have a ```type``` property, and an optional ```params``` property.

**options.priority** : `[Number, default 1]` Dictates when rule should be run, relative to other rules.  Higher priority rules are run before lower priority rules.  Rules with the same priority are run in parallel.  Priority must be a positive, non-zero integer.

**options.onSuccess** : `[Function(Object event, Almanac almanac)]` Registers callback with the rule's `on('success')` listener.  The rule's `event` property and the current [Almanac](./almanac.md) are passed as arguments.

**options.onFailure** : `[Function(Object event, Almanac almanac)]` Registers callback with the rule's `on('failure')` listener.  The rule's `event` property and the current [Almanac](./almanac.md) are passed as arguments.

### setConditions(Array conditions)

Helper for setting rule conditions. Alternative to passing the `conditions` option to the rule constructor.

### setEvent(Object event)

Helper for setting rule event.  Alternative to passing the `event` option to the rule constructor.

### setPriority(Integer priority = 1)

Helper for setting rule priority. Alternative to passing the `priority` option to the rule constructor.

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

In the `params` example above, the dynamic fact handler loads an object, then returns a specific object property.  For more complex data structures, writing a separate fact handler for each object property can sometimes become unwieldy.

To alleviate this overhead, a `path` property is provided for traversing objects and arrays returned by facts.  The example above becomes simpler, and only one fact handler must be written by the developer to handle any number of properties.

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
        params: {
          productId: 'widget',
          // Complex accessor are supported, e.g. '.profile.addresses[0].city'
          path: '.price'
        },
        operator: 'greaterThan',
        value: 100
      }
    ]
  }
})
```
See the [fact-dependency](../examples/04-fact-dependency.js) example

### Comparing facts

Sometimes it is necessary to compare facts against others facts.  This can be accomplished by nesting the second fact within the `value` property.  This second fact has access to the same `params` and `path` helpers as the primary fact.

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
          path: '.price'
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

#### ```rule.on('success', Function(Object event, Almanac almanac))```

```js
// whenever rule is evaluated and the conditions pass, 'success' will trigger
rule.on('success', function(event, almanac) {
  console.log(event) // { type: 'my-event', params: { id: 1 }
})
```

#### ```rule.on('failure', Function(Object event, Almanac almanac))```

Companion to `success`, except fires when the rule fails.

```js
engine.on('failure', function(event, almanac) {
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
