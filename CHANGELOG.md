#### 6.1.0 / 2021-06-03
  * engine.removeRule() now supports removing rules by name
  * Added engine.updateRule(rule)

#### 6.0.1 / 2021-03-09
  * Updates Typescript types to include `failureEvents` in EngineResult.

#### 6.0.0 / 2020-12-22
  * BREAKING CHANGES
    * To continue using [selectn](https://github.com/wilmoore/selectn.js) syntax for condition `path`s, use the new `pathResolver` feature. Read more [here](./docs/rules.md#condition-helpers-custom-path-resolver). Add the following to the engine constructor:
      ```js
      const pathResolver = (object, path) => {
        return selectn(path)(object)
      }
      const engine = new Engine(rules, { pathResolver })
      ```
      (fixes #205)
    * Engine and Rule events `on('success')`, `on('failure')`, and Rule callbacks `onSuccess` and `onFailure` now honor returned promises; any event handler that returns a promise will be waited upon to resolve before engine execution continues. (fixes #235)
    * Private `rule.event` property renamed. Use `rule.getEvent()` to avoid breaking changes in the future.
    * The `success-events` fact used to store successful events has been converted to an internal data structure and will no longer appear in the almanac's facts. (fixes #187)
  * NEW FEATURES
    * Engine constructor now accepts a `pathResolver` option for resolving condition `path` properties. Read more [here](./docs/rules.md#condition-helpers-custom-path-resolver). (fixes #210)
    * Engine.run() now returns three additional data structures:
      * `failureEvents`, an array of all failed rules events. (fixes #192)
      * `results`, an array of RuleResults for each successful rule (fixes #216)
      * `failureResults`, an array of RuleResults for each failed rule


#### 5.3.0 / 2020-12-02
  * Allow facts to have a value of `undefined`

#### 5.2.0 / 2020-11-31
  * No changes; published to correct an accidental publish of untagged alpha

#### 5.0.4 / 2020-09-26
  * Upgrade dependencies to latest

#### 5.0.3 / 2020-01-26
  * Upgrade jsonpath-plus dependency, to fix inconsistent scalar results (#175)

#### 5.0.2 / 2020-01-18
* BUGFIX: Add missing `DEBUG` log for almanac.addRuntimeFact()

#### 5.0.1 / 2020-01-18
* BUGFIX: `DEBUG` envs works with cookies disables

#### 5.0.0 / 2019-11-29
  * BREAKING CHANGES
    * Rule conditions' `path` property is now interpreted using [json-path](https://goessner.net/articles/JsonPath/)
      * To continue using the old syntax (provided via [selectn](https://github.com/wilmoore/selectn.js)), `npm install selectn` as a direct dependency, and `json-rules-engine` will continue to interpret legacy paths this way.
      * Any path starting with `$` will be assumed to use `json-path` syntax

#### 4.1.0 / 2019-09-27
  * Export Typescript definitions (@brianphillips)

#### 4.0.0 / 2019-08-22
  * BREAKING CHANGES
    * `engine.run()` now returns a hash of events and almanac: `{ events: [], almanac: Almanac instance }`. Previously in v3, the `run()` returned the `events` array.
       *  For example, `const events = await engine.run()` under v3 will need to be changed to `const { events } = await engine.run()` under v4.

#### 3.1.0 / 2019-07-19
  * Feature: `rule.setName()` and `ruleResult.name`

#### 3.0.3 / 2019-07-15
  * Fix "localStorage.debug" not working in browsers

#### 3.0.2 / 2019-05-23
  * Fix "process" not defined error in browsers lacking node.js global shims

#### 3.0.0 / 2019-05-17
  * BREAKING CHANGES
    * Previously all conditions with undefined facts would resolve false. With this change, undefined facts values are treated as `undefined`.
  * Greatly improved performance of `allowUndefinedfacts = true` engine option
  * Reduce package bundle size by ~40%

#### 2.3.5 / 2019-04-26
  * Replace debug with vanilla console.log

#### 2.3.4 / 2019-04-26
  * Use Array.isArray instead of instanceof to test Array parameters to address edge cases

#### 2.3.3 / 2019-04-23
  * Fix rules cache not clearing after removeRule()

#### 2.3.2 / 2018-12-28
  * Upgrade all dependencies to latest

#### 2.3.1 / 2018-12-03
  * IE8 compatibility: replace Array.forEach with for loop (@knalbandianbrightgrove)

#### 2.3.0 / 2018-05-03
  * Engine.removeFact() - removes fact from the engine (@SaschaDeWaal)
  * Engine.removeRule() - removes rule from the engine (@SaschaDeWaal)
  * Engine.removeOperator() - removes operator from the engine (@SaschaDeWaal)

#### 2.2.0 / 2018-04-19
  * Performance: Constant facts now perform 18-26X better
  * Performance: Removes await/async transpilation and json.stringify calls, significantly improving overall performance

#### 2.1.0 / 2018-02-19
  * Publish dist updates for 2.0.3

#### 2.0.3 / 2018-01-29
  * Add factResult and result to the JSON generated for Condition (@bjacobso)

#### 2.0.2 / 2017-07-24
  * Bugfix IE8 support

#### 2.0.1 / 2017-07-05
  * Bugfix rule result serialization

#### 2.0.0 / 2017-04-21
  * Publishing 2.0.0

#### 2.0.0-beta2 / 2017-04-10
  * Fix fact path object checking to work with objects that have prototypes (lodash isObjectLike instead of isPlainObject)

#### 2.0.0-beta1 / 2017-04-09
  * Add rule results
  * Document fact .path ability to parse properties containing dots
  * Bump dependencies
  * BREAKING CHANGES
    * `engine.on('failure', (rule, almanac))` is now `engine.on('failure', (event, almanac, ruleResult))`
    * `engine.on(eventType, (eventParams, engine))` is now `engine.on(eventType, (eventParams, almanac, ruleResult))`

#### 1.5.1 / 2017-03-19
  * Bugfix almanac.factValue skipping interpreting condition "path" for cached facts

#### 1.5.0 / 2017-03-12
  * Add fact comparison conditions

#### 1.4.0 / 2017-01-23
  * Add `allowUndefinedFacts` engine option

#### 1.3.1 / 2017-01-16
  * Bump object-hash dependency to latest

#### 1.3.0 / 2016-10-24
  * Rule event emissions
  * Rule chaining

#### 1.2.1 / 2016-10-22
  * Use Array.indexOf instead of Array.includes for older node version compatibility

#### 1.2.0 / 2016-09-13
  * Fact path support

#### 1.1.0 / 2016-09-11
  * Custom operator support

#### 1.0.4 / 2016-06-18
  * fix issue #6; runtime facts unique to each run()

#### 1.0.3 / 2016-06-15
  * fix issue #5; dependency error babel-core/register

#### 1.0.0 / 2016-05-01
  * api stable; releasing 1.0
  * engine.run() now returns triggered events

#### 1.0.0-beta10 / 2016-04-16
  * Completed the 'fact-dependecy' advanced example
  * Updated addFact and addRule engine methods to return 'this' for easy chaining

#### 1.0.0-beta9 / 2016-04-11
  * Completed the 'basic' example
  * [BREAKING CHANGE] update engine.on('success') and engine.on('failure') to pass the current almanac instance as the second argument, rather than the engine
