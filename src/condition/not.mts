import { Almanac } from "../almanac.mjs";
import { OperatorMap } from "../operator-map.mjs";
import {
  NestedConditionInstance,
  NestedCondition,
  NestedConditionResult,
} from "./index.mjs";
import { ConditionMap } from "./reference.mjs";

export interface NotConditionResult {
  name?: string;
  priority: number;
  operator: "not";
  not?: NestedConditionResult;
  result: boolean;
}

export interface NotConditionProperties {
  name?: string;
  priority?: number;
  not: NestedCondition;
}

export class NotCondition {
  readonly name?: string;
  readonly priority: number;
  readonly #not: NestedConditionInstance;

  constructor(
    properties: NotConditionProperties,
    factory: (properties: NestedCondition) => NestedConditionInstance,
  ) {
    this.name = properties.name;
    this.priority = parseInt(
      (properties.priority ?? 1) as unknown as string,
      10,
    );
    this.#not = factory(properties.not);
  }

  /**
   * Converts the condition into a json-friendly structure
   */
  toJSON(): NotConditionProperties {
    return {
      name: this.name,
      priority: this.priority,
      not: this.#not.toJSON(),
    };
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the operator
   *   LHS                      OPER       RHS
   * <fact + params + path>  <operator>  <value>
   *
   * @param   {Almanac} almanac
   * @param   {Map} operatorMap - map of available operators, keyed by operator name
   * @returns {Boolean} - evaluation result
   */
  async evaluate(
    almanac: Almanac,
    operatorMap: OperatorMap,
    conditionMap: ConditionMap,
  ): Promise<NotConditionResult> {
    const not = await this.#not.evaluate(almanac, operatorMap, conditionMap);
    return {
      name: this.name,
      priority: this.priority,
      operator: "not",
      not,
      result: !not.result,
    };
  }
}
