import {
  conditionFactory,
  TopLevelConditionInstance,
  type TopLevelConditionResult,
  type TopLevelCondition,
} from "./condition/index.mjs";
import { EventEmitter, type Event, type EventHandler } from "./events.mjs";
import { NeverCondition } from "./condition/never.mjs";
import type { Almanac } from "./almanac.mjs";
import type { OperatorMap } from "./operator-map.mjs";
import type { ConditionMap } from "./condition/reference.mjs";

export interface RuleResult {
  readonly name?: string;
  readonly conditions: TopLevelConditionResult;
  readonly event: Event;
  readonly priority: number;
  readonly result: boolean;
}

export interface RuleProperties {
  conditions: TopLevelCondition;
  event: Event;
  name?: string;
  priority?: number;
  onSuccess?: EventHandler;
  onFailure?: EventHandler;
}

export class Rule extends EventEmitter {
  #name?: string;
  #priority: number = 1;
  #condition: TopLevelConditionInstance = NeverCondition;
  #event: Event = { type: "unknown" };

  /**
   * returns a new Rule instance
   * @param  options, Rule Properties or json string that can be parsed into options
   * @param {integer} options.priority (>1) - higher runs sooner.
   * @param {Object} options.event - event to fire when rule evaluates as successful
   * @param {string} options.event.type - name of event to emit
   * @param {string} options.event.params - parameters to pass to the event listener
   * @param {Object} options.conditions - conditions to evaluate when processing this rule
   * @param {any} options.name - identifier for a particular rule, particularly valuable in RuleResult output
   */
  constructor(options?: string | RuleProperties) {
    super();
    if (typeof options === "string") {
      options = JSON.parse(options) as RuleProperties;
    }
    if (options) {
      if (options.conditions) {
        this.conditions = options.conditions;
      }
      if (options.onSuccess) {
        this.on("success", options.onSuccess);
      }
      if (options.onFailure) {
        this.on("failure", options.onFailure);
      }
      if (options.name) {
        this.name = options.name;
      }
      if (options.priority) {
        this.priority = options.priority;
      }
      if (options.event) {
        this.event = options.event;
      }
    }
  }

  get name(): string | undefined {
    return this.#name;
  }

  /**
   * Sets the name of the rule
   */
  set name(name: string) {
    if (!name) {
      throw new Error('Rule "name" must be defined');
    }
    this.#name = name;
  }

  get priority(): number {
    return this.#priority;
  }

  /**
   * Sets the priority of the rule
   * @param {integer} priority (>=1) - increasing the priority causes the rule to be run prior to other rules
   */
  set priority(priority: number) {
    priority = parseInt(priority as unknown as string, 10);
    if (priority <= 0) throw new Error("Priority must be greater than zero");
    this.#priority = priority;
  }

  /**
   * returns the event object
   */
  get conditions(): TopLevelCondition {
    return this.#condition.toJSON();
  }

  /**
   * Sets the conditions to run when evaluating the rule.
   */
  set conditions(conditions: TopLevelCondition) {
    this.#condition = conditionFactory(conditions);
  }

  /**
   * returns the event object
   * @returns event
   */
  get event(): Event {
    return this.#event;
  }

  /**
   * Sets the event to emit when the conditions evaluate truthy
   * @param event - event to emit
   */
  set event(event: Event) {
    if (!event) throw new Error("Rule: event requires event object");
    if (!("type" in event)) {
      throw new Error('Rule: event requires event object with "type" property');
    }
    this.#event = {
      type: event.type,
    };
    if (event.params) this.#event.params = event.params;
  }

  toJSON(): Omit<RuleProperties, "onSuccess" | "onFailure"> {
    return {
      conditions: this.conditions!,
      priority: this.priority,
      event: this.#event,
      name: this.name,
    };
  }

  /**
   * Evaluates the rule, starting with the root boolean operator and recursing down
   * All evaluation is done within the context of an almanac
   * @return {Promise(RuleResult)} rule evaluation result
   */
  async evaluate(
    almanac: Almanac,
    operatorMap: OperatorMap,
    conditionMap: ConditionMap,
    eventProcessor: (event: Event) => Promise<Event>,
  ): Promise<RuleResult> {
    const conditions = await this.#condition.evaluate(
      almanac,
      operatorMap,
      conditionMap,
    );

    const ruleResult: RuleResult = {
      conditions,
      priority: this.priority,
      name: this.name,
      event: await eventProcessor(this.event),
      result: conditions.result,
    };

    almanac.addResult(ruleResult);

    const event = ruleResult.result ? "success" : "failure";
    almanac.addEvent(ruleResult.event, event);

    await this.emit(event, ruleResult.event, almanac, ruleResult);

    return ruleResult;
  }
}
