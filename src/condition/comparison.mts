import { Almanac } from "../almanac.mjs";
import debug from "../debug.mjs";
import { OperatorMap } from "../operator-map.mjs";

export interface ComparisonConditionProperties {
  name?: string;
  priority?: number;
  fact: string;
  params?: Record<string, unknown>;
  path?: string;
  operator: string;
  value: unknown;
}

export interface ComparisonConditionResult {
  name?: string;
  priority?: number;
  fact: string;
  params?: Record<string, unknown>;
  path?: string;
  factResult: unknown;
  operator: string;
  value: unknown;
  valueResult: unknown;
  result: boolean;
}

export class ComparisonCondition {
  readonly name?: string;
  readonly priority?: number;
  readonly fact: string;
  readonly #params?: Record<string, unknown>;
  readonly #path?: string;
  readonly #operator: string;
  readonly #value: unknown;

  constructor(properties: ComparisonConditionProperties) {
    this.name = properties.name;
    this.priority =
      properties.priority !== undefined
        ? parseInt(properties.priority as unknown as string, 10)
        : undefined;
    this.fact = properties.fact;
    this.#params = properties.params;
    this.#path = properties.path;
    this.#operator = properties.operator;
    this.#value = properties.value;
  }

  toJSON(): ComparisonConditionProperties {
    return {
      name: this.name,
      priority: this.priority,
      fact: this.fact,
      params: this.#params,
      path: this.#path,
      operator: this.#operator,
      value: this.#value,
    };
  }

  async evaluate(
    almanac: Almanac,
    operatorMap: OperatorMap,
  ): Promise<ComparisonConditionResult> {
    if (!almanac) return Promise.reject(new Error("almanac required"));
    if (!operatorMap) return Promise.reject(new Error("operatorMap required"));

    const op = operatorMap.get(this.#operator);
    const [valueResult, factResult] = await Promise.all([
      almanac.getValue(this.#value),
      almanac.factValue(this.fact, this.#params, this.#path),
    ]);

    const result = op.evaluate(factResult, valueResult);
    debug("condition::evaluate", {
      factResult,
      operator: op.name,
      valueResult,
      result,
    });
    return {
      name: this.name,
      priority: this.priority,
      fact: this.fact,
      params: this.#params,
      path: this.#path,
      factResult,
      operator: op.name,
      value: this.#value,
      valueResult,
      result,
    };
  }
}
