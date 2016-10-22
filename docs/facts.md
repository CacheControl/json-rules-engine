# Facts

Facts are methods or constants registered with the engine prior to runtime and referenced within rule conditions.  Each fact method should be a pure function that may return a computed value or promise.
As rule conditions are evaluated during runtime, they retrieve fact values dynamically and use the condition _operator_ to compare the fact result with the condition _value_.

## Methods

### constructor(String id, Constant|Function, [Object options]) -> instance

```js
// constant value facts
let fact = new Fact('apiKey', '4feca34f9d67e99b8af2')

// dynamic facts
let fact = new Fact('account-type', function getAccountType() {
  // ...
})

// facts with options:
engine.addFact('account-type', function getAccountType() {
  // ...
}, { cache: false, priority: 500 })
```

**options**
* { cache: Boolean } - Sets whether the engine should cache the result of this fact.  Cache key is based on the factId and 'params' passed to it. Default: *true*
* { priority: Integer } - Sets when the fact should run in relation to other facts and conditions.  The higher the priority value, the sooner the fact will run.  Default: *1*
