import { Almanac } from "../almanac.mjs";
import debug from "../debug.mjs";
import { OperatorMap } from "../operator-map.mjs";
import {
  NestedConditionInstance,
  NestedCondition,
  NestedConditionResult,
} from "./index.mjs";
import { prioritize } from "./prioritize.mjs";
import { ConditionMap } from "./reference.mjs";

export interface AnyConditionProperties {
  name?: string;
  priority?: number;
  any: NestedCondition[];
}

export interface AnyConditionResult {
  name?: string;
  priority: number;
  operator: "any";
  any: NestedConditionResult[];
  result: boolean;
}

export class AnyCondition {
  readonly name?: string;
  readonly priority: number;
  readonly #any: NestedConditionInstance[];

  constructor(
    properties: AnyConditionProperties,
    factory: (properties: NestedCondition) => NestedConditionInstance,
  ) {
    this.name = properties.name;
    this.priority = parseInt(
      (properties.priority ?? 1) as unknown as string,
      10,
    );
    this.#any = properties.any.map((p) => factory(p));
  }

  toJSON(): AnyConditionProperties {
    return {
      name: this.name,
      priority: this.priority,
      any: this.#any.map((c) => c.toJSON()),
    };
  }

  async evaluate(
    almanac: Almanac,
    operatorMap: OperatorMap,
    conditionMap: ConditionMap,
  ): Promise<AnyConditionResult> {
    if (this.#any.length === 0) {
      return {
        name: this.name,
        priority: this.priority,
        operator: "any",
        any: [],
        result: true,
      };
    }
    if (!almanac) throw new Error("almanac required");
    const any: NestedConditionResult[] = [];
    for (const conditions of prioritize(this.#any, almanac)) {
      const results = await Promise.all(
        conditions.map((c) => c.evaluate(almanac, operatorMap, conditionMap)),
      );
      debug("AnyCondition::evaluate", { results });
      any.push(...results);
      const result = results.some(({ result }) => result);
      if (result) {
        return {
          name: this.name,
          priority: this.priority,
          operator: "any",
          any,
          result,
        };
      }
    }
    return {
      name: this.name,
      priority: this.priority,
      operator: "any",
      any,
      result: false,
    };
  }
}
