# Almanac

## Overview

An almanac collects facts through an engine run cycle.  As the engine computes fact values,
the results are stored in the almanac and cache'd.  If the engine detects a fact computation has
been previously computed, it re-uses the cache'd result from the almanac.  Every time ```engine.run()``` is invoked,
a new almanac is instantiated.

The almanac for the current engine run is available as arguments passed to the fact evaluation methods and
 to the engine ```success``` event.  The almanac may be used to define additional facts during runtime.

## Methods

### almanac.factValue(Fact fact, Object params, String path) -> Promise

Computes the value of the provided fact + params.  If "path" is provided, it will be used as a property accessor on the fact's return object.

```js
almanac
  .factValue('account-information', { accountId: 1 }, '.balance')
  .then( value => console.log(value))
```

### almanac.addRuntimeFact(String factId, Mixed value)

Sets a constant fact mid-run.  Often used in conjunction with rule and engine event emissions.

```js
almanac.addRuntimeFact('account-id', 1)
```

## Common Use Cases

### Fact dependencies

The most common use of the almanac is to access data computed by other facts during runtime.  This allows
leveraging the engine's caching mechanisms to design more efficient rules.

The [fact-dependency](../examples/04-fact-dependency.js) example demonstrates a real world application of this technique.

For example, say there were two facts: _is-funded-account_ and _account-balance_.  Both facts depend on the same _account-information_ data set.
Using the Almanac, each fact can be defined to call a **base** fact responsible for loading the data.  This causes the engine
to make the API call for loading account information only once per account.

```js
/*
 * Base fact for retrieving account data information.
 * Engine will automatically cache results by accountId
 */
let accountInformation = new Fact('account-information', function(params, almanac) {
   return request
      .get({ url: `http://my-service/account/${params.accountId}`)
      .then(function (response) {
         return response.data
      })
})

/*
 * Calls the account-information fact with the appropriate accountId.
 * Receives a promise w/results unique to the accountId
 */
let isFundedAccount = new Fact('is-funded-account', function(params, almanac) {
   return almanac.factValue('account-information', { accountId: params.accountId }).then(info => {
     return info.funded === true
   })
})

/*
 * Calls the account-information fact with the appropriate accountId.
 * Receives a promise w/results unique to the accountId
 */
let accountBalance = new Fact('account-balance', function(params, almanac) {
   return almanac.factValue('account-information', { accountId: params.accountId }).then(info => {
     return info.balance
   })
})

/*
 * Add the facts the the engine
 */
engine.addFact(accountInformation)
engine.addFact(isFundedAccount)
engine.addFact(accountBalance)

/*
 * Run the engine.
 * account-information will be loaded ONCE for the account, regardless of how many
 * times is-funded-account or account-balance are mentioned in the rules
 */

engine.run({ accountId: 1 })
```

### Retrieve fact values when handling events

When a rule evalutes truthy and its ```event``` is called, new facts may be defined by the event handler.
  Note that with this technique, the rule priority becomes important; if a rule is expected to
  define a fact value, it's important that rule be run prior to other rules that reference the fact.  To
  learn more about setting rule priorities, see the [rule documentation](./rules.md).

```js
engine.on('success', (event, almanac) => {
  // Handle the event using a fact value to process
  // Retrieve user's account info and make an api call using the results
  almanac
    .factValue('account-information', event.params.accountId)
    .then(info => {
      return request.post({ url: `http://my-service/toggle?funded=${!info.funded}`)
    })
})
```

### Rule Chaining

The `almanac.addRuntimeFact()` method may be used in conjunction with event emissions to
set fact values during runtime, effectively enabling _rule-chaining_.  Note that ordering
of rule execution is enabled via the `priority` option, and is crucial component to propertly
configuring rule chaining.

```js
engine.addRule({
  conditions,
  event,
  onSuccess: function (event, almanac) {
    almanac.addRuntimeFact('rule-1-passed', true) // track that the rule passed
  },
  onFailure: function (event, almanac) {
    almanac.addRuntimeFact('rule-1-passed', false) // track that the rule failed
  },
  priority: 10 // a higher priority ensures this rule will be run prior to subsequent rules
})

// in a later rule:
engine.addRule({
  conditions: {
    all: [{
      fact: 'rule-1-passed',
      operator: 'equal',
      value: true
    }
  },
  priority: 1 // lower priority ensures this is run AFTER its predecessor
}
```

See the [full example](../examples/07-rule-chaining.js)
