import { Almanac } from "../almanac.mjs";
import { ComparisonCondition } from "./comparison.mjs";
import { NestedConditionInstance } from "./index.mjs";

export function prioritize(
  conditions: NestedConditionInstance[],
  almanac: Almanac,
): NestedConditionInstance[][] {
  return conditions
    .reduce((byPriority, condition) => {
      const priority =
        condition.priority ??
        almanac.getFact((condition as ComparisonCondition).fact)?.priority ??
        1;
      const priorityList = byPriority.get(priority) ?? [];
      priorityList.push(condition);
      byPriority.set(priority, priorityList);
      return byPriority;
    }, new Map<number, NestedConditionInstance[]>())
    .entries()
    .toArray()
    .sort(([a], [b]) => a - b)
    .map(([, value]) => value);
}
