import {
  Operator,
  type OperatorEvaluator,
  type FactValueValidator,
} from "./operator.mjs";

export type OperatorDecoratorEvaluator<TFact, TValue, TNextFact, TNextValue> = (
  factValue: TFact,
  compareToValue: TValue,
  next: OperatorEvaluator<TNextFact, TNextValue>,
) => boolean;

export class OperatorDecorator<
  TFact = unknown,
  TValue = unknown,
  TNextFact = unknown,
  TNextValue = unknown,
> {
  readonly name: string;
  readonly #cb: OperatorDecoratorEvaluator<
    TFact,
    TValue,
    TNextFact,
    TNextValue
  >;
  readonly #factValueValidator: FactValueValidator<TFact>;

  /**
   * Constructor
   * @param name - decorator identifier
   * @param callback - callback that takes the next operator as a parameter
   * @param factValueValidator - optional validator for asserting the data type of the fact
   */
  constructor(
    name: string,
    cb: OperatorDecoratorEvaluator<TFact, TValue, TNextFact, TNextValue>,
    factValueValidator: FactValueValidator<TFact> = (
      fact: unknown,
    ): fact is TFact => true,
  ) {
    this.name = String(name);
    if (!name) throw new Error("Missing decorator name");
    if (typeof cb !== "function") throw new Error("Missing decorator callback");
    this.#cb = cb;
    this.#factValueValidator = factValueValidator;
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   operator - the operator to decorate
   * @returns a new Operator with this decoration applied
   */
  decorate(operator: Operator<TNextFact, TNextValue>) {
    const next = operator.evaluate.bind(operator);
    return new Operator<TFact, TValue>(
      `${this.name}:${operator.name}`,
      (factValue, jsonValue) => {
        return this.#cb(factValue, jsonValue, next);
      },
      this.#factValueValidator,
    );
  }
}
