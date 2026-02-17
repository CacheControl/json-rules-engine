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
   * Resolves a path directly on the current scoped item
   * Used by scoped conditions that have path but no fact
   * @param {string} path - JSONPath to resolve on the item (e.g., '$.state' or '$.nested.property')
   * @return {Promise} resolves with the value at the path
   */
  resolvePath (path) {
    if (this.item == null) {
      debug('scoped-almanac::resolvePath item is null')
      return Promise.resolve(undefined)
    }

    const value = this.parentAlmanac.pathResolver(this.item, path)
    debug('scoped-almanac::resolvePath', { path, value, item: this.item })
    return Promise.resolve(value)
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
   * Handles both fact references and path-only references for scoped conditions
   * @param {*} value - the value to interpret
   * @return {Promise} resolves with the value
   */
  getValue (value) {
    if (value != null && typeof value === 'object') {
      // If value references a fact, resolve through scoped factValue
      if (Object.prototype.hasOwnProperty.call(value, 'fact')) {
        return this.factValue(value.fact, value.params, value.path)
      }
      // If value only has a path (for scoped comparisons), resolve directly on item
      if (Object.prototype.hasOwnProperty.call(value, 'path') &&
          !Object.prototype.hasOwnProperty.call(value, 'fact')) {
        return this.resolvePath(value.path)
      }
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
