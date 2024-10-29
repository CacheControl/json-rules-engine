export type OperatorEvaluator<TFact, TValue> = (
  factValue: TFact,
  compareToValue: TValue,
) => boolean;
export type FactValueValidator<TFact> = (value: unknown) => value is TFact;

export class Operator<TFact = unknown, TValue = unknown> {
  readonly name: string;
  readonly #cb: OperatorEvaluator<TFact, TValue>;
  readonly #factValueValidator: FactValueValidator<TFact>;

  /**
   * Constructor
   * @param name - operator identifier
   * @param callback - operator evaluation method
   * @param factValueValidator - optional validator for asserting the data type of the fact
   */
  constructor(
    name: string,
    cb: OperatorEvaluator<TFact, TValue>,
    factValueValidator: FactValueValidator<TFact> = (
      value: unknown,
    ): value is TFact => true,
  ) {
    this.name = String(name);
    if (!name) throw new Error("Missing operator name");
    if (typeof cb !== "function") throw new Error("Missing operator callback");
    this.#cb = cb;
    this.#factValueValidator = factValueValidator;
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   factValue - fact result
   * @param   jsonValue - "value" property of the condition
   * @returns whether the values pass the operator test
   */
  evaluate(factValue: unknown, jsonValue: unknown) {
    return (
      this.#factValueValidator(factValue) &&
      this.#cb(factValue, jsonValue as TValue)
    );
  }
}
