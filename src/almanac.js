'use strict'

let debug = require('debug')('json-rules-engine')
let verbose = require('debug')('json-rules-engine-verbose')
let selectn = require('selectn')
let isPlainObject = require('lodash.isplainobject')
let warn = require('debug')('json-rules-engine:warn')

import Fact from './fact'
import { UndefinedFactError } from './errors'

/**
 * Fact results lookup
 * Triggers fact computations and saves the results
 * A new almanac is used for every engine run()
 */
export default class Almanac {
  constructor (factMap, runtimeFacts = {}) {
    this.factMap = new Map(factMap)
    this.factResultsCache = new Map()

    for (let factId in runtimeFacts) {
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
   * Retrieve fact by id, raising an exception if it DNE
   * @param  {String} factId
   * @return {Fact}
   */
  _getFact (factId) {
    let fact = this.factMap.get(factId)
    if (fact === undefined) {
      throw new UndefinedFactError(`Undefined fact: ${factId}`)
    }
    return fact
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
    let cacheKey = fact.getCacheKey(params)
    let factValue = Promise.resolve(value)
    factValue.then(val => debug(`almanac::factValue fact:${fact.id} calculated as: ${JSON.stringify(val)}<${typeof val}>`))
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
    let fact = new Fact(factId, value)
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
  async factValue (factId, params = {}, path = '') {
    let fact = this._getFact(factId)
    let cacheKey = fact.getCacheKey(params)
    let cacheVal = cacheKey && this.factResultsCache.get(cacheKey)
    if (cacheVal) {
      cacheVal.then(val => debug(`almanac::factValue cache hit for fact:${factId} value: ${JSON.stringify(val)}<${typeof val}>`))
      return cacheVal
    }
    verbose(`almanac::factValue cache miss for fact:${factId}; calculating`)
    let factValue = await this._setFactValue(fact, params, fact.calculate(params, this))
    if (path) {
      if (isPlainObject(factValue) || Array.isArray(factValue)) {
        factValue = selectn(path)(factValue)
        debug(`condition::evaluate extracting object property ${path}, received: ${factValue}`)
      } else {
        warn(`condition::evaluate could not compute object path(${path}) of non-object: ${factValue} <${typeof factValue}>; continuing with ${factValue}`)
      }
    }
    return factValue
  }
}
