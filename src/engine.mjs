import Fact from "./fact.mjs";
import Rule from "./rule.mjs";
import Almanac from "./almanac.mjs";
import EventEmitter from "eventemitter2";
import defaultOperators from "./engine-default-operators.mjs";
import defaultDecorators from "./engine-default-operator-decorators.mjs";
import debug from "./debug.mjs";
import Condition from "./condition.mjs";
import OperatorMap from "./operator-map.mjs";

export const READY = "READY";
export const RUNNING = "RUNNING";
export const FINISHED = "FINISHED";

class Engine extends EventEmitter {
  /**
   * Returns a new Engine instance
   * @param  {Rule[]} rules - array of rules to initialize with
   */
  constructor(rules = [], options = {}) {
    super();
    this.rules = [];
    this.allowUndefinedFacts = options.allowUndefinedFacts || false;
    this.allowUndefinedConditions = options.allowUndefinedConditions || false;
    this.replaceFactsInEventParams = options.replaceFactsInEventParams || false;
    this.pathResolver = options.pathResolver;
    this.operators = new OperatorMap();
    this.facts = new Map();
    this.conditions = new Map();
    this.status = READY;
    rules.map((r) => this.addRule(r));
    defaultOperators.map((o) => this.addOperator(o));
    defaultDecorators.map((d) => this.addOperatorDecorator(d));
  }

  /**
   * Add a rule definition to the engine
   * @param {object|Rule} properties - rule definition.  can be JSON representation, or instance of Rule
   * @param {integer} properties.priority (>1) - higher runs sooner.
   * @param {Object} properties.event - event to fire when rule evaluates as successful
   * @param {string} properties.event.type - name of event to emit
   * @param {string} properties.event.params - parameters to pass to the event listener
   * @param {Object} properties.conditions - conditions to evaluate when processing this rule
   */
  addRule(properties) {
    if (!properties) throw new Error("Engine: addRule() requires options");

    let rule;
    if (properties instanceof Rule) {
      rule = properties;
    } else {
      if (!Object.prototype.hasOwnProperty.call(properties, "event"))
        throw new Error('Engine: addRule() argument requires "event" property');
      if (!Object.prototype.hasOwnProperty.call(properties, "conditions"))
        throw new Error(
          'Engine: addRule() argument requires "conditions" property',
        );
      rule = new Rule(properties);
    }
    rule.setEngine(this);
    this.rules.push(rule);
    this.prioritizedRules = null;
    return this;
  }

  /**
   * update a rule in the engine
   * @param {object|Rule} rule - rule definition. Must be a instance of Rule
   */
  updateRule(rule) {
    const ruleIndex = this.rules.findIndex(
      (ruleInEngine) => ruleInEngine.name === rule.name,
    );
    if (ruleIndex > -1) {
      this.rules.splice(ruleIndex, 1);
      this.addRule(rule);
      this.prioritizedRules = null;
    } else {
      throw new Error("Engine: updateRule() rule not found");
    }
  }

  /**
   * Remove a rule from the engine
   * @param {object|Rule|string} rule - rule definition. Must be a instance of Rule
   */
  removeRule(rule) {
    let ruleRemoved = false;
    if (!(rule instanceof Rule)) {
      const filteredRules = this.rules.filter(
        (ruleInEngine) => ruleInEngine.name !== rule,
      );
      ruleRemoved = filteredRules.length !== this.rules.length;
      this.rules = filteredRules;
    } else {
      const index = this.rules.indexOf(rule);
      if (index > -1) {
        ruleRemoved = Boolean(this.rules.splice(index, 1).length);
      }
    }
    if (ruleRemoved) {
      this.prioritizedRules = null;
    }
    return ruleRemoved;
  }

  /**
   * sets a condition that can be referenced by the given name.
   * If a condition with the given name has already been set this will replace it.
   * @param {string} name - the name of the condition to be referenced by rules.
   * @param {object} conditions - the conditions to use when the condition is referenced.
   */
  setCondition(name, conditions) {
    if (!name) throw new Error("Engine: setCondition() requires name");
    if (!conditions)
      throw new Error("Engine: setCondition() requires conditions");
    if (
      !Object.prototype.hasOwnProperty.call(conditions, "all") &&
      !Object.prototype.hasOwnProperty.call(conditions, "any") &&
      !Object.prototype.hasOwnProperty.call(conditions, "not") &&
      !Object.prototype.hasOwnProperty.call(conditions, "condition")
    ) {
      throw new Error(
        '"conditions" root must contain a single instance of "all", "any", "not", or "condition"',
      );
    }
    this.conditions.set(name, new Condition(conditions));
    return this;
  }

  /**
   * Removes a condition that has previously been added to this engine
   * @param {string} name - the name of the condition to remove.
   * @returns true if the condition existed, otherwise false
   */
  removeCondition(name) {
    return this.conditions.delete(name);
  }

  /**
   * Add a custom operator definition
   * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   * @param {function(factValue, jsonValue)} callback - the method to execute when the operator is encountered.
   */
  addOperator(operatorOrName, cb) {
    this.operators.addOperator(operatorOrName, cb);
  }

  /**
   * Remove a custom operator definition
   * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   */
  removeOperator(operatorOrName) {
    return this.operators.removeOperator(operatorOrName);
  }

  /**
   * Add a custom operator decorator
   * @param {string}   decoratorOrName - decorator identifier within the condition; i.e. instead of 'someFact', 'everyValue', etc
   * @param {function(factValue, jsonValue, next)} callback - the method to execute when the decorator is encountered.
   */
  addOperatorDecorator(decoratorOrName, cb) {
    this.operators.addOperatorDecorator(decoratorOrName, cb);
  }

  /**
   * Remove a custom operator decorator
   * @param {string}   decoratorOrName - decorator identifier within the condition; i.e. instead of 'someFact', 'everyValue', etc
   */
  removeOperatorDecorator(decoratorOrName) {
    return this.operators.removeOperatorDecorator(decoratorOrName);
  }

  /**
   * Add a fact definition to the engine.  Facts are called by rules as they are evaluated.
   * @param {object|Fact} id - fact identifier or instance of Fact
   * @param {function} definitionFunc - function to be called when computing the fact value for a given rule
   * @param {Object} options - options to initialize the fact with. used when "id" is not a Fact instance
   */
  addFact(id, valueOrMethod, options) {
    let factId = id;
    let fact;
    if (id instanceof Fact) {
      factId = id.id;
      fact = id;
    } else {
      fact = new Fact(id, valueOrMethod, options);
    }
    debug("engine::addFact", { id: factId });
    this.facts.set(factId, fact);
    return this;
  }

  /**
   * Remove a fact definition to the engine.  Facts are called by rules as they are evaluated.
   * @param {object|Fact} id - fact identifier or instance of Fact
   */
  removeFact(factOrId) {
    let factId;
    if (!(factOrId instanceof Fact)) {
      factId = factOrId;
    } else {
      factId = factOrId.id;
    }

    return this.facts.delete(factId);
  }

  /**
   * Iterates over the engine rules, organizing them by highest -> lowest priority
   * @return {Rule[][]} two dimensional array of Rules.
   *    Each outer array element represents a single priority(integer).  Inner array is
   *    all rules with that priority.
   */
  prioritizeRules() {
    if (!this.prioritizedRules) {
      const ruleSets = this.rules.reduce((sets, rule) => {
        const priority = rule.priority;
        if (!sets[priority]) sets[priority] = [];
        sets[priority].push(rule);
        return sets;
      }, {});
      this.prioritizedRules = Object.keys(ruleSets)
        .sort((a, b) => {
          return Number(a) > Number(b) ? -1 : 1; // order highest priority -> lowest
        })
        .map((priority) => ruleSets[priority]);
    }
    return this.prioritizedRules;
  }

  /**
   * Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
   * and no further events emitted.  Since rules of the same priority are evaluated in parallel(not series), other rules of
   * the same priority may still emit events, even though the engine is in a "finished" state.
   * @return {Engine}
   */
  stop() {
    this.status = FINISHED;
    return this;
  }

  /**
   * Returns a fact by fact-id
   * @param  {string} factId - fact identifier
   * @return {Fact} fact instance, or undefined if no such fact exists
   */
  getFact(factId) {
    return this.facts.get(factId);
  }

  /**
   * Runs an array of rules
   * @param  {Rule[]} array of rules to be evaluated
   * @return {Promise} resolves when all rules in the array have been evaluated
   */
  evaluateRules(ruleArray, almanac) {
    return Promise.all(
      ruleArray.map((rule) => {
        if (this.status !== RUNNING) {
          debug("engine::run, skipping remaining rules", {
            status: this.status,
          });
          return Promise.resolve();
        }
        return rule.evaluate(almanac).then((ruleResult) => {
          debug("engine::run", { ruleResult: ruleResult.result });
          almanac.addResult(ruleResult);
          if (ruleResult.result) {
            almanac.addEvent(ruleResult.event, "success");
            return this.emitAsync(
              "success",
              ruleResult.event,
              almanac,
              ruleResult,
            ).then(() =>
              this.emitAsync(
                ruleResult.event.type,
                ruleResult.event.params,
                almanac,
                ruleResult,
              ),
            );
          } else {
            almanac.addEvent(ruleResult.event, "failure");
            return this.emitAsync(
              "failure",
              ruleResult.event,
              almanac,
              ruleResult,
            );
          }
        });
      }),
    );
  }

  /**
   * Runs the rules engine
   * @param  {Object} runtimeFacts - fact values known at runtime
   * @param  {Object} runOptions - run options
   * @return {Promise} resolves when the engine has completed running
   */
  run(runtimeFacts = {}, runOptions = {}) {
    debug("engine::run started");
    this.status = RUNNING;

    const almanac =
      runOptions.almanac ||
      new Almanac({
        allowUndefinedFacts: this.allowUndefinedFacts,
        pathResolver: this.pathResolver,
      });

    this.facts.forEach((fact) => {
      almanac.addFact(fact);
    });
    for (const factId in runtimeFacts) {
      let fact;
      if (runtimeFacts[factId] instanceof Fact) {
        fact = runtimeFacts[factId];
      } else {
        fact = new Fact(factId, runtimeFacts[factId]);
      }

      almanac.addFact(fact);
      debug("engine::run initialized runtime fact", {
        id: fact.id,
        value: fact.value,
        type: typeof fact.value,
      });
    }
    const orderedSets = this.prioritizeRules();
    let cursor = Promise.resolve();
    // for each rule set, evaluate in parallel,
    // before proceeding to the next priority set.
    return new Promise((resolve, reject) => {
      orderedSets.map((set) => {
        cursor = cursor
          .then(() => {
            return this.evaluateRules(set, almanac);
          })
          .catch(reject);
        return cursor;
      });
      cursor
        .then(() => {
          this.status = FINISHED;
          debug("engine::run completed");
          const ruleResults = almanac.getResults();
          const { results, failureResults } = ruleResults.reduce(
            (hash, ruleResult) => {
              const group = ruleResult.result ? "results" : "failureResults";
              hash[group].push(ruleResult);
              return hash;
            },
            { results: [], failureResults: [] },
          );

          resolve({
            almanac,
            results,
            failureResults,
            events: almanac.getEvents("success"),
            failureEvents: almanac.getEvents("failure"),
          });
        })
        .catch(reject);
    });
  }
}

export default Engine;
