'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FINISHED = exports.RUNNING = exports.READY = undefined;

var _params = require('params');

var _params2 = _interopRequireDefault(_params);

var _fact = require('./fact');

var _fact2 = _interopRequireDefault(_fact);

var _rule = require('./rule');

var _rule2 = _interopRequireDefault(_rule);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = require('debug')('json-rules-engine');

var READY = exports.READY = 'READY';
var RUNNING = exports.RUNNING = 'RUNNING';
var FINISHED = exports.FINISHED = 'FINISHED';

var Engine = function (_EventEmitter) {
  _inherits(Engine, _EventEmitter);

  /**
   * Returns a new Engine instance
   * @param  {Rule[]} rules - array of rules to initialize with
   */

  function Engine() {
    var rules = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, Engine);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Engine).call(this));

    _this.rules = [];
    rules.forEach(function (r) {
      return _this.addRule(r);
    });
    _this.facts = new Map();
    _this.factResultsCache = new Map();
    _this.status = READY;
    return _this;
  }

  /**
   * Add a rule definition to the engine
   * @param {object|Rule} properties - rule definition.  can be JSON representation, or instance of Rule
   * @param {integer} properties.priority (>1) - higher runs sooner.
   * @param {Object} properties.event - event to fire when rule evaluates as successful
   * @param {string} properties.event.type - name of event to emit
   * @param {string} properties.event.params - parameters to pass to the event listener
   * @param {Object} properties.conditions - conditions to evaluate when processing this rule
   */

  _createClass(Engine, [{
    key: 'addRule',
    value: function addRule(properties) {
      (0, _params2.default)(properties).require(['conditions', 'event']);

      var rule = undefined;
      if (properties instanceof _rule2.default) {
        rule = properties;
      } else {
        rule = new _rule2.default(properties);
      }
      rule.setEngine(this);

      this.rules.push(rule);
      this.prioritizedRules = null;
    }

    /**
     * Add a fact definition to the engine.  Facts are called by rules as they are evaluated.
     * @param {object|Fact} id - fact identifier or instance of Fact
     * @param {function} definitionFunc - function to be called when computing the fact value for a given rule
     * @param {Object} options - options to initialize the fact with. used when "id" is not a Fact instance
     */

  }, {
    key: 'addFact',
    value: function addFact(id, valueOrMethod, options) {
      var factId = id;
      var fact = undefined;
      if (id instanceof _fact2.default) {
        factId = id.id;
        fact = id;
      } else {
        fact = new _fact2.default(id, valueOrMethod, options);
      }
      debug('engine::addFact id:' + factId);
      this.facts.set(factId, fact);
    }

    /**
     * Returns a fact from the engine, by fact-id
     * @param  {string} factId - fact identifier
     * @return {Fact} fact instance, or undefined if no such fact exists
     */

  }, {
    key: 'getFact',
    value: function getFact(factId) {
      return this.facts.get(factId);
    }

    /**
     * Returns the value of a fact, based on the given parameters.  Utilizes the 'factResultsCache' maintained
     * by the engine, which cache's fact computations based on parameters provided
     * @param  {string} factId - fact identifier
     * @param  {Object} params - parameters to feed into the fact.  By default, these will also be used to compute the cache key
     * @return {Promise} a promise which will resolve with the fact computation.
     */

  }, {
    key: 'factValue',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(factId) {
        var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var fact, cacheKey, cacheVal;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                fact = this.facts.get(factId);

                if (fact) {
                  _context.next = 3;
                  break;
                }

                throw new Error('Undefined fact: ' + factId);

              case 3:
                cacheKey = fact.getCacheKey(params);
                cacheVal = cacheKey && this.factResultsCache.get(cacheKey);

                if (!cacheVal) {
                  _context.next = 8;
                  break;
                }

                debug('engine::factValue cache hit for \'' + factId + '\' cacheKey:' + cacheKey);
                return _context.abrupt('return', cacheVal);

              case 8:
                debug('engine::factValue cache miss for \'' + factId + '\' using cacheKey:' + cacheKey + '; calculating');
                cacheVal = fact.calculate(params, this);
                debug('engine::factValue \'' + factId + '\' calculated as: ' + cacheVal);
                if (cacheKey) {
                  this.factResultsCache.set(cacheKey, cacheVal);
                }
                return _context.abrupt('return', cacheVal);

              case 13:
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

    /**
     * Iterates over the engine rules, organizing them by highest -> lowest priority
     * @return {Rule[][]} two dimensional array of Rules.
     *    Each outer array element represents a single priority(integer).  Inner array is
     *    all rules with that priority.
     */

  }, {
    key: 'prioritizeRules',
    value: function prioritizeRules() {
      var _this2 = this;

      if (!this.prioritizedRules) {
        (function () {
          var ruleSets = _this2.rules.reduce(function (sets, rule) {
            var priority = rule.priority;
            if (!sets[priority]) sets[priority] = [];
            sets[priority].push(rule);
            return sets;
          }, {});
          _this2.prioritizedRules = Object.keys(ruleSets).sort(function (a, b) {
            return Number(a) > Number(b) ? -1 : 1; // order highest priority -> lowest
          }).map(function (priority) {
            return ruleSets[priority];
          });
        })();
      }
      return this.prioritizedRules;
    }

    /**
     * Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
     * and no further events emitted.  Since rules of the same priority are evaluated in parallel(not series), other rules of
     * the same priority may still emit events, even though the engine is in a "finished" state.
     * @return {Engine}
     */

  }, {
    key: 'stop',
    value: function stop() {
      this.status = FINISHED;
      return this;
    }

    /**
     * Runs an array of rules
     * @param  {Rule[]} array of rules to be evaluated
     * @return {Promise} resolves when all rules in the array have been evaluated
     */

  }, {
    key: 'evaluateRules',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(ruleArray) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', Promise.all(ruleArray.map(function (rule) {
                  if (_this3.status !== RUNNING) {
                    debug('engine::run status:' + _this3.status + '; skipping remaining rules');
                    return;
                  }
                  return rule.evaluate(_this3).then(function (rulePasses) {
                    debug('engine::run ruleResult:' + rulePasses);
                    if (rulePasses) {
                      _this3.emit('success', rule.event, _this3);
                      _this3.emit(rule.event.type, rule.event.params, _this3);
                    }
                    if (!rulePasses) _this3.emit('failure', rule, _this3);
                  });
                })));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function evaluateRules(_x5) {
        return ref.apply(this, arguments);
      };
    }()

    /**
     * Runs the rules engine
     * @param  {Object} initialFacts - fact values known at runtime
     * @param  {Object} runOptions - run options
     * @return {Promise} resolves when the engine has completed running
     */

  }, {
    key: 'run',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var _this4 = this;

        var initialFacts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var runOptions = arguments.length <= 1 || arguments[1] === undefined ? { clearFactResultsCache: true } : arguments[1];
        var key, orderedSets, cursor;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                debug('engine::run initialFacts:', initialFacts);
                this.status = RUNNING;
                if (runOptions.clearFactResultsCache) {
                  this.factResultsCache.clear();
                }
                for (key in initialFacts) {
                  this.addFact(key, initialFacts[key]);
                }

                orderedSets = this.prioritizeRules();
                cursor = Promise.resolve();
                // for each rule set, evaluate in parallel,
                // before proceeding to the next priority set.

                return _context3.abrupt('return', new Promise(function (resolve, reject) {
                  orderedSets.map(function (set) {
                    cursor = cursor.then(function () {
                      return _this4.evaluateRules(set);
                    }).catch(reject);
                    return cursor;
                  });
                  cursor.then(function () {
                    _this4.status = FINISHED;
                    resolve();
                  }).catch(reject);
                }));

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function run(_x6, _x7) {
        return ref.apply(this, arguments);
      };
    }()
  }]);

  return Engine;
}(_events.EventEmitter);

exports.default = Engine;