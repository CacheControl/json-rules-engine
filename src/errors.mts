export class UndefinedFactError extends Error {
  readonly code = "UNDEFINED_FACT" as const;
}
