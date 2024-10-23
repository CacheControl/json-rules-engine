"use strict";

import Operator from "./operator";

const Operators = [];
Operators.push(new Operator("equal", (a, b) => a === b));
Operators.push(new Operator("notEqual", (a, b) => a !== b));
Operators.push(new Operator("in", (a, b) => b.indexOf(a) > -1));
Operators.push(new Operator("notIn", (a, b) => b.indexOf(a) === -1));

Operators.push(
  new Operator("contains", (a, b) => a.indexOf(b) > -1, Array.isArray),
);
Operators.push(
  new Operator("doesNotContain", (a, b) => a.indexOf(b) === -1, Array.isArray),
);

function numberValidator(factValue) {
  return Number.parseFloat(factValue).toString() !== "NaN";
}
Operators.push(new Operator("lessThan", (a, b) => a < b, numberValidator));
Operators.push(
  new Operator("lessThanInclusive", (a, b) => a <= b, numberValidator),
);
Operators.push(new Operator("greaterThan", (a, b) => a > b, numberValidator));
Operators.push(
  new Operator("greaterThanInclusive", (a, b) => a >= b, numberValidator),
);

export default Operators;
