'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fact = require('./fact');

var _fact2 = _interopRequireDefault(_fact);

var _errors = require('./errors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = require('debug')('json-rules-engine');
var verbose = require('debug')('json-rules-engine-verbose');
var selectn = require('selectn');
var isPlainObject = require('lodash.isplainobject');
var warn = require('debug')('json-rules-engine:warn');

/**
 * Fact results lookup
 * Triggers fact computations and saves the results
 * A new almanac is used for every engine run()
 */
var Almanac = function () {
  function Almanac(factMap) {
    var runtimeFacts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Almanac);

    this.factMap = new Map(factMap);
    this.factResultsCache = new Map(); // { cacheKey:  Promise<factValu> }

    for (var factId in runtimeFacts) {
      var fact = void 0;
      if (runtimeFacts[factId] instanceof _fact2.default) {
        fact = runtimeFacts[factId];
      } else {
        fact = new _fact2.default(factId, runtimeFacts[factId]);
      }

      this._addConstantFact(fact);
      debug('almanac::constructor initialized runtime fact:' + fact.id + ' with ' + fact.value + '<' + _typeof(fact.value) + '>');
    }
  }

  /**
   * Retrieve fact by id, raising an exception if it DNE
   * @param  {String} factId
   * @return {Fact}
   */


  _createClass(Almanac, [{
    key: '_getFact',
    value: function _getFact(factId) {
      var fact = this.factMap.get(factId);
      if (fact === undefined) {
        throw new _errors.UndefinedFactError('Undefined fact: ' + factId);
      }
      return fact;
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
      factValue.then(function (val) {
        return debug('almanac::factValue fact:' + fact.id + ' calculated as: ' + JSON.stringify(val) + '<' + (typeof val === 'undefined' ? 'undefined' : _typeof(val)) + '>');
      });
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
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(factId) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
        var factValue, fact, cacheKey, cacheVal;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                factValue = void 0;
                fact = this._getFact(factId);
                cacheKey = fact.getCacheKey(params);
                cacheVal = cacheKey && this.factResultsCache.get(cacheKey);

                if (!cacheVal) {
                  _context.next = 11;
                  break;
                }

                _context.next = 7;
                return cacheVal;

              case 7:
                factValue = _context.sent;

                debug('almanac::factValue cache hit for fact:' + factId + ' value: ' + JSON.stringify(factValue) + '<' + (typeof factValue === 'undefined' ? 'undefined' : _typeof(factValue)) + '>');
                _context.next = 15;
                break;

              case 11:
                verbose('almanac::factValue cache miss for fact:' + factId + '; calculating');
                _context.next = 14;
                return this._setFactValue(fact, params, fact.calculate(params, this));

              case 14:
                factValue = _context.sent;

              case 15:
                if (path) {
                  if (isPlainObject(factValue) || Array.isArray(factValue)) {
                    factValue = selectn(path)(factValue);
                    debug('condition::evaluate extracting object property ' + path + ', received: ' + factValue);
                  } else {
                    warn('condition::evaluate could not compute object path(' + path + ') of non-object: ' + factValue + ' <' + (typeof factValue === 'undefined' ? 'undefined' : _typeof(factValue)) + '>; continuing with ' + factValue);
                  }
                }
                return _context.abrupt('return', factValue);

              case 17:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function factValue(_x2) {
        return _ref.apply(this, arguments);
      }

      return factValue;
    }()
  }]);

  return Almanac;
}();

exports.default = Almanac;