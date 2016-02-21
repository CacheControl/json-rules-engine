'use strict'

let debug = require('debug')('json-rules-engine')

import Fact from './fact'

/**
 * Fact results lookup
 * Triggers fact computations and saves the results
 * A new almanac is used for every engine run()
 */
export default class Almanac {
  constructor (factMap, runtimeFacts = new Map()) {
    this.factMap = factMap
    this.runtimeFacts = new Map()
    this.factResultsCache = new Map()

    for (let factId in runtimeFacts) {
      let fact = new Fact(factId, runtimeFacts[factId])
      this.factResultsCache.set(fact.id, fact.value)
      this.runtimeFacts.set(fact.id, fact)
      debug(`almanac::constructor initialized runtime fact '${fact.id}' with '${fact.value}'`)
    }
  }

  /**
   * Returns the value of a fact, based on the given parameters.  Utilizes the 'almanac' maintained
   * by the engine, which cache's fact computations based on parameters provided
   * @param  {string} factId - fact identifier
   * @param  {Object} params - parameters to feed into the fact.  By default, these will also be used to compute the cache key
   * @return {Promise} a promise which will resolve with the fact computation.
   */
  async factValue (factId, params = {}) {
    let fact = this.runtimeFacts.get(factId)
    if (fact !== undefined) {
      return fact.value
    }
    fact = this.factMap.get(factId)
    if (fact === undefined) {
      throw new Error(`Undefined fact: ${factId}`)
    }
    let cacheKey = fact.getCacheKey(params)
    let cacheVal = cacheKey && this.factResultsCache.get(cacheKey)
    if (cacheVal) {
      debug(`almanac::factValue cache hit for '${factId}' cacheKey:${cacheKey}`)
      return cacheVal
    }
    debug(`almanac::factValue cache miss for '${factId}' using cacheKey:${cacheKey}; calculating`)
    cacheVal = fact.calculate(params, this)
    debug(`almanac::factValue '${factId}' calculated as: ${cacheVal}`)
    if (cacheKey) {
      this.factResultsCache.set(cacheKey, cacheVal)
    }
    return cacheVal
  }
}
