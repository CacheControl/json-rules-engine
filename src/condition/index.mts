import {
  AllCondition,
  AllConditionProperties,
  AllConditionResult,
} from "./all.mjs";
import {
  AnyCondition,
  AnyConditionProperties,
  AnyConditionResult,
} from "./any.mjs";
import {
  ComparisonCondition,
  ComparisonConditionProperties,
  ComparisonConditionResult,
} from "./comparison.mjs";
import {
  NeverCondition,
  NeverConditionProperties,
  NeverConditionResult,
} from "./never.mjs";
import {
  NotCondition,
  NotConditionProperties,
  NotConditionResult,
} from "./not.mjs";
import {
  ConditionReference,
  ConditionReferenceProperties,
} from "./reference.mjs";

export type TopLevelCondition =
  | AllConditionProperties
  | AnyConditionProperties
  | NotConditionProperties
  | ConditionReferenceProperties
  | NeverConditionProperties;
export type NestedCondition = TopLevelCondition | ComparisonConditionProperties;

export type TopLevelConditionInstance =
  | AllCondition
  | AnyCondition
  | NotCondition
  | ConditionReference
  | typeof NeverCondition;
export type NestedConditionInstance =
  | TopLevelConditionInstance
  | ComparisonCondition;

export type TopLevelConditionResult =
  | AllConditionResult
  | AnyConditionResult
  | NotConditionResult
  | NeverConditionResult;
export type NestedConditionResult =
  | TopLevelConditionResult
  | ComparisonConditionResult;

function nestedConditionFactory(
  properties: NestedCondition,
): NestedConditionInstance {
  if (!properties) throw new Error("Condition: factory properties required");
  if (typeof properties !== "object" || Array.isArray(properties)) {
    throw new Error("Condition: factory properties must be an object");
  }
  if ("never" in properties && properties.never === true) {
    return NeverCondition;
  }
  if (
    "name" in properties &&
    properties.name !== undefined &&
    typeof properties.name !== "string"
  ) {
    throw new Error("Condition: factory properties.name must be a string");
  }
  if (
    "priority" in properties &&
    properties.priority !== undefined &&
    typeof properties.priority !== "number"
  ) {
    throw new Error("Condition: factory properties.priority must be a number");
  }
  if ("all" in properties) {
    if (!Array.isArray(properties.all)) {
      throw new Error("Condition: factory properties.all must be an array");
    }
    return new AllCondition(properties, nestedConditionFactory);
  }
  if ("any" in properties) {
    if (!Array.isArray(properties.any)) {
      throw new Error("Condition: factory properties.any must be an array");
    }
    return new AnyCondition(properties, nestedConditionFactory);
  }
  if ("not" in properties) {
    return new NotCondition(properties, nestedConditionFactory);
  }
  if ("condition" in properties) {
    if (typeof properties.condition !== "string") {
      throw new Error(
        "Condition: factory properties.condition must be a string",
      );
    }
    return new ConditionReference(properties);
  }

  if (!("fact" in properties) || typeof properties.fact !== "string") {
    throw new Error('Condition: constructor "fact" property required');
  }

  if (!("operator" in properties) || typeof properties.operator !== "string") {
    throw new Error('Condition: constructor "operator" property required');
  }

  return new ComparisonCondition(properties);
}

export function conditionFactory(
  properties: TopLevelCondition,
): TopLevelConditionInstance {
  const result = nestedConditionFactory(properties);
  if (result instanceof ComparisonCondition) {
    throw new Error(
      '"conditions" root must contain a single instance of "all", "any", "not", or "condition"',
    );
  }
  return result;
}
