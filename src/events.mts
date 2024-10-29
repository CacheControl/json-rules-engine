import type { Almanac } from "./almanac.mjs";
import type { RuleResult } from "./rule.mjs";

export interface Event {
  type: string;
  params?: Record<string, unknown>;
}

export type EventHandler<T = Event> = (
  event: T,
  almanac: Almanac,
  ruleResult: RuleResult,
) => void;

export class EventEmitter {
  readonly #listeners = new Map<
    string,
    { once: boolean; handler: EventHandler<unknown> }[]
  >();

  on<T = Event>(eventName: string, handler: EventHandler<T>): this {
    return this.addEventListener(eventName, handler);
  }

  once<T = Event>(eventName: string, handler: EventHandler<T>): this {
    this.#listeners.set(
      eventName,
      (this.#listeners.get(eventName) ?? []).concat([
        { once: true, handler: handler as EventHandler<unknown> },
      ]),
    );
    return this;
  }

  addEventListener<T = Event>(
    eventName: string,
    handler: EventHandler<T>,
  ): this {
    this.#listeners.set(
      eventName,
      (this.#listeners.get(eventName) ?? []).concat([
        { once: false, handler: handler as EventHandler<unknown> },
      ]),
    );
    return this;
  }

  removeEventListener<T = Event>(
    eventName: string,
    handler: EventHandler<T>,
  ): this {
    this.#listeners.set(
      eventName,
      (this.#listeners.get(eventName) ?? []).filter(
        (l) => l.handler === handler,
      ),
    );
    return this;
  }

  protected async emit(
    eventName: string,
    event: unknown,
    almanac: Almanac,
    ruleResult: RuleResult,
  ): Promise<void> {
    const listeners = this.#listeners.get(eventName);
    if (listeners) {
      // remove once listeners
      this.#listeners.set(
        eventName,
        listeners.filter(({ once }) => !once),
      );
      try {
        while (listeners.length > 0) {
          const { handler } = listeners.shift()!;
          await handler(event, almanac, ruleResult);
        }
      } catch (error) {
        // add any unused once listeners back to the list of listeners
        this.#listeners.set(
          eventName,
          (this.#listeners.get(eventName) ?? []).concat(
            listeners.filter(({ once }) => once),
          ),
        );
        throw error;
      }
    }
  }
}
