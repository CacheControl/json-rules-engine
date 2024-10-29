export interface NeverConditionResult {
  name?: undefined;
  priority?: undefined;
  result: false;
  operator: "never";
}

export interface NeverConditionProperties {
  operator: "never";
}

export const NeverCondition = {
  priority: 1,

  toJSON(): NeverConditionProperties {
    return { operator: "never" };
  },

  evaluate(): Promise<NeverConditionResult> {
    return Promise.resolve({ result: false, operator: "never" });
  },
};
