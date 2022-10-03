'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hashIt = require('hash-it');

var _hashIt2 = _interopRequireDefault(_hashIt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Fact = function () {
  /**
   * Returns a new fact instance
   * @param  {string} id - fact unique identifer
   * @param  {object} options
   * @param  {boolean} options.cache - whether to cache the fact's value for future rules
   * @param  {primitive|function} valueOrMethod - constant primitive, or method to call when computing the fact's value
   * @return {Fact}
   */
  function Fact(id, valueOrMethod, options) {
    _classCallCheck(this, Fact);

    this.id = id;
    var defaultOptions = { cache: true };
    if (typeof options === 'undefined') {
      options = defaultOptions;
    }
    if (typeof valueOrMethod !== 'function') {
      this.value = valueOrMethod;
      this.type = this.constructor.CONSTANT;
    } else {
      this.calculationMethod = valueOrMethod;
      this.type = this.constructor.DYNAMIC;
    }

    if (!this.id) throw new Error('factId required');

    this.priority = parseInt(options.priority || 1, 10);
    this.options = Object.assign({}, defaultOptions, options);
    this.cacheKeyMethod = this.defaultCacheKeys;
    return this;
  }

  _createClass(Fact, [{
    key: 'isConstant',
    value: function isConstant() {
      return this.type === this.constructor.CONSTANT;
    }
  }, {
    key: 'isDynamic',
    value: function isDynamic() {
      return this.type === this.constructor.DYNAMIC;
    }

    /**
     * Return the fact value, based on provided parameters
     * @param  {object} params
     * @param  {Almanac} almanac
     * @return {any} calculation method results
     */

  }, {
    key: 'calculate',
    value: function calculate(params, almanac) {
      // if constant fact w/set value, return immediately
      if (Object.prototype.hasOwnProperty.call(this, 'value')) {
        return this.value;
      }
      return this.calculationMethod(params, almanac);
    }

    /**
     * Return a cache key (MD5 string) based on parameters
     * @param  {object} obj - properties to generate a hash key from
     * @return {string} MD5 string based on the hash'd object
     */

  }, {
    key: 'defaultCacheKeys',


    /**
     * Default properties to use when caching a fact
     * Assumes every fact is a pure function, whose computed value will only
     * change when input params are modified
     * @param  {string} id - fact unique identifer
     * @param  {object} params - parameters passed to fact calcution method
     * @return {object} id + params
     */
    value: function defaultCacheKeys(id, params) {
      return { params: params, id: id };
    }

    /**
     * Generates the fact's cache key(MD5 string)
     * Returns nothing if the fact's caching has been disabled
     * @param  {object} params - parameters that would be passed to the computation method
     * @return {string} cache key
     */

  }, {
    key: 'getCacheKey',
    value: function getCacheKey(params) {
      if (this.options.cache === true) {
        var cacheProperties = this.cacheKeyMethod(this.id, params);
        var _hash = Fact.hashFromObject(cacheProperties);
        return _hash;
      }
    }
  }], [{
    key: 'hashFromObject',
    value: function hashFromObject(obj) {
      return (0, _hashIt2.default)(obj);
    }
  }]);

  return Fact;
}();

Fact.CONSTANT = 'CONSTANT';
Fact.DYNAMIC = 'DYNAMIC';

exports.default = Fact;