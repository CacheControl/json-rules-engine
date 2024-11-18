import Condition from "./condition.mjs";
import RuleResult from "./rule-result.mjs";
import debug from "./debug.mjs";
import deepClone from "clone";
import EventEmitter from "eventemitter2";

class Rule extends EventEmitter {
  /**
   * returns a new Rule instance
   * @param {object,string} options, or json string that can be parsed into options
   * @param {integer} options.priority (>1) - higher runs sooner.
   * @param {Object} options.event - event to fire when rule evaluates as successful
   * @param {string} options.event.type - name of event to emit
   * @param {string} options.event.params - parameters to pass to the event listener
   * @param {Object} options.conditions - conditions to evaluate when processing this rule
   * @param {any} options.name - identifier for a particular rule, particularly valuable in RuleResult output
   * @return {Rule} instance
   */
  constructor(options) {
    super();
    if (typeof options === "string") {
      options = JSON.parse(options);
    }
    if (options && options.conditions) {
      this.setConditions(options.conditions);
    }
    if (options && options.onSuccess) {
      this.on("success", options.onSuccess);
    }
    if (options && options.onFailure) {
      this.on("failure", options.onFailure);
    }
    if (options && (options.name || options.name === 0)) {
      this.setName(options.name);
    }

    const priority = (options && options.priority) || 1;
    this.setPriority(priority);

    const event = (options && options.event) || { type: "unknown" };
    this.setEvent(event);
  }

  /**
   * Sets the priority of the rule
   * @param {integer} priority (>=1) - increasing the priority causes the rule to be run prior to other rules
   */
  setPriority(priority) {
    priority = parseInt(priority, 10);
    if (priority <= 0) throw new Error("Priority must be greater than zero");
    this.priority = priority;
    return this;
  }

  /**
   * Sets the name of the rule
   * @param {any} name - any truthy input and zero is allowed
   */
  setName(name) {
    if (!name && name !== 0) {
      throw new Error('Rule "name" must be defined');
    }
    this.name = name;
    return this;
  }

  /**
   * Sets the conditions to run when evaluating the rule.
   * @param {object} conditions - conditions, root element must be a boolean operator
   */
  setConditions(conditions) {
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
    this.conditions = new Condition(conditions);
    return this;
  }

  /**
   * Sets the event to emit when the conditions evaluate truthy
   * @param {object} event - event to emit
   * @param {string} event.type - event name to emit on
   * @param {string} event.params - parameters to emit as the argument of the event emission
   */
  setEvent(event) {
    if (!event) throw new Error("Rule: setEvent() requires event object");
    if (!Object.prototype.hasOwnProperty.call(event, "type")) {
      throw new Error(
        'Rule: setEvent() requires event object with "type" property',
      );
    }
    this.ruleEvent = {
      type: event.type,
    };
    if (event.params) this.ruleEvent.params = event.params;
    return this;
  }

  /**
   * returns the event object
   * @returns {Object} event
   */
  getEvent() {
    return this.ruleEvent;
  }

  /**
   * returns the priority
   * @returns {Number} priority
   */
  getPriority() {
    return this.priority;
  }

  /**
   * returns the event object
   * @returns {Object} event
   */
  getConditions() {
    return this.conditions;
  }

  /**
   * returns the engine object
   * @returns {Object} engine
   */
  getEngine() {
    return this.engine;
  }

  /**
   * Sets the engine to run the rules under
   * @param {object} engine
   * @returns {Rule}
   */
  setEngine(engine) {
    this.engine = engine;
    return this;
  }

  toJSON(stringify = true) {
    const props = {
      conditions: this.conditions.toJSON(false),
      priority: this.priority,
      event: this.ruleEvent,
      name: this.name,
    };
    if (stringify) {
      return JSON.stringify(props);
    }
    return props;
  }

  /**
   * Priorizes an array of conditions based on "priority"
   *   When no explicit priority is provided on the condition itself, the condition's priority is determine by its fact
   * @param  {Condition[]} conditions
   * @return {Condition[][]} prioritized two-dimensional array of conditions
   *    Each outer array element represents a single priority(integer).  Inner array is
   *    all conditions with that priority.
   */
  prioritizeConditions(conditions) {
    const factSets = conditions.reduce((sets, condition) => {
      // if a priority has been set on this specific condition, honor that first
      // otherwise, use the fact's priority
      let priority = condition.priority;
      if (!priority) {
        const fact = this.engine.getFact(condition.fact);
        priority = (fact && fact.priority) || 1;
      }
      if (!sets[priority]) sets[priority] = [];
      sets[priority].push(condition);
      return sets;
    }, {});
    return Object.keys(factSets)
      .sort((a, b) => {
        return Number(a) > Number(b) ? -1 : 1; // order highest priority -> lowest
      })
      .map((priority) => factSets[priority]);
  }

  /**
   * Evaluates the rule, starting with the root boolean operator and recursing down
   * All evaluation is done within the context of an almanac
   * @return {Promise(RuleResult)} rule evaluation result
   */
  evaluate(almanac) {
    const ruleResult = new RuleResult(
      this.conditions,
      this.ruleEvent,
      this.priority,
      this.name,
    );

    /**
     * Evaluates the rule conditions
     * @param  {Condition} condition - condition to evaluate
     * @return {Promise(true|false)} - resolves with the result of the condition evaluation
     */
    const evaluateCondition = (condition) => {
      if (condition.isConditionReference()) {
        return realize(condition);
      } else if (condition.isBooleanOperator()) {
        const subConditions = condition[condition.operator];
        let comparisonPromise;
        if (condition.operator === "all") {
          comparisonPromise = all(subConditions);
        } else if (condition.operator === "any") {
          comparisonPromise = any(subConditions);
        } else {
          comparisonPromise = not(subConditions);
        }
        // for booleans, rule passing is determined by the all/any/not result
        return comparisonPromise.then((comparisonValue) => {
          const passes = comparisonValue === true;
          condition.result = passes;
          return passes;
        });
      } else {
        return condition
          .evaluate(almanac, this.engine.operators)
          .then((evaluationResult) => {
            const passes = evaluationResult.result;
            condition.factResult = evaluationResult.leftHandSideValue;
            condition.valueResult = evaluationResult.rightHandSideValue;
            condition.result = passes;
            return passes;
          });
      }
    };

    /**
     * Evalutes an array of conditions, using an 'every' or 'some' array operation
     * @param  {Condition[]} conditions
     * @param  {string(every|some)} array method to call for determining result
     * @return {Promise(boolean)} whether conditions evaluated truthy or falsey based on condition evaluation + method
     */
    const evaluateConditions = (conditions, method) => {
      if (!Array.isArray(conditions)) conditions = [conditions];

      return Promise.all(
        conditions.map((condition) => evaluateCondition(condition)),
      ).then((conditionResults) => {
        debug("rule::evaluateConditions", { results: conditionResults });
        return method.call(conditionResults, (result) => result === true);
      });
    };

    /**
     * Evaluates a set of conditions based on an 'all', 'any', or 'not' operator.
     *   First, orders the top level conditions based on priority
     *   Iterates over each priority set, evaluating each condition
     *   If any condition results in the rule to be guaranteed truthy or falsey,
     *   it will short-circuit and not bother evaluating any additional rules
     * @param  {Condition[]} conditions - conditions to be evaluated
     * @param  {string('all'|'any'|'not')} operator
     * @return {Promise(boolean)} rule evaluation result
     */
    const prioritizeAndRun = (conditions, operator) => {
      if (conditions.length === 0) {
        return Promise.resolve(true);
      }
      if (conditions.length === 1) {
        // no prioritizing is necessary, just evaluate the single condition
        // 'all' and 'any' will give the same results with a single condition so no method is necessary
        // this also covers the 'not' case which should only ever have a single condition
        return evaluateCondition(conditions[0]);
      }
      const orderedSets = this.prioritizeConditions(conditions);
      let cursor = Promise.resolve(operator === "all");
      // use for() loop over Array.forEach to support IE8 without polyfill
      for (let i = 0; i < orderedSets.length; i++) {
        const set = orderedSets[i];
        cursor = cursor.then((setResult) => {
          // rely on the short-circuiting behavior of || and && to avoid evaluating subsequent conditions
          return operator === "any"
            ? setResult || evaluateConditions(set, Array.prototype.some)
            : setResult && evaluateConditions(set, Array.prototype.every);
        });
      }
      return cursor;
    };

    /**
     * Runs an 'any' boolean operator on an array of conditions
     * @param  {Condition[]} conditions to be evaluated
     * @return {Promise(boolean)} condition evaluation result
     */
    const any = (conditions) => {
      return prioritizeAndRun(conditions, "any");
    };

    /**
     * Runs an 'all' boolean operator on an array of conditions
     * @param  {Condition[]} conditions to be evaluated
     * @return {Promise(boolean)} condition evaluation result
     */
    const all = (conditions) => {
      return prioritizeAndRun(conditions, "all");
    };

    /**
     * Runs a 'not' boolean operator on a single condition
     * @param  {Condition} condition to be evaluated
     * @return {Promise(boolean)} condition evaluation result
     */
    const not = (condition) => {
      return prioritizeAndRun([condition], "not").then((result) => !result);
    };

    /**
     * Dereferences the condition reference and then evaluates it.
     * @param {Condition} conditionReference
     * @returns {Promise(boolean)} condition evaluation result
     */
    const realize = (conditionReference) => {
      const condition = this.engine.conditions.get(
        conditionReference.condition,
      );
      if (!condition) {
        if (this.engine.allowUndefinedConditions) {
          // undefined conditions always fail
          conditionReference.result = false;
          return Promise.resolve(false);
        } else {
          throw new Error(
            `No condition ${conditionReference.condition} exists`,
          );
        }
      } else {
        // project the referenced condition onto reference object and evaluate it.
        delete conditionReference.condition;
        Object.assign(conditionReference, deepClone(condition));
        return evaluateCondition(conditionReference);
      }
    };

    /**
     * Emits based on rule evaluation result, and decorates ruleResult with 'result' property
     * @param {RuleResult} ruleResult
     */
    const processResult = (result) => {
      ruleResult.setResult(result);
      let processEvent = Promise.resolve();
      if (this.engine.replaceFactsInEventParams) {
        processEvent = ruleResult.resolveEventParams(almanac);
      }
      const event = result ? "success" : "failure";
      return processEvent
        .then(() =>
          this.emitAsync(event, ruleResult.event, almanac, ruleResult),
        )
        .then(() => ruleResult);
    };

    if (ruleResult.conditions.any) {
      return any(ruleResult.conditions.any).then((result) =>
        processResult(result),
      );
    } else if (ruleResult.conditions.all) {
      return all(ruleResult.conditions.all).then((result) =>
        processResult(result),
      );
    } else if (ruleResult.conditions.not) {
      return not(ruleResult.conditions.not).then((result) =>
        processResult(result),
      );
    } else {
      return realize(ruleResult.conditions).then((result) =>
        processResult(result),
      );
    }
  }
}

export default Rule;
