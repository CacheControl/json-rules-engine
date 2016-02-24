'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fact = require('./fact');

var _fact2 = _interopRequireDefault(_fact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = require('debug')('json-rules-engine');

/**
 * Fact results lookup
 * Triggers fact computations and saves the results
 * A new almanac is used for every engine run()
 */

var Almanac = function () {
  function Almanac(factMap) {
    var runtimeFacts = arguments.length <= 1 || arguments[1] === undefined ? new Map() : arguments[1];

    _classCallCheck(this, Almanac);

    this.factMap = factMap;
    this.runtimeFacts = new Map();
    this.factResultsCache = new Map();

    for (var factId in runtimeFacts) {
      var fact = new _fact2.default(factId, runtimeFacts[factId]);
      this.factResultsCache.set(fact.id, fact.value);
      this.runtimeFacts.set(fact.id, fact);
      debug('almanac::constructor initialized runtime fact \'' + fact.id + '\' with \'' + fact.value + '\'');
    }
  }

  /**
   * Returns the value of a fact, based on the given parameters.  Utilizes the 'almanac' maintained
   * by the engine, which cache's fact computations based on parameters provided
   * @param  {string} factId - fact identifier
   * @param  {Object} params - parameters to feed into the fact.  By default, these will also be used to compute the cache key
   * @return {Promise} a promise which will resolve with the fact computation.
   */

  _createClass(Almanac, [{
    key: 'factValue',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(factId) {
        var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var fact, cacheKey, cacheVal;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                fact = this.runtimeFacts.get(factId);

                if (!(fact !== undefined)) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return', fact.value);

              case 3:
                fact = this.factMap.get(factId);

                if (!(fact === undefined)) {
                  _context.next = 6;
                  break;
                }

                throw new Error('Undefined fact: ' + factId);

              case 6:
                cacheKey = fact.getCacheKey(params);
                cacheVal = cacheKey && this.factResultsCache.get(cacheKey);

                if (!cacheVal) {
                  _context.next = 11;
                  break;
                }

                debug('almanac::factValue cache hit for \'' + factId + '\' cacheKey:' + cacheKey);
                return _context.abrupt('return', cacheVal);

              case 11:
                debug('almanac::factValue cache miss for \'' + factId + '\' using cacheKey:' + cacheKey + '; calculating');
                cacheVal = fact.calculate(params, this);
                debug('almanac::factValue \'' + factId + '\' calculated as: ' + cacheVal);
                if (cacheKey) {
                  this.factResultsCache.set(cacheKey, cacheVal);
                }
                return _context.abrupt('return', cacheVal);

              case 16:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function factValue(_x2, _x3) {
        return ref.apply(this, arguments);
      };
    }()
  }]);

  return Almanac;
}();

exports.default = Almanac;