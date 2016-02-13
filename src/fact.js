'use strict'

import hash from 'object-hash'

let debug = require('debug')('json-rules-engine')

class Fact {
  /**
   * Returns a new fact instance
   * @param  {string} id - fact unique identifer
   * @param  {object} options
   * @param  {boolean} options.cache - whether to cache the fact's value for future rules
   * @param  {primitive|function} valueOrMethod - constant primitive, or method to call when computing the fact's value
   * @return {Fact}
   */
  constructor (id, options, valueOrMethod) {
    this.id = id
    let defaultOptions = { cache: true }
    if (typeof options === 'function') {
      valueOrMethod = options
      options = defaultOptions
    } else if (typeof options === 'undefined') {
      options = defaultOptions
    }
    if (typeof valueOrMethod !== 'function') {
      this.value = valueOrMethod
    } else {
      this.calculationMethod = valueOrMethod
    }
    this.priority = parseInt(options.priority || 1, 10)
    this.options = Object.assign({}, defaultOptions, options)
    this.cacheKeyMethod = this.defaultCacheKeys
    return this
  }

  /**
   * Return the fact value, based on provided parameters
   * @param  {object} params
   * @param  {Engine} engine
   * @return {any} calculation method results
   */
  calculate (params, engine) {
    // if constant fact w/set value, return immediately
    if (this.hasOwnProperty('value')) {
      return this.value
    }
    return this.calculationMethod(params, engine)
  }

  /**
   * Return a cache key (MD5 string) based on parameters
   * @param  {object} obj - properties to generate a hash key from
   * @return {string} MD5 string based on the hash'd object
   */
  static hashFromObject (obj) {
    debug(`fact::hashFromObject generating cache key from:`, obj)
    return hash(obj)
  }

  /**
   * Default properties to use when caching a fact
   * Assumes every fact is a pure function, whose computed value will only
   * change when input params are modified
   * @param  {string} id - fact unique identifer
   * @param  {object} params - parameters passed to fact calcution method
   * @return {object} id + params
   */
  defaultCacheKeys (id, params) {
    return { params, id }
  }

  /**
   * Generates the fact's cache key(MD5 string)
   * Returns nothing if the fact's caching has been disabled
   * @param  {object} params - parameters that would be passed to the computation method
   * @return {string} cache key
   */
  getCacheKey (params) {
    if (this.options.cache === true) {
      let cacheProperties = this.cacheKeyMethod(this.id, params)
      return Fact.hashFromObject(cacheProperties)
    }
  }
}

export default Fact
