import { OperatorDecorator } from "./operator-decorator.mjs";

export default [
  new OperatorDecorator(
    "someFact",
    (factValue: unknown[], jsonValue, next) =>
      factValue.some((fv) => next(fv, jsonValue)),
    Array.isArray,
  ),
  new OperatorDecorator("someValue", (factValue, jsonValue: unknown[], next) =>
    jsonValue.some((jv) => next(factValue, jv)),
  ),
  new OperatorDecorator(
    "everyFact",
    (factValue: unknown[], jsonValue, next) =>
      factValue.every((fv) => next(fv, jsonValue)),
    Array.isArray,
  ),
  new OperatorDecorator("everyValue", (factValue, jsonValue: unknown[], next) =>
    jsonValue.every((jv) => next(factValue, jv)),
  ),
  new OperatorDecorator("swap", (factValue, jsonValue, next) =>
    next(jsonValue, factValue),
  ),
  new OperatorDecorator(
    "not",
    (factValue, jsonValue, next) => !next(factValue, jsonValue),
  ),
];
