'use strict'

import debug from './debug'

/**
 * Scoped Almanac for nested condition evaluation
 * Wraps a parent almanac but prioritizes item properties for fact resolution
 */
export default class ScopedAlmanac {
  constructor (parentAlmanac, item) {
    this.parentAlmanac = parentAlmanac
    this.item = item
  }

  /**
   * Retrieves a fact value, first checking if it's a property on the current item
   * @param {string} factId - fact identifier
   * @param {Object} params - parameters to feed into the fact
   * @param {string} path - object path
   * @return {Promise} resolves with the fact value
   */
  factValue (factId, params = {}, path = '') {
    // First check if factId is a property on the current item
    if (this.item != null && typeof this.item === 'object' &&
        Object.prototype.hasOwnProperty.call(this.item, factId)) {
      let value = this.item[factId]
      debug('scoped-almanac::factValue found property on item', { factId, value })
      // Apply path if provided
      if (path) {
        value = this.parentAlmanac.pathResolver(value, path)
        debug('scoped-almanac::factValue resolved path', { path, value })
      }
      return Promise.resolve(value)
    }
    // Fall back to parent almanac
    debug('scoped-almanac::factValue falling back to parent almanac', { factId })
    return this.parentAlmanac.factValue(factId, params, path)
  }

  /**
   * Interprets value as either a primitive, or if a fact, retrieves the fact value
   * Delegates to parent almanac's getValue
   * @param {*} value - the value to interpret
   * @return {Promise} resolves with the value
   */
  getValue (value) {
    // If the value references a fact, we need to resolve it through our scoped factValue
    if (value != null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'fact')) {
      return this.factValue(value.fact, value.params, value.path)
    }
    return Promise.resolve(value)
  }

  /**
   * Expose pathResolver from parent almanac
   * @returns {Function} the path resolver function
   */
  get pathResolver () {
    return this.parentAlmanac.pathResolver
  }
}
