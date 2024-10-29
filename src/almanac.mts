import { type DynamicFactCallback, Fact, type FactOptions } from "./fact.mjs";
import { UndefinedFactError } from "./errors.mjs";
import debug from "./debug.mjs";
import { JSONPath } from "jsonpath-plus";
import { RuleResult } from "./rule.mjs";
import { Event } from "./events.mjs";

export type PathResolver = (value: object, path: string) => unknown;

function defaultPathResolver(value: object, path: string): unknown {
  return JSONPath({ path, json: value, wrap: false });
}

export interface AlmanacOptions {
  allowUndefinedFacts?: boolean;
  pathResolver?: PathResolver;
}

/**
 * Fact results lookup
 * Triggers fact computations and saves the results
 * A new almanac is used for every engine run()
 */
export class Almanac {
  readonly #factMap = new Map<string, Fact>();
  readonly #factResultsCache = new Map<unknown, Promise<unknown>>(); // { cacheKey:  Promise<factValue> }
  readonly #allowUndefinedFacts: boolean;
  readonly #pathResolver: PathResolver;
  readonly #events = {
    success: [] as Event[],
    failure: [] as Event[],
  };
  readonly #ruleResults: RuleResult[] = [];

  constructor(options: AlmanacOptions = {}) {
    this.#allowUndefinedFacts = Boolean(options.allowUndefinedFacts);
    this.#pathResolver = options.pathResolver ?? defaultPathResolver;
  }

  /**
   * Adds a success event
   * @param event
   */
  addEvent(event: Event, outcome: "success" | "failure") {
    if (!outcome) throw new Error('outcome required: "success" | "failure"]');
    this.#events[outcome].push(event);
  }

  /**
   * retrieve successful events
   */
  getEvents(outcome?: "success" | "failure"): Event[] {
    if (outcome) return this.#events[outcome];
    return this.#events.success.concat(this.#events.failure);
  }

  /**
   * Adds a rule result
   * @param ruleResult the result of running a set of rules
   */
  addResult(ruleResult: RuleResult): void {
    this.#ruleResults.push(ruleResult);
  }

  /**
   * retrieve successful events
   */
  getResults(): RuleResult[] {
    return this.#ruleResults;
  }

  /**
   * Retrieve fact by id, raising an exception if it DNE
   * @param  {String} factId
   * @return {Fact}
   */
  getFact(factId: string): Fact | undefined {
    return this.#factMap.get(factId);
  }

  /**
   * * Add a fact definition to the engine.  Facts are called by rules as they are evaluated.
   * @param fact - the instance of the fact to add
   */
  addFact(fact: Fact): this;
  /**
   * Add a fact definition to the engine.  Facts are called by rules as they are evaluated.
   * @param id - fact identifier
   * @param definitionFunc - function to be called when computing the fact value for a given rule
   * @param options - options to initialize the fact with.
   */
  addFact<T>(
    id: string,
    valueOrMethod: T | DynamicFactCallback<T>,
    options?: FactOptions,
  ): this;
  addFact<T>(
    idOrFact: string | Fact<T>,
    valueOrMethod?: T | DynamicFactCallback,
    options?: FactOptions,
  ): this {
    const fact =
      idOrFact instanceof Fact
        ? idOrFact
        : new Fact(idOrFact, valueOrMethod!, options);

    debug("almanac::addFact", { id: fact.id });
    this.#factMap.set(fact.id, fact);
    return this;
  }

  /**
   * Returns the value of a fact, based on the given parameters.  Utilizes the 'almanac' maintained
   * by the engine, which cache's fact computations based on parameters provided
   * @param  factId - fact identifier
   * @param  params - parameters to feed into the fact.  By default, these will also be used to compute the cache key
   * @param  path - object
   * @return a promise which will resolve with the fact computation.
   */
  async factValue<T>(
    factId: string,
    params: Record<string, unknown> = {},
    path: string = "",
  ): Promise<T> {
    const fact = this.getFact(factId);
    if (fact === undefined) {
      if (this.#allowUndefinedFacts) {
        return undefined as T;
      } else {
        throw new UndefinedFactError(`Undefined fact: ${factId}`);
      }
    }
    let factValuePromise: Promise<unknown>;
    const cacheKey = fact.getCacheKey(params);
    if (cacheKey !== null) {
      const cacheVal = this.#factResultsCache.get(cacheKey);
      if (cacheVal) {
        factValuePromise = cacheVal;
        debug("almanac::factValue cache hit for fact", { id: factId });
      } else {
        debug("almanac::factValue cache miss, calculating", { id: factId });
        factValuePromise = Promise.resolve(fact.calculate(params, this));
        this.#factResultsCache.set(cacheKey, factValuePromise);
      }
    } else {
      factValuePromise = Promise.resolve(fact.calculate(params, this));
    }
    if (path) {
      debug("condition::evaluate extracting object", { property: path });
      const factValue = await factValuePromise;
      if (factValue != null && typeof factValue === "object") {
        const pathValue = this.#pathResolver(factValue, path);
        debug("condition::evaluate extracting object", {
          property: path,
          received: pathValue,
        });
        return pathValue as T;
      } else {
        debug(
          "condition::evaluate could not compute object path of non-object",
          { path, factValue, type: typeof factValue },
        );
      }
    }

    return factValuePromise as Promise<T>;
  }

  /**
   * Interprets value as either a primitive, or if a fact, retrieves the fact value
   */
  getValue(value: unknown): Promise<unknown> {
    if (
      value != null &&
      typeof value === "object" &&
      "fact" in value &&
      typeof value.fact === "string"
    ) {
      // value = { fact: 'xyz' }
      return this.factValue(
        value.fact,
        (value as { params?: Record<string, unknown> }).params,
        (value as { path?: string }).path,
      );
    }
    return Promise.resolve(value);
  }
}
