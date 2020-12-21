'use strict'

import Fact from './fact'
import { UndefinedFactError } from './errors'
import debug from './debug'

import { JSONPath } from 'jsonpath-plus'
import isObjectLike from 'lodash.isobjectlike'

function defaultPathResolver (value, path) {
  return JSONPath({ path, json: value, wrap: false })
}

/**
 * Fact results lookup
 * Triggers fact computations and saves the results
 * A new almanac is used for every engine run()
 */
export default class Almanac {
  constructor (factMap, runtimeFacts = {}, options = {}) {
    this.factMap = new Map(factMap)
    this.factResultsCache = new Map() // { cacheKey:  Promise<factValu> }
    this.allowUndefinedFacts = Boolean(options.allowUndefinedFacts)
    this.pathResolver = options.pathResolver || defaultPathResolver
    this.events = { success: [], failure: [] }
    this.ruleResults = []

    for (const factId in runtimeFacts) {
      let fact
      if (runtimeFacts[factId] instanceof Fact) {
        fact = runtimeFacts[factId]
      } else {
        fact = new Fact(factId, runtimeFacts[factId])
      }

      this._addConstantFact(fact)
      debug(`almanac::constructor initialized runtime fact:${fact.id} with ${fact.value}<${typeof fact.value}>`)
    }
  }

  /**
   * Adds a success event
   * @param {Object} event
   */
  addEvent (event, outcome) {
    if (!outcome) throw new Error('outcome required: "success" | "failure"]')
    this.events[outcome].push(event)
  }

  /**
   * retrieve successful events
   */
  getEvents (outcome = '') {
    if (outcome) return this.events[outcome]
    return this.events.success.concat(this.events.failure)
  }

  /**
   * Adds a rule result
   * @param {Object} event
   */
  addResult (ruleResult) {
    this.ruleResults.push(ruleResult)
  }

  /**
   * retrieve successful events
   */
  getResults () {
    return this.ruleResults
  }

  /**
   * Retrieve fact by id, raising an exception if it DNE
   * @param  {String} factId
   * @return {Fact}
   */
  _getFact (factId) {
    return this.factMap.get(factId)
  }

  /**
   * Registers fact with the almanac
   * @param {[type]} fact [description]
   */
  _addConstantFact (fact) {
    this.factMap.set(fact.id, fact)
    this._setFactValue(fact, {}, fact.value)
  }

  /**
   * Sets the computed value of a fact
   * @param {Fact} fact
   * @param {Object} params - values for differentiating this fact value from others, used for cache key
   * @param {Mixed} value - computed value
   */
  _setFactValue (fact, params, value) {
    const cacheKey = fact.getCacheKey(params)
    const factValue = Promise.resolve(value)
    if (cacheKey) {
      this.factResultsCache.set(cacheKey, factValue)
    }
    return factValue
  }

  /**
   * Adds a constant fact during runtime.  Can be used mid-run() to add additional information
   * @param {String} fact - fact identifier
   * @param {Mixed} value - constant value of the fact
   */
  addRuntimeFact (factId, value) {
    debug(`almanac::addRuntimeFact id:${factId}`)
    const fact = new Fact(factId, value)
    return this._addConstantFact(fact)
  }

  /**
   * Returns the value of a fact, based on the given parameters.  Utilizes the 'almanac' maintained
   * by the engine, which cache's fact computations based on parameters provided
   * @param  {string} factId - fact identifier
   * @param  {Object} params - parameters to feed into the fact.  By default, these will also be used to compute the cache key
   * @param  {String} path - object
   * @return {Promise} a promise which will resolve with the fact computation.
   */
  factValue (factId, params = {}, path = '') {
    let factValuePromise
    const fact = this._getFact(factId)
    if (fact === undefined) {
      if (this.allowUndefinedFacts) {
        return Promise.resolve(undefined)
      } else {
        return Promise.reject(new UndefinedFactError(`Undefined fact: ${factId}`))
      }
    }
    if (fact.isConstant()) {
      factValuePromise = Promise.resolve(fact.calculate(params, this))
    } else {
      const cacheKey = fact.getCacheKey(params)
      const cacheVal = cacheKey && this.factResultsCache.get(cacheKey)
      if (cacheVal) {
        factValuePromise = Promise.resolve(cacheVal)
        debug(`almanac::factValue cache hit for fact:${factId}`)
      } else {
        debug(`almanac::factValue cache miss for fact:${factId}; calculating`)
        factValuePromise = this._setFactValue(fact, params, fact.calculate(params, this))
      }
    }
    if (path) {
      debug(`condition::evaluate extracting object property ${path}`)
      return factValuePromise
        .then(factValue => {
          if (isObjectLike(factValue)) {
            const pathValue = this.pathResolver(factValue, path)
            debug(`condition::evaluate extracting object property ${path}, received: ${JSON.stringify(pathValue)}`)
            return pathValue
          } else {
            debug(`condition::evaluate could not compute object path(${path}) of non-object: ${factValue} <${typeof factValue}>; continuing with ${factValue}`)
            return factValue
          }
        })
    }

    return factValuePromise
  }
}
