import debug from '../debug'

/**
 * Priorizes an array of conditions based on "priority"
 *   When no explicit priority is provided on the condition itself, the condition's priority is determine by its fact
 * @param  {Condition[]} conditions
 * @param {Almanac} almanac
 * @return {[number, Condition][][]} prioritized two-dimensional array of conditions and original indexes
 *    Each outer array element represents a single priority(integer).  Inner array is
 *    all conditions with that priority.
 */
function prioritizeConditions (conditions, almanac) {
  const factSets = conditions.reduce((sets, condition, index) => {
    // if a priority has been set on this specific condition, honor that first
    // otherwise, use the fact's priority
    let priority = condition.getPriority(almanac)
    if (priority == null) {
      priority = 1
    }
    if (!sets[priority]) sets[priority] = []
    sets[priority].push([index, condition])
    return sets
  }, {})
  return Object.keys(factSets)
    .sort((a, b) => {
      return Number(a) > Number(b) ? -1 : 1 // order highest priority -> lowest
    })
    .map((priority) => factSets[priority])
}

/**
 * Evaluates a set of conditions based on an 'some' or 'every' operator.
 *   First, orders the top level conditions based on priority
 *   Iterates over each priority set, evaluating each condition
 *   If any condition results in the rule to be guaranteed truthy or falsey,
 *   it will short-circuit and not bother evaluating any additional rules
 * @param  {Condition[]} conditions - conditions to be evaluated
 * @param  {string(any|all)} operator
 * @param  {Almanac} almanac
 * @return {Promise(boolean)} rule evaluation result
 */
export default function prioritizeAndRun (
  conditions,
  operator,
  almanac,
  operatorMap,
  conditionMap
) {
  if (conditions.length === 0) {
    return Promise.resolve({
      result: true,
      conditions: []
    })
  }
  if (conditions.length === 1) {
    // no prioritizing is necessary, just evaluate the single condition
    return conditions[0]
      .evaluate(almanac, operatorMap, conditionMap)
      .then((condition) => ({
        result: condition.result,
        conditions: [condition]
      }))
  }
  const orderedSets = prioritizeConditions(conditions, almanac)
  let cursor = Promise.resolve()
  const conditionsResults = []
  // use for() loop over Array.forEach to support IE8 without polyfill
  for (let i = 0; i < orderedSets.length; i++) {
    const set = orderedSets[i]
    cursor = cursor.then((setResult) => {
      let skip = false
      // after the first set succeeds, don't fire off the remaining promises
      if (operator === 'any' && setResult === true) {
        debug(
          'prioritizeAndRun::detected truthy result; skipping remaining conditions'
        )
        skip = true
      }

      // after the first set fails, don't fire off the remaining promises
      if (operator === 'all' && setResult === false) {
        debug(
          'prioritizeAndRun::detected falsey result; skipping remaining conditions'
        )
        skip = true
      }
      if (skip) {
        for (let j = 0; j < set.length; j++) {
          const [index, condition] = set[j]
          conditionsResults[index] = condition.skip()
        }
        return setResult
      }
      // all conditions passed; proceed with running next set in parallel
      return Promise.all(
        set.map(([index, condition]) =>
          condition
            .evaluate(almanac, operatorMap, conditionMap)
            .then((result) => {
              conditionsResults[index] = result
              return result.result
            })
        )
      ).then((allResults) => {
        if (operator === 'all') {
          return allResults.every((result) => result)
        }
        return allResults.some((result) => result)
      })
    })
  }
  return cursor.then(result => ({
    result,
    conditions: conditionsResults
  }))
}
