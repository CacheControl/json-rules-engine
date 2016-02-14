# Rules

## Methods

### constructor([options])

Returns a new rule instance

```js
let rule = new Rule(options)
```

### setConditions(conditions)

Assigns the rule conditions to the provided argument.  The root condition must be a boolean operator (```all``` or ```any```)

```js
rule.setConditions({
  all: [
    {
      fact: 'revenue',
      operator: 'greaterThanInclusive'
      value: 1000000
    }
  ]
})
```

### setAction(object)

Sets the action the engine should emit when the rule conditions pass.  All actions must have a ```type``` property, which denotes the event name to emit when the rule passes.

Optionally, a ```params``` property may be provided as well.  ```params``` will be passed to the event as an argument.

```js
rule.setAction({
  type: 'string', //required
  params: 'object' //optional
})
```

### setPriority(integer = 1)

Sets the rule priority.  Priority must be a positive, non-zero integer.  The higher the priority, the sooner the rule will run.  If no priority is assigned to a Rule, it will receive a default priority of 1.

```js
rule.setPriority(100)
```

## Conditions

Each rule condition *must* begin with a boolean operator(```all``` or ```any```) at its root.

The _operator_ compares the value returned by the "fact" to what is stored in the 'value' property.  If the result is truthy, the condition passes. Available operators:

  ```equal``` - _fact_ must equal _value_

  ```notEqual```  - _fact_ must not equal _value_

  ```in```  - _fact_ must be included in _value_, which is an array

  ```notIn```  - _fact_ must not be included in _value_, which is an array

  ```lessThan``` - _fact_ must be less than _value_;

  ```lessThanInclusive```- _fact_ must be less than or equal to _value_

  ```greaterThan``` - _fact_ must be greater than _value_;

  ```greaterThanInclusive```- _fact_ must be greater than or equal to _value_
