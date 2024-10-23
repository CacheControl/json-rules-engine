"use strict";

import OperatorDecorator from "./operator-decorator";

const OperatorDecorators = [];

OperatorDecorators.push(
  new OperatorDecorator(
    "someFact",
    (factValue, jsonValue, next) => factValue.some((fv) => next(fv, jsonValue)),
    Array.isArray,
  ),
);
OperatorDecorators.push(
  new OperatorDecorator("someValue", (factValue, jsonValue, next) =>
    jsonValue.some((jv) => next(factValue, jv)),
  ),
);
OperatorDecorators.push(
  new OperatorDecorator(
    "everyFact",
    (factValue, jsonValue, next) =>
      factValue.every((fv) => next(fv, jsonValue)),
    Array.isArray,
  ),
);
OperatorDecorators.push(
  new OperatorDecorator("everyValue", (factValue, jsonValue, next) =>
    jsonValue.every((jv) => next(factValue, jv)),
  ),
);
OperatorDecorators.push(
  new OperatorDecorator("swap", (factValue, jsonValue, next) =>
    next(jsonValue, factValue),
  ),
);
OperatorDecorators.push(
  new OperatorDecorator(
    "not",
    (factValue, jsonValue, next) => !next(factValue, jsonValue),
  ),
);

export default OperatorDecorators;
