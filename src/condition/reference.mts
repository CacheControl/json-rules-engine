import { Almanac } from "../almanac.mjs";
import { OperatorMap } from "../operator-map.mjs";
import {
  TopLevelConditionInstance,
  TopLevelConditionResult,
} from "./index.mjs";

export interface ConditionMap {
  get(name: string): TopLevelConditionInstance;
}

export interface ConditionReferenceProperties {
  name?: string;
  priority?: number;
  condition: string;
}

export class ConditionReference {
  readonly name?: string;
  readonly priority: number;
  readonly #condition: string;

  constructor(properties: ConditionReferenceProperties) {
    this.name = properties.name;
    this.priority = parseInt(
      (properties.priority ?? 1) as unknown as string,
      10,
    );
    this.#condition = properties.condition;
  }

  toJSON(): ConditionReferenceProperties {
    return {
      name: this.name,
      priority: this.priority,
      condition: this.#condition,
    };
  }

  evaluate(
    almanac: Almanac,
    operatorMap: OperatorMap,
    conditionMap: ConditionMap,
  ): Promise<TopLevelConditionResult> {
    if (!conditionMap)
      return Promise.reject(new Error("conditionMap required"));
    return conditionMap
      .get(this.#condition)
      .evaluate(almanac, operatorMap, conditionMap);
  }
}
