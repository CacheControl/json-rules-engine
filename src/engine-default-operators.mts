import { Operator } from "./operator.mjs";

function numberValidator(factValue: unknown): factValue is number {
  return Number.parseFloat(factValue as string).toString() !== "NaN";
}

export default [
  new Operator("equal", (a, b) => a === b),
  new Operator("notEqual", (a, b) => a !== b),

  new Operator("in", (a, b: unknown[]) => b.indexOf(a) > -1),
  new Operator("notIn", (a, b: unknown[]) => b.indexOf(a) === -1),
  new Operator(
    "contains",
    (a: unknown[], b) => a.indexOf(b) > -1,
    Array.isArray,
  ),
  new Operator(
    "doesNotContain",
    (a: unknown[], b) => a.indexOf(b) === -1,
    Array.isArray,
  ),

  new Operator("lessThan", (a, b: number) => a < b, numberValidator),
  new Operator("lessThanInclusive", (a, b: number) => a <= b, numberValidator),
  new Operator("greaterThan", (a, b: number) => a > b, numberValidator),
  new Operator(
    "greaterThanInclusive",
    (a, b: number) => a >= b,
    numberValidator,
  ),
];
