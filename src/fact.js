'use strict'

import hash from 'object-hash'

let debug = require('debug')('json-business-rules')

class Fact {
  constructor (id, options, calculationMethod) {
    this.id = id
    let defaultOptions = { cache: true }
    if (typeof options === 'function') {
      calculationMethod = options
      options = defaultOptions
    } else if (typeof options === 'undefined') {
      options = defaultOptions
    }
    this.priority = parseInt(options.priority || 1, 10)
    this.options = options
    this.calculate = calculationMethod
    this.cacheKeyMethod = this.defaultCacheKeys
    return this
  }

  // todo, rename 'calculate', 'definition'
  definition (calculate, initialValue) {
    this.calculate = calculate
    if (typeof (initialValue) !== 'undefined') {
      this.value = initialValue
    }
    return this
  }

  static hashFromObject (obj) {
    debug(`fact::hashFromObject generating cache key from:`, obj)
    return hash(obj)
  }

  defaultCacheKeys (id, params) {
    return { params, id }
  }

  getCacheKey (params) {
    if (this.options.cache === true) {
      let cacheProperties = this.cacheKeyMethod(this.id, params)
      return Fact.hashFromObject(cacheProperties)
    }
  }
}

export default Fact
