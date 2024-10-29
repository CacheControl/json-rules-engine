import type { Almanac } from "./almanac.mjs";
import hashIt from "hash-it";

export type DynamicFactCallback<T = unknown> = (
  params: Record<string, any>,
  almanac: Almanac,
) => T;

export interface FactOptions {
  cache?: boolean;
  priority?: number;
}

export class Fact<T = unknown> {
  readonly id: string;
  readonly priority: number;

  readonly #calculationMethod: DynamicFactCallback<T>;
  readonly #cache: boolean;

  /**
   * Returns a new fact instance
   * @param  id - fact unique identifer
   * @param  valueOrMethod - constant primitive, or method to call when computing the fact's value
   * @param  options - options for the fact, such as caching
   */
  constructor(
    id: string,
    valueOrMethod: T | DynamicFactCallback<T>,
    options: FactOptions = { cache: true },
  ) {
    this.id = id;
    if (!this.id) throw new Error("factId required");
    if (typeof valueOrMethod !== "function") {
      this.#calculationMethod = () => valueOrMethod;
      this.#cache = false;
    } else {
      this.#calculationMethod = valueOrMethod as DynamicFactCallback<T>;
      this.#cache = options.cache ?? true;
    }

    this.priority = parseInt((options.priority ?? 1) as unknown as string, 10);
  }

  /**
   * Return the fact value, based on provided parameters
   * @param  {object} params
   * @param  {Almanac} almanac
   * @return {any} calculation method results
   */
  calculate(params: Record<string, unknown>, almanac: Almanac): T {
    return this.#calculationMethod(params, almanac);
  }

  protected cacheParams(
    params: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    return params;
  }

  /**
   * Generates the fact's cache key
   * Returns nothing if the fact's caching has been disabled
   * @param  params - parameters that would be passed to the computation method
   * @return cache key, null if not cached
   */
  getCacheKey(params: Record<string, unknown>): unknown {
    if (this.#cache) {
      const cacheProperties = this.cacheParams(params);
      const hash = hashIt({ id: this.id, params: cacheProperties });
      return hash;
    }
    return null;
  }
}
