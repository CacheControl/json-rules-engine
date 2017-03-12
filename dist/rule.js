'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _params = require('params');

var _params2 = _interopRequireDefault(_params);

var _condition = require('./condition');

var _condition2 = _interopRequireDefault(_condition);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = require('debug')('json-rules-engine');

var Rule = function (_EventEmitter) {
  _inherits(Rule, _EventEmitter);

  /**
   * returns a new Rule instance
   * @param {object,string} options, or json string that can be parsed into options
   * @param {integer} options.priority (>1) - higher runs sooner.
   * @param {Object} options.event - event to fire when rule evaluates as successful
   * @param {string} options.event.type - name of event to emit
   * @param {string} options.event.params - parameters to pass to the event listener
   * @param {Object} options.conditions - conditions to evaluate when processing this rule
   * @return {Rule} instance
   */
  function Rule(options) {
    _classCallCheck(this, Rule);

    var _this = _possibleConstructorReturn(this, (Rule.__proto__ || Object.getPrototypeOf(Rule)).call(this));

    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    if (options && options.conditions) {
      _this.setConditions(options.conditions);
    }
    if (options && options.onSuccess) {
      _this.on('success', options.onSuccess);
    }
    if (options && options.onFailure) {
      _this.on('failure', options.onFailure);
    }

    var priority = options && options.priority || 1;
    _this.setPriority(priority);

    var event = options && options.event || { type: 'unknown' };
    _this.setEvent(event);
    return _this;
  }

  /**
   * Sets the priority of the rule
   * @param {integer} priority (>=1) - increasing the priority causes the rule to be run prior to other rules
   */


  _createClass(Rule, [{
    key: 'setPriority',
    value: function setPriority(priority) {
      priority = parseInt(priority, 10);
      if (priority <= 0) throw new Error('Priority must be greater than zero');
      this.priority = priority;
      return this;
    }

    /**
     * Sets the conditions to run when evaluating the rule.
     * @param {object} conditions - conditions, root element must be a boolean operator
     */

  }, {
    key: 'setConditions',
    value: function setConditions(conditions) {
      if (!conditions.hasOwnProperty('all') && !conditions.hasOwnProperty('any')) {
        throw new Error('"conditions" root must contain a single instance of "all" or "any"');
      }
      this.conditions = new _condition2.default(conditions);
      return this;
    }

    /**
     * Sets the event to emit when the conditions evaluate truthy
     * @param {object} event - event to emit
     * @param {string} event.type - event name to emit on
     * @param {string} event.params - parameters to emit as the argument of the event emission
     */

  }, {
    key: 'setEvent',
    value: function setEvent(event) {
      this.event = (0, _params2.default)(event).only(['type', 'params']);
      return this;
    }

    /**
     * Sets the engine to run the rules under
     * @param {object} engine
     * @returns {Rule}
     */

  }, {
    key: 'setEngine',
    value: function setEngine(engine) {
      this.engine = engine;
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var stringify = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      var props = {
        conditions: this.conditions.toJSON(false),
        priority: this.priority,
        event: this.event
      };
      if (stringify) {
        return JSON.stringify(props);
      }
      return props;
    }

    /**
     * Priorizes an array of conditions based on "priority"
     *   When no explicit priority is provided on the condition itself, the condition's priority is determine by its fact
     * @param  {Condition[]} conditions
     * @return {Condition[][]} prioritized two-dimensional array of conditions
     *    Each outer array element represents a single priority(integer).  Inner array is
     *    all conditions with that priority.
     */

  }, {
    key: 'prioritizeConditions',
    value: function prioritizeConditions(conditions) {
      var _this2 = this;

      var factSets = conditions.reduce(function (sets, condition) {
        // if a priority has been set on this specific condition, honor that first
        // otherwise, use the fact's priority
        var priority = condition.priority;
        if (!priority) {
          var fact = _this2.engine.getFact(condition.fact);
          priority = fact && fact.priority || 1;
        }
        if (!sets[priority]) sets[priority] = [];
        sets[priority].push(condition);
        return sets;
      }, {});
      return Object.keys(factSets).sort(function (a, b) {
        return Number(a) > Number(b) ? -1 : 1; // order highest priority -> lowest
      }).map(function (priority) {
        return factSets[priority];
      });
    }

    /**
     * Evaluates the rule, starting with the root boolean operator and recursing down
     * All evaluation is done within the context of an almanac
     * @return {Promise(boolean)} rule evaluation result
     */

  }, {
    key: 'evaluate',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(almanac) {
        var _this3 = this;

        var evaluateCondition, evaluateConditions, prioritizeAndRun, any, all;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                /**
                 * Evaluates the rule conditions
                 * @param  {Condition} condition - condition to evaluate
                 * @return {Promise(true|false)} - resolves with the result of the condition evaluation
                 */
                evaluateCondition = function () {
                  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(condition) {
                    var comparisonValue, passes, subConditions;
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            comparisonValue = void 0;
                            passes = void 0;

                            if (!condition.isBooleanOperator()) {
                              _context.next = 16;
                              break;
                            }

                            subConditions = condition[condition.operator];

                            if (!(condition.operator === 'all')) {
                              _context.next = 10;
                              break;
                            }

                            _context.next = 7;
                            return all(subConditions);

                          case 7:
                            comparisonValue = _context.sent;
                            _context.next = 13;
                            break;

                          case 10:
                            _context.next = 12;
                            return any(subConditions);

                          case 12:
                            comparisonValue = _context.sent;

                          case 13:
                            // for booleans, rule passing is determined by the all/any result
                            passes = comparisonValue === true;
                            _context.next = 29;
                            break;

                          case 16:
                            _context.prev = 16;
                            _context.next = 19;
                            return condition.evaluate(almanac, _this3.engine.operators, comparisonValue);

                          case 19:
                            passes = _context.sent;
                            _context.next = 29;
                            break;

                          case 22:
                            _context.prev = 22;
                            _context.t0 = _context['catch'](16);

                            if (!(_this3.engine.allowUndefinedFacts && _context.t0.code === 'UNDEFINED_FACT')) {
                              _context.next = 28;
                              break;
                            }

                            passes = false;
                            _context.next = 29;
                            break;

                          case 28:
                            throw _context.t0;

                          case 29:

                            if (passes) {
                              _this3.emit('success', _this3.event, almanac);
                            } else {
                              _this3.emit('failure', _this3.event, almanac);
                            }
                            return _context.abrupt('return', passes);

                          case 31:
                          case 'end':
                            return _context.stop();
                        }
                      }
                    }, _callee, _this3, [[16, 22]]);
                  }));

                  return function evaluateCondition(_x3) {
                    return _ref2.apply(this, arguments);
                  };
                }();

                /**
                 * Evalutes an array of conditions, using an 'every' or 'some' array operation
                 * @param  {Condition[]} conditions
                 * @param  {string(every|some)} array method to call for determining result
                 * @return {Promise(boolean)} whether conditions evaluated truthy or falsey based on condition evaluation + method
                 */


                evaluateConditions = function () {
                  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(conditions, method) {
                    var conditionResults;
                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            if (!Array.isArray(conditions)) conditions = [conditions];
                            _context2.next = 3;
                            return Promise.all(conditions.map(function (condition) {
                              return evaluateCondition(condition);
                            }));

                          case 3:
                            conditionResults = _context2.sent;

                            debug('rule::evaluateConditions results', conditionResults);
                            return _context2.abrupt('return', method.call(conditionResults, function (result) {
                              return result === true;
                            }));

                          case 6:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this3);
                  }));

                  return function evaluateConditions(_x4, _x5) {
                    return _ref3.apply(this, arguments);
                  };
                }();

                /**
                 * Evaluates a set of conditions based on an 'all' or 'any' operator.
                 *   First, orders the top level conditions based on priority
                 *   Iterates over each priority set, evaluating each condition
                 *   If any condition results in the rule to be guaranteed truthy or falsey,
                 *   it will short-circuit and not bother evaluating any additional rules
                 * @param  {Condition[]} conditions - conditions to be evaluated
                 * @param  {string('all'|'any')} operator
                 * @return {Promise(boolean)} rule evaluation result
                 */


                prioritizeAndRun = function () {
                  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(conditions, operator) {
                    var method, orderedSets, cursor;
                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            if (!(conditions.length === 0)) {
                              _context3.next = 2;
                              break;
                            }

                            return _context3.abrupt('return', true);

                          case 2:
                            method = Array.prototype.some;

                            if (operator === 'all') {
                              method = Array.prototype.every;
                            }
                            orderedSets = _this3.prioritizeConditions(conditions);
                            cursor = Promise.resolve();

                            orderedSets.forEach(function (set) {
                              var stop = false;
                              cursor = cursor.then(function (setResult) {
                                // after the first set succeeds, don't fire off the remaining promises
                                if (operator === 'any' && setResult === true || stop) {
                                  debug('prioritizeAndRun::detected truthy result; skipping remaining conditions');
                                  stop = true;
                                  return true;
                                }

                                // after the first set fails, don't fire off the remaining promises
                                if (operator === 'all' && setResult === false || stop) {
                                  debug('prioritizeAndRun::detected falsey result; skipping remaining conditions');
                                  stop = true;
                                  return false;
                                }
                                // all conditions passed; proceed with running next set in parallel
                                return evaluateConditions(set, method);
                              });
                            });
                            return _context3.abrupt('return', cursor);

                          case 8:
                          case 'end':
                            return _context3.stop();
                        }
                      }
                    }, _callee3, _this3);
                  }));

                  return function prioritizeAndRun(_x6, _x7) {
                    return _ref4.apply(this, arguments);
                  };
                }();

                /**
                 * Runs an 'any' boolean operator on an array of conditions
                 * @param  {Condition[]} conditions to be evaluated
                 * @return {Promise(boolean)} condition evaluation result
                 */


                any = function () {
                  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(conditions) {
                    return regeneratorRuntime.wrap(function _callee4$(_context4) {
                      while (1) {
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            return _context4.abrupt('return', prioritizeAndRun(conditions, 'any'));

                          case 1:
                          case 'end':
                            return _context4.stop();
                        }
                      }
                    }, _callee4, _this3);
                  }));

                  return function any(_x8) {
                    return _ref5.apply(this, arguments);
                  };
                }();

                /**
                 * Runs an 'all' boolean operator on an array of conditions
                 * @param  {Condition[]} conditions to be evaluated
                 * @return {Promise(boolean)} condition evaluation result
                 */


                all = function () {
                  var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(conditions) {
                    return regeneratorRuntime.wrap(function _callee5$(_context5) {
                      while (1) {
                        switch (_context5.prev = _context5.next) {
                          case 0:
                            return _context5.abrupt('return', prioritizeAndRun(conditions, 'all'));

                          case 1:
                          case 'end':
                            return _context5.stop();
                        }
                      }
                    }, _callee5, _this3);
                  }));

                  return function all(_x9) {
                    return _ref6.apply(this, arguments);
                  };
                }();

                if (!this.conditions.any) {
                  _context6.next = 11;
                  break;
                }

                _context6.next = 8;
                return any(this.conditions.any);

              case 8:
                return _context6.abrupt('return', _context6.sent);

              case 11:
                _context6.next = 13;
                return all(this.conditions.all);

              case 13:
                return _context6.abrupt('return', _context6.sent);

              case 14:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function evaluate(_x2) {
        return _ref.apply(this, arguments);
      }

      return evaluate;
    }()
  }]);

  return Rule;
}(_events.EventEmitter);

exports.default = Rule;