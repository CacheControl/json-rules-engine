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

export interface AllConditionProperties {
  name?: string;
  priority?: number;
  all: NestedCondition[];
}

export interface AllConditionResult {
  name?: string;
  priority: number;
  operator: "all";
  all: NestedConditionResult[];
  result: boolean;
}

export class AllCondition {
  readonly name?: string;
  readonly priority: number;
  readonly #all: NestedConditionInstance[];

  constructor(
    properties: AllConditionProperties,
    factory: (properties: NestedCondition) => NestedConditionInstance,
  ) {
    this.name = properties.name;
    this.priority = parseInt(
      (properties.priority ?? 1) as unknown as string,
      10,
    );
    this.#all = properties.all.map((p) => factory(p));
  }

  toJSON(): AllConditionProperties {
    return {
      name: this.name,
      priority: this.priority,
      all: this.#all.map((c) => c.toJSON()),
    };
  }

  async evaluate(
    almanac: Almanac,
    operatorMap: OperatorMap,
    conditionMap: ConditionMap,
  ): Promise<AllConditionResult> {
    if (this.#all.length === 0) {
      return {
        name: this.name,
        priority: this.priority,
        operator: "all",
        all: [],
        result: true,
      };
    }
    if (!almanac) throw new Error("almanac required");
    const all: NestedConditionResult[] = [];
    for (const conditions of prioritize(this.#all, almanac)) {
      const results = await Promise.all(
        conditions.map((c) => c.evaluate(almanac, operatorMap, conditionMap)),
      );
      debug("AllCondition::evaluate", { results });
      all.push(...results);
      const result = results.every(({ result }) => result);
      if (!result) {
        return {
          name: this.name,
          priority: this.priority,
          operator: "all",
          all,
          result,
        };
      }
    }
    return {
      name: this.name,
      priority: this.priority,
      operator: "all",
      all,
      result: true,
    };
  }
}
