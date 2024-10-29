import { Operator, OperatorEvaluator } from "./operator.mjs";
import {
  OperatorDecorator,
  OperatorDecoratorEvaluator,
} from "./operator-decorator.mjs";
import debug from "./debug.mjs";

export class OperatorMap {
  readonly #operators = new Map<string, Operator>();
  readonly #decorators = new Map<string, OperatorDecorator>();

  /**
   * Add a custom operator definition
   * @param operator - operator to add
   */
  addOperator<TFact, TValue>(operator: Operator<TFact, TValue>): void;
  /**
   * Add a custom operator definition
   * @param name - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   * @param callback - the method to execute when the operator is encountered.
   */
  addOperator<TFact, TValue>(
    name: string,
    callback: OperatorEvaluator<TFact, TValue>,
  ): void;
  addOperator<TFact, TValue>(
    operatorOrName: Operator<TFact, TValue> | string,
    cb?: OperatorEvaluator<TFact, TValue>,
  ): void {
    const operator =
      operatorOrName instanceof Operator
        ? operatorOrName
        : new Operator(operatorOrName, cb!);

    debug("operatorMap::addOperator", { name: operator.name });
    this.#operators.set(operator.name, operator as Operator);
  }

  /**
   * Remove a custom operator definition
   * @param operatorOrName - operator or operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
   */
  removeOperator<TFact, TValue>(
    operatorOrName: Operator<TFact, TValue> | string,
  ): boolean {
    const operatorName =
      operatorOrName instanceof Operator ? operatorOrName.name : operatorOrName;

    // Delete all the operators that end in :operatorName these
    // were decorated on-the-fly leveraging this operator
    const suffix = ":" + operatorName;
    this.#operators
      .keys()
      .filter((name) => name.endsWith(suffix))
      .forEach((name) => this.#operators.delete(name));

    return this.#operators.delete(operatorName);
  }

  /**
   * Add a custom operator decorator
   * @param decorator - decorator to add
   */
  addOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    decorator: OperatorDecorator<TFact, TValue, TNextFact, TNextValue>,
  ): void;
  /**
   * Add a custom operator decorator
   * @param name - decorator identifier within the condition; i.e. instead of 'everyFact', 'someValue', etc
   * @param callback - the method to execute when the decorator is encountered.
   */
  addOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    name: string,
    callback: OperatorDecoratorEvaluator<TFact, TValue, TNextFact, TNextValue>,
  ): void;
  addOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    decoratorOrName:
      | OperatorDecorator<TFact, TValue, TNextFact, TNextValue>
      | string,
    cb?: OperatorDecoratorEvaluator<TFact, TValue, TNextFact, TNextValue>,
  ): void {
    const decorator =
      decoratorOrName instanceof OperatorDecorator
        ? decoratorOrName
        : new OperatorDecorator(decoratorOrName, cb!);
    debug("operatorMap::addOperatorDecorator", { name: decorator.name });
    this.#decorators.set(decorator.name, decorator as OperatorDecorator);
  }

  /**
   * Remove a custom operator decorator
   * @param  decoratorOrName - decorator identifier within the condition; i.e. instead of 'everyFact', 'someValue', etc
   */
  removeOperatorDecorator<TFact, TValue, TNextFact, TNextValue>(
    decoratorOrName:
      | OperatorDecorator<TFact, TValue, TNextFact, TNextValue>
      | string,
  ) {
    let decoratorName;
    if (decoratorOrName instanceof OperatorDecorator) {
      decoratorName = decoratorOrName.name;
    } else {
      decoratorName = decoratorOrName;
    }

    // Delete all the operators that include decoratorName: these
    // were decorated on-the-fly leveraging this decorator
    const prefix = decoratorName + ":";
    this.#operators
      .keys()
      .filter((name) => name.includes(prefix))
      .forEach((name) => this.#operators.delete(name));

    return this.#decorators.delete(decoratorName);
  }

  /**
   * Get the Operator, or null applies decorators as needed
   * @param name - the name of the operator including any decorators
   * @returns an operator or null
   */
  get(name: string): Operator {
    const decorators: OperatorDecorator[] = [];
    let opName = name;
    // while we don't already have this operator
    while (!this.#operators.has(opName)) {
      // try splitting on the decorator symbol (:)
      const firstDecoratorIndex = opName.indexOf(":");
      if (firstDecoratorIndex > 0) {
        // if there is a decorator, and it's a valid decorator
        const decoratorName = opName.slice(0, firstDecoratorIndex);
        const decorator = this.#decorators.get(decoratorName);
        if (!decorator) {
          debug("operatorMap::get invalid decorator", { name: decoratorName });
          throw new Error(`Unknown operator: ${name}`);
        }
        // we're going to apply this later
        decorators.push(decorator);
        // continue looking for a known operator with the rest of the name
        opName = opName.slice(firstDecoratorIndex + 1);
      } else {
        debug("operatorMap::get no operator", { name: opName });
        throw new Error(`Unknown operator: ${name}`);
      }
    }

    // apply all the decorators
    return decorators.reduceRight(
      (op: Operator, decorator: OperatorDecorator) => {
        const decorated = decorator.decorate(op);
        // create an entry for the decorated operation so we don't need
        // to do this again
        this.addOperator(decorated);
        return decorated;
      },
      this.#operators.get(opName)!,
    );
  }
}
