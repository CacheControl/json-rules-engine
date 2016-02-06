'use strict'

import hash from 'object-hash'

let debug = require('debug')('json-business-rules')

class Fact {
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
    this.options = options
    this.cacheKeyMethod = this.defaultCacheKeys
    return this
  }

  calculate (params, engine) {
    // if constant fact w/set value, return immediately
    if (this.hasOwnProperty('value')) {
      return this.value
    }
    return this.calculationMethod(params, engine)
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
