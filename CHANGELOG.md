1.5.1 / 2017-03-19
==================

  * Bugfix almanac.factValue skipping interpreting condition "path" for cached facts

1.5.0 / 2017-03-12
==================

  * Add fact comparison conditions

1.4.0 / 2017-01-23
==================

  * Add `allowUndefinedFacts` engine option

1.3.1 / 2017-01-16
==================

  * Bump object-hash dependency to latest

1.3.0 / 2016-10-24
==================

  * Rule event emissions
  * Rule chaining

1.2.1 / 2016-10-22
==================

  * Use Array.indexOf instead of Array.includes for older node version compatibility

1.2.0 / 2016-09-13
==================

  * Fact path support

1.1.0 / 2016-09-11
==================

  * Custom operator support

1.0.4 / 2016-06-18
==================

  * fix issue #6; runtime facts unique to each run()

1.0.3 / 2016-06-15
==================

  * fix issue #5; dependency error babel-core/register

1.0.0 / 2016-05-01
==================

  * api stable; releasing 1.0
  * engine.run() now returns triggered events

1.0.0-beta10 / 2016-04-16
==================

  * Completed the 'fact-dependecy' advanced example
  * Updated addFact and addRule engine methods to return 'this' for easy chaining

1.0.0-beta9 / 2016-04-11
==================

  * Completed the 'basic' example
  * [BREAKING CHANGE] update engine.on('success') and engine.on('failure') to pass the current almanac instance as the second argument, rather than the engine
