import { DynamicFactCallback, Fact, FactOptions } from "./fact.mjs";
import { Rule, RuleProperties, RuleResult } from "./rule.mjs";
import { Almanac, type AlmanacOptions } from "./almanac.mjs";
import defaultOperators from "./engine-default-operators.mjs";
import defaultDecorators from "./engine-default-operator-decorators.mjs";
import debug from "./debug.mjs";
import {
  conditionFactory,
  TopLevelCondition,
  type TopLevelConditionInstance,
} from "./condition/index.mjs";
import { OperatorMap } from "./operator-map.mjs";
import { EventEmitter, type Event } from "./events.mjs";
import { NeverCondition } from "./condition/never.mjs";
import {
  OperatorDecorator,
  OperatorDecoratorEvaluator,
} from "./operator-decorator.mjs";
import { Operator, OperatorEvaluator } from "./operator.mjs";

export interface EngineOptions extends AlmanacOptions {
  allowUndefinedConditions?: boolean;
  replaceFactsInEventParams?: boolean;
}

export interface RunOptions {
  almanac?: Almanac;
  signal?: AbortSignal;
}

export interface EngineResult {
  events: Event[];
  failureEvents: Event[];
  almanac: Almanac;
  results: RuleResult[];
  failureResults: RuleResult[];
}

class ConditionMap {
  #conditions = new Map<string, TopLevelConditionInstance>();
  #allowUndefinedConditions: boolean;

  constructor(allowUndefinedConditions: boolean) {
    this.#allowUndefinedConditions = allowUndefinedConditions;
  }

  setCondition(name: string, condition: TopLevelCondition): void {
    if (!name) throw new Error("Engine: setCondition() requires name");
    this.#conditions.set(name, conditionFactory(condition));
  }

  removeCondition(name: string): boolean {
    return this.#conditions.delete(name);
  }

  get(name: string): TopLevelConditionInstance {
    const condition = this.#conditions.get(name);
    if (!condition) {
      if (this.#allowUndefinedConditions) {
        return NeverCondition;
      }
      throw new Error(`No condition ${name} exists`);
    }
    return condition;
  }
}

export class Engine extends EventEmitter {
  readonly #conditions: ConditionMap;
  readonly #operators = new OperatorMap();
  readonly #facts = new Map<string, Fact>();
  readonly #rules: Rule[] = [];
  readonly #almanacOptions: AlmanacOptions;
  readonly #eventProcessor: (almanac: Almanac, event: Event) => Promise<Event>;

  /**
   * Returns a new Engine instance
   * @param  {Rule[]} rules - array of rules to initialize with
   */
  constructor(
    rules: (Rule | RuleProperties | string)[] = [],
    options: EngineOptions = {},
  ) {
    super();
    this.#conditions = new ConditionMap(
      options.allowUndefinedConditions ?? false,
    );
    this.#almanacOptions = {
      allowUndefinedFacts: options.allowUndefinedFacts,
      pathResolver: options.pathResolver,
    };
    this.#eventProcessor = options.replaceFactsInEventParams
      ? async (almanac: Almanac, event: Event) => {
          if (event.params !== null && typeof event.params === "object") {
            return {
              type: event.type,
              params: Object.fromEntries(
                await Promise.all(
                  Object.entries(event.params).map(async ([key, value]) => [
                    key,
                    await almanac.getValue(value),
                  ]),
                ),
              ),
            };
          }
          return event;
        }
      : (_almanac: Almanac, event: Event) => Promise.resolve(event);
    rules.map((r) => this.addRule(r));
    defaultOperators.map((o) => this.addOperator(o as Operator));
    defaultDecorators.map((d) =>
      this.addOperatorDecorator(d as OperatorDecorator),
    );
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
  addRule(properties: string | Rule | RuleProperties) {
    if (!properties) throw new Error("Engine: addRule() requires options");

    const rule = properties instanceof Rule ? properties : new Rule(properties);
    this.#rules.push(rule);
    return this;
  }

  /**
   * update a rule in the engine
   * @param {object|Rule} rule - rule definition. Must be a instance of Rule
   */
  updateRule(properties: Rule | RuleProperties | string) {
    if (!properties) throw new Error("Engine: updateRule() requires options");
    const rule = properties instanceof Rule ? properties : new Rule(properties);
    const ruleIndex = this.#rules.findIndex(
      (ruleInEngine) => ruleInEngine.name === rule.name,
    );
    if (ruleIndex > -1) {
      this.#rules[ruleIndex] = rule;
    } else {
      throw new Error("Engine: updateRule() rule not found");
    }
  }

  /**
   * Remove a rule from the engine
   * @param {object|Rule|string} rule - rule definition. Must be a instance of Rule
   */
  removeRule(rule: string | { name?: string }) {
    const name = typeof rule === "string" ? rule : rule.name;
    if (name !== undefined) {
      const index = this.#rules.findIndex(
        (ruleInEngine) => ruleInEngine.name === name,
      );
      if (index >= 0) {
        this.#rules.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * sets a condition that can be referenced by the given name.
   * If a condition with the given name has already been set this will replace it.
   * @param {string} name - the name of the condition to be referenced by rules.
   * @param {object} conditions - the conditions to use when the condition is referenced.
   */
  setCondition(name: string, conditions: TopLevelCondition) {
    this.#conditions.setCondition(name, conditions);
    return this;
  }

  /**
   * Removes a condition that has previously been added to this engine
   * @param {string} name - the name of the condition to remove.
   * @returns true if the condition existed, otherwise false
   */
  removeCondition(name: string): boolean {
    return this.#conditions.removeCondition(name);
  }

  /**
   * Add a custom operator definition
   * @param operator - operator to add
   */
  addOperator<TFact, TValue>(operator: Operator<TFact, TValue>): void;
  /**
   * Add a custom operator definition
   * @param name - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   * @param callback - the method to execute when the operator is encountered.
   */
  addOperator<TFact, TValue>(
    name: string,
    callback: OperatorEvaluator<TFact, TValue>,
  ): void;
  addOperator<TFact, TValue>(
    operatorOrName: Operator<TFact, TValue> | string,
    cb?: OperatorEvaluator<TFact, TValue>,
  ): void {
    this.#operators.addOperator(operatorOrName as string, cb!);
  }

  /**
   * Remove a custom operator definition
   * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   */
  removeOperator<TFact, TValue>(
    operatorOrName: Operator<TFact, TValue> | string,
  ): boolean {
    return this.#operators.removeOperator(operatorOrName);
  }

  /**
   * Add a custom operator decorator
   * @param decorator - decorator to add
   */
  addOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    decorator: OperatorDecorator<TFact, TValue, TNextFact, TNextValue>,
  ): void;
  /**
   * Add a custom operator decorator
   * @param name - decorator identifier within the condition; i.e. instead of 'everyFact', 'someValue', etc
   * @param callback - the method to execute when the decorator is encountered.
   */
  addOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    name: string,
    callback: OperatorDecoratorEvaluator<TFact, TValue, TNextFact, TNextValue>,
  ): void;
  addOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    decoratorOrName:
      | OperatorDecorator<TFact, TValue, TNextFact, TNextValue>
      | string,
    cb?: OperatorDecoratorEvaluator<TFact, TValue, TNextFact, TNextValue>,
  ): void {
    this.#operators.addOperatorDecorator(decoratorOrName as string, cb!);
  }

  /**
   * Remove a custom operator decorator
   * @param {string}   decoratorOrName - decorator identifier within the condition; i.e. instead of 'someFact', 'everyValue', etc
   */
  removeOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    decoratorOrName:
      | OperatorDecorator<TFact, TValue, TNextFact, TNextValue>
      | string,
  ) {
    return this.#operators.removeOperatorDecorator(decoratorOrName);
  }

  /**
   * Add a fact definition to the engine.  Facts are called by rules as they are evaluated.
   * @param {object|Fact} id - fact identifier or instance of Fact
   * @param {function} definitionFunc - function to be called when computing the fact value for a given rule
   * @param {Object} options - options to initialize the fact with. used when "id" is not a Fact instance
   */
  addFact(fact: Fact): this;
  addFact<T>(
    id: string,
    valueOrMethod: T | DynamicFactCallback<T>,
    options?: FactOptions,
  ): this;
  addFact<T>(
    id: string | Fact<T>,
    valueOrMethod?: T | DynamicFactCallback,
    options?: FactOptions,
  ): this {
    const fact =
      typeof id === "string" ? new Fact(id, valueOrMethod!, options!) : id;
    debug("engine::addFact", { id: fact.id });
    this.#facts.set(fact.id, fact);
    return this;
  }

  /**
   * Remove a fact definition to the engine.  Facts are called by rules as they are evaluated.
   * @param {object|Fact} id - fact identifier or instance of Fact
   */
  removeFact(factOrId: string | Fact) {
    const factId = typeof factOrId === "string" ? factOrId : factOrId.id;

    return this.#facts.delete(factId);
  }

  /**
   * Returns a fact by fact-id
   * @param  {string} factId - fact identifier
   * @return {Fact} fact instance, or undefined if no such fact exists
   */
  getFact(factId: string): Fact | undefined {
    return this.#facts.get(factId);
  }

  /**
   * Runs the rules engine
   * @param  {Object} runtimeFacts - fact values known at runtime
   * @param  {Object} runOptions - run options
   * @return {Promise} resolves when the engine has completed running
   */
  async run(
    runtimeFacts: Record<string, unknown> = {},
    { almanac = new Almanac(this.#almanacOptions), signal }: RunOptions = {},
  ): Promise<EngineResult> {
    debug("engine::run started");

    this.#facts.forEach((fact) => {
      almanac.addFact(fact);
    });
    Object.entries(runtimeFacts).forEach(([factId, value]) => {
      const fact = value instanceof Fact ? value : new Fact(factId, value);
      almanac.addFact(fact);
      debug("engine::run initialized runtime fact", {
        id: fact.id,
        value: value,
        type: typeof value,
      });
    });

    const eventProcessor = this.#eventProcessor.bind(null, almanac);

    // sort rules in priority order
    const prioritizedRules = this.#rules
      .reduce((byPriority: Map<number, Rule[]>, rule: Rule) => {
        const priorityList = byPriority.get(rule.priority) ?? [];
        priorityList.push(rule);
        byPriority.set(rule.priority, priorityList);
        return byPriority;
      }, new Map<number, Rule[]>())
      .entries()
      .toArray()
      .sort(([a], [b]) => a - b)
      .map(([, rules]) => rules);

    const results: RuleResult[] = [];
    const failureResults: RuleResult[] = [];
    for (const ruleSet of prioritizedRules) {
      if (signal && signal.aborted) {
        debug("engine::run, skipping remaining rules");
        break;
      }
      await Promise.all(
        ruleSet.map(async (rule) => {
          const ruleResult = await rule.evaluate(
            almanac,
            this.#operators,
            this.#conditions,
            eventProcessor,
          );
          debug("engine::run", { ruleResult: ruleResult.result });
          await this.emit(
            ruleResult.result ? "success" : "failure",
            ruleResult.event,
            almanac,
            ruleResult,
          );
          if (ruleResult.result) {
            await this.emit(
              ruleResult.event.type,
              ruleResult.event.params,
              almanac,
              ruleResult,
            );
            results.push(ruleResult);
          } else {
            failureResults.push(ruleResult);
          }
        }),
      );
    }

    debug("engine::run completed");
    return {
      events: almanac.getEvents("success"),
      failureEvents: almanac.getEvents("failure"),
      almanac: almanac,
      results,
      failureResults,
    };
  }
}
