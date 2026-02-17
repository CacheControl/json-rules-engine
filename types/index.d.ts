export interface AlmanacOptions {
  allowUndefinedFacts?: boolean;
  pathResolver?: PathResolver;
}

export interface EngineOptions extends AlmanacOptions {
  allowUndefinedConditions?: boolean;
  replaceFactsInEventParams?: boolean;
}

export interface RunOptions {
  almanac?: Almanac;
}

export interface EngineResult {
  events: Event[];
  failureEvents: Event[];
  almanac: Almanac;
  results: RuleResult[];
  failureResults: RuleResult[];
}

export default function engineFactory(
  rules: Array<RuleProperties>,
  options?: EngineOptions
): Engine;

export class Engine {
  constructor(rules?: Array<RuleProperties>, options?: EngineOptions);

  addRule(rule: RuleProperties): this;
  removeRule(ruleOrName: Rule | string): boolean;
  updateRule(rule: Rule): void;

  setCondition(name: string, conditions: TopLevelCondition): this;
  removeCondition(name: string): boolean;

  addOperator(operator: Operator): void;
  addOperator<A, B>(
    operatorName: string,
    callback: OperatorEvaluator<A, B>
  ): void;
  removeOperator(operator: Operator | string): boolean;

  addOperatorDecorator(decorator: OperatorDecorator): void;
  addOperatorDecorator<A, B, NextA, NextB>(decoratorName: string, callback: OperatorDecoratorEvaluator<A, B, NextA, NextB>): void;
  removeOperatorDecorator(decorator: OperatorDecorator | string): boolean;

  addFact<T>(fact: Fact<T>): this;
  addFact<T>(
    id: string,
    valueCallback: DynamicFactCallback<T> | T,
    options?: FactOptions
  ): this;
  removeFact(factOrId: string | Fact): boolean;
  getFact<T>(factId: string): Fact<T>;

  on<T = Event>(eventName: string, handler: EventHandler<T>): this;

  run(facts?: Record<string, any>, runOptions?: RunOptions): Promise<EngineResult>;
  stop(): this;
}

export interface OperatorEvaluator<A, B> {
  (factValue: A, compareToValue: B): boolean;
}

export class Operator<A = unknown, B = unknown> {
  public name: string;
  constructor(
    name: string,
    evaluator: OperatorEvaluator<A, B>,
    validator?: (factValue: A) => boolean
  );
  evaluate(factValue: A, compareToValue: B): boolean;
}

export interface OperatorDecoratorEvaluator<A, B, NextA, NextB> {
  (factValue: A, compareToValue: B, next: OperatorEvaluator<NextA, NextB>): boolean
}

export class OperatorDecorator<A = unknown, B = unknown, NextA = unknown, NextB = unknown> {
  public name: string;
  constructor(
    name: string,
    evaluator: OperatorDecoratorEvaluator<A, B, NextA, NextB>,
    validator?: (factValue: A) => boolean
  )
}

export class Almanac {
  constructor(options?: AlmanacOptions);
  factValue<T>(
    factId: string,
    params?: Record<string, any>,
    path?: string
  ): Promise<T>;
  /**
   * Resolves a path - only valid in scoped context (ScopedAlmanac)
   * Throws error when called on regular Almanac to catch misuse of scoped conditions
   */
  resolvePath<T>(path: string): Promise<T>;
  addFact<T>(fact: Fact<T>): this;
  addFact<T>(
    id: string,
    valueCallback: DynamicFactCallback<T> | T,
    options?: FactOptions
  ): this;
  addRuntimeFact(factId: string, value: any): void;
}

/**
 * Scoped Almanac for nested condition evaluation
 * Wraps a parent almanac but prioritizes item properties for fact resolution
 */
export class ScopedAlmanac {
  constructor(parentAlmanac: Almanac, item: any);
  /**
   * Resolves a path directly on the current scoped item
   * Used by scoped conditions that have path but no fact
   */
  resolvePath<T>(path: string): Promise<T>;
  factValue<T>(
    factId: string,
    params?: Record<string, any>,
    path?: string
  ): Promise<T>;
  getValue<T>(value: any): Promise<T>;
}

export type FactOptions = {
  cache?: boolean;
  priority?: number;
};

export type DynamicFactCallback<T = unknown> = (
  params: Record<string, any>,
  almanac: Almanac
) => T;

export class Fact<T = unknown> {
  id: string;
  priority: number;
  options: FactOptions;
  value?: T;
  calculationMethod?: DynamicFactCallback<T>;

  constructor(
    id: string,
    value: T | DynamicFactCallback<T>,
    options?: FactOptions
  );
}

export interface Event {
  type: string;
  params?: Record<string, any>;
}

export type PathResolver = (value: object, path: string) => any;

export type EventHandler<T = Event> = (
  event: T,
  almanac: Almanac,
  ruleResult: RuleResult
) => void;

export interface RuleProperties {
  conditions: TopLevelCondition;
  event: Event;
  name?: string;
  priority?: number;
  onSuccess?: EventHandler;
  onFailure?: EventHandler;
}
export type RuleSerializable = Pick<
  Required<RuleProperties>,
  "conditions" | "event" | "name" | "priority"
>;

export type RuleResultSerializable = Pick<
  Required<RuleResult>,
  "name" | "event" | "priority" | "result"> & {
    conditions: TopLevelConditionResultSerializable
  }

export interface RuleResult {
  name: string;
  conditions: TopLevelConditionResult;
  event?: Event;
  priority?: number;
  result: any;
  toJSON(): string;
  toJSON<T extends boolean>(
    stringify: T
  ): T extends true ? string : RuleResultSerializable;
}

export class Rule implements RuleProperties {
  constructor(ruleProps: RuleProperties | string);
  name: string;
  readonly conditions: TopLevelCondition;
  /**
   * @deprecated Use {@link Rule.event} instead.
   */
  ruleEvent: Event;
  event: Event
  priority: number;
  setConditions(conditions: TopLevelCondition): this;
  setEvent(event: Event): this;
  setPriority(priority: number): this;
  toJSON(): string;
  toJSON<T extends boolean>(
    stringify: T
  ): T extends true ? string : RuleSerializable;
}

interface BooleanConditionResultProperties {
  result?: boolean
}

interface ConditionResultProperties extends BooleanConditionResultProperties {
  factResult?: unknown
  valueResult?: unknown
}

interface ConditionProperties {
  fact: string;
  operator: string;
  value: { fact: string } | any;
  path?: string;
  priority?: number;
  params?: Record<string, any>;
  name?: string;
}

/**
 * Scoped condition that evaluates a path directly on the current array item
 * Used inside nested conditions where the "fact" is implicitly the current array item
 * The path is resolved using JSONPath against the scoped item
 */
interface ScopedConditionProperties {
  path: string;
  operator: string;
  value: { path: string } | any;
  priority?: number;
  params?: Record<string, any>;
  name?: string;
}

interface ScopedConditionPropertiesResult extends ScopedConditionProperties, ConditionResultProperties {}

/**
 * Nested condition that evaluates conditions against array items
 * Uses the 'some' operator to check if at least one array item matches
 */
interface NestedConditionProperties {
  fact: string;
  operator: 'some';
  conditions: TopLevelCondition;
  path?: string;
  priority?: number;
  params?: Record<string, any>;
  name?: string;
}

interface NestedConditionPropertiesResult extends NestedConditionProperties, ConditionResultProperties {
  conditions: TopLevelConditionResult;
}

type ConditionPropertiesResult = ConditionProperties & ConditionResultProperties

type NestedCondition = ConditionProperties | NestedConditionProperties | ScopedConditionProperties | TopLevelCondition;
type NestedConditionResult = ConditionPropertiesResult | NestedConditionPropertiesResult | ScopedConditionPropertiesResult | TopLevelConditionResult;
type AllConditions = {
  all: NestedCondition[];
  name?: string;
  priority?: number;
};
type AllConditionsResult = AllConditions & {
  all: NestedConditionResult[]
} & BooleanConditionResultProperties
type AnyConditions = {
  any: NestedCondition[];
  name?: string;
  priority?: number;
};
type AnyConditionsResult = AnyConditions & {
  any: NestedConditionResult[]
} & BooleanConditionResultProperties
type NotConditions = { not: NestedCondition; name?: string; priority?: number };
type NotConditionsResult = NotConditions & {not: NestedConditionResult} & BooleanConditionResultProperties;
type ConditionReference = {
  condition: string;
  name?: string;
  priority?: number;
};
type ConditionReferenceResult = ConditionReference & BooleanConditionResultProperties
export type TopLevelCondition =
  | AllConditions
  | AnyConditions
  | NotConditions
  | ConditionReference;
export type TopLevelConditionResult = 
  | AllConditionsResult
  | AnyConditionsResult
  | NotConditionsResult
  | ConditionReferenceResult
export type TopLevelConditionResultSerializable =
  | AllConditionsResult
  | AnyConditionsResult
  | NotConditionsResult
  | ConditionReference
