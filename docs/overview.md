# Conceptual Overview

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
