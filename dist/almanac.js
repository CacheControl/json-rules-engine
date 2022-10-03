'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fact = require('./fact');

var _fact2 = _interopRequireDefault(_fact);

var _errors = require('./errors');

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

var _jsonpathPlus = require('jsonpath-plus');

var _lodash = require('lodash.isobjectlike');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function defaultPathResolver(value, path) {
  return (0, _jsonpathPlus.JSONPath)({ path: path, json: value, wrap: false });
}

/**
 * Fact results lookup
 * Triggers fact computations and saves the results
 * A new almanac is used for every engine run()
 */

var Almanac = function () {
  function Almanac(factMap) {
    var runtimeFacts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Almanac);

    this.factMap = new Map(factMap);
    this.factResultsCache = new Map(); // { cacheKey:  Promise<factValu> }
    this.allowUndefinedFacts = Boolean(options.allowUndefinedFacts);
    this.pathResolver = options.pathResolver || defaultPathResolver;
    this.events = { success: [], failure: [] };
    this.ruleResults = [];

    for (var factId in runtimeFacts) {
      var fact = void 0;
      if (runtimeFacts[factId] instanceof _fact2.default) {
        fact = runtimeFacts[factId];
      } else {
        fact = new _fact2.default(factId, runtimeFacts[factId]);
      }

      this._addConstantFact(fact);
      (0, _debug2.default)('almanac::constructor initialized runtime fact:' + fact.id + ' with ' + fact.value + '<' + _typeof(fact.value) + '>');
    }
  }

  /**
   * Adds a success event
   * @param {Object} event
   */


  _createClass(Almanac, [{
    key: 'addEvent',
    value: function addEvent(event, outcome) {
      if (!outcome) throw new Error('outcome required: "success" | "failure"]');
      this.events[outcome].push(event);
    }

    /**
     * retrieve successful events
     */

  }, {
    key: 'getEvents',
    value: function getEvents() {
      var outcome = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      if (outcome) return this.events[outcome];
      return this.events.success.concat(this.events.failure);
    }

    /**
     * Adds a rule result
     * @param {Object} event
     */

  }, {
    key: 'addResult',
    value: function addResult(ruleResult) {
      this.ruleResults.push(ruleResult);
    }

    /**
     * retrieve successful events
     */

  }, {
    key: 'getResults',
    value: function getResults() {
      return this.ruleResults;
    }

    /**
     * Retrieve fact by id, raising an exception if it DNE
     * @param  {String} factId
     * @return {Fact}
     */

  }, {
    key: '_getFact',
    value: function _getFact(factId) {
      return this.factMap.get(factId);
    }

    /**
     * Registers fact with the almanac
     * @param {[type]} fact [description]
     */

  }, {
    key: '_addConstantFact',
    value: function _addConstantFact(fact) {
      this.factMap.set(fact.id, fact);
      this._setFactValue(fact, {}, fact.value);
    }

    /**
     * Sets the computed value of a fact
     * @param {Fact} fact
     * @param {Object} params - values for differentiating this fact value from others, used for cache key
     * @param {Mixed} value - computed value
     */

  }, {
    key: '_setFactValue',
    value: function _setFactValue(fact, params, value) {
      var cacheKey = fact.getCacheKey(params);
      var factValue = Promise.resolve(value);
      if (cacheKey) {
        this.factResultsCache.set(cacheKey, factValue);
      }
      return factValue;
    }

    /**
     * Adds a constant fact during runtime.  Can be used mid-run() to add additional information
     * @param {String} fact - fact identifier
     * @param {Mixed} value - constant value of the fact
     */

  }, {
    key: 'addRuntimeFact',
    value: function addRuntimeFact(factId, value) {
      (0, _debug2.default)('almanac::addRuntimeFact id:' + factId);
      var fact = new _fact2.default(factId, value);
      return this._addConstantFact(fact);
    }

    /**
     * Returns the value of a fact, based on the given parameters.  Utilizes the 'almanac' maintained
     * by the engine, which cache's fact computations based on parameters provided
     * @param  {string} factId - fact identifier
     * @param  {Object} params - parameters to feed into the fact.  By default, these will also be used to compute the cache key
     * @param  {String} path - object
     * @return {Promise} a promise which will resolve with the fact computation.
     */

  }, {
    key: 'factValue',
    value: function factValue(factId) {
      var _this = this;

      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

      var factValuePromise = void 0;
      var fact = this._getFact(factId);
      if (fact === undefined) {
        if (this.allowUndefinedFacts) {
          return Promise.resolve(undefined);
        } else {
          return Promise.reject(new _errors.UndefinedFactError('Undefined fact: ' + factId));
        }
      }
      if (fact.isConstant()) {
        factValuePromise = Promise.resolve(fact.calculate(params, this));
      } else {
        var cacheKey = fact.getCacheKey(params);
        var cacheVal = cacheKey && this.factResultsCache.get(cacheKey);
        if (cacheVal) {
          factValuePromise = Promise.resolve(cacheVal);
          (0, _debug2.default)('almanac::factValue cache hit for fact:' + factId);
        } else {
          (0, _debug2.default)('almanac::factValue cache miss for fact:' + factId + '; calculating');
          factValuePromise = this._setFactValue(fact, params, fact.calculate(params, this));
        }
      }
      if (path) {
        (0, _debug2.default)('condition::evaluate extracting object property ' + path);
        return factValuePromise.then(function (factValue) {
          if ((0, _lodash2.default)(factValue)) {
            var pathValue = _this.pathResolver(factValue, path);
            (0, _debug2.default)('condition::evaluate extracting object property ' + path + ', received: ' + JSON.stringify(pathValue));
            return pathValue;
          } else {
            (0, _debug2.default)('condition::evaluate could not compute object path(' + path + ') of non-object: ' + factValue + ' <' + (typeof factValue === 'undefined' ? 'undefined' : _typeof(factValue)) + '>; continuing with ' + factValue);
            return factValue;
          }
        });
      }

      return factValuePromise;
    }
  }]);

  return Almanac;
}();

exports.default = Almanac;