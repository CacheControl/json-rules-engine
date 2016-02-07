'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _params = require('params');

var _params2 = _interopRequireDefault(_params);

var _condition = require('./condition');

var _condition2 = _interopRequireDefault(_condition);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = require('debug')('json-rules-engine');

var Rule = function () {
  function Rule(options) {
    _classCallCheck(this, Rule);

    if (options && options.conditions) {
      this.setConditions(options.conditions);
    }

    var priority = options && options.priority || 1;
    this.setPriority(priority);

    var action = options && options.action || { type: 'unknown' };
    this.setAction(action);
  }

  _createClass(Rule, [{
    key: 'setPriority',
    value: function setPriority(priority) {
      priority = parseInt(priority, 10);
      if (priority <= 0) throw new Error('Priority must be greater than zero');
      this.priority = priority;
      return this;
    }
  }, {
    key: 'setConditions',
    value: function setConditions(conditions) {
      if (!conditions.hasOwnProperty('all') && !conditions.hasOwnProperty('any')) {
        throw new Error('"conditions" root must contain a single instance of "all" or "any"');
      }
      this.conditions = new _condition2.default(conditions);
      return this;
    }
  }, {
    key: 'setAction',
    value: function setAction(action) {
      this.action = (0, _params2.default)(action).only(['type', 'params']);
      return this;
    }
  }, {
    key: 'evaluateCondition',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(condition, engine) {
        var comparisonValue, subConditions, conditionResult;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                comparisonValue = undefined;

                if (!condition.isBooleanOperator()) {
                  _context.next = 8;
                  break;
                }

                subConditions = condition[condition.operator];
                _context.next = 5;
                return this[condition.operator](subConditions, engine);

              case 5:
                comparisonValue = _context.sent;
                _context.next = 11;
                break;

              case 8:
                _context.next = 10;
                return engine.factValue(condition.fact, condition.params);

              case 10:
                comparisonValue = _context.sent;

              case 11:
                conditionResult = condition.evaluate(comparisonValue);

                if (!condition.isBooleanOperator()) {
                  debug('runConditionSet:: <' + comparisonValue + ' ' + condition.operator + ' ' + condition.value + '?> (' + conditionResult + ')');
                }
                return _context.abrupt('return', conditionResult);

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function evaluateCondition(_x, _x2) {
        return ref.apply(this, arguments);
      };
    }()
  }, {
    key: 'prioritizeConditions',
    value: function prioritizeConditions(conditions, engine) {
      var factSets = conditions.reduce(function (sets, condition) {
        // if a priority has been set on this specific condition, honor that first
        // otherwise, use the fact's priority
        var priority = condition.priority;
        if (!priority) {
          var fact = engine.getFact(condition.fact);
          if (!fact) {
            throw new Error('Undefined fact: ' + condition.fact);
          }
          priority = fact.priority;
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
  }, {
    key: 'runConditionSet',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(set, engine, method) {
        var _this = this;

        var conditionResults;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!Array.isArray(set)) set = [set];
                _context2.next = 3;
                return Promise.all(set.map(function (condition) {
                  return _this.evaluateCondition(condition, engine);
                }));

              case 3:
                conditionResults = _context2.sent;

                debug('runConditionSet::results', conditionResults);
                return _context2.abrupt('return', method.call(conditionResults, function (result) {
                  return result === true;
                }));

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function runConditionSet(_x3, _x4, _x5) {
        return ref.apply(this, arguments);
      };
    }()
  }, {
    key: 'prioritizeAndRun',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(conditions, engine, operator) {
        var _this2 = this;

        var method, orderedSets, cursor;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                method = Array.prototype.some;

                if (operator === 'all') {
                  method = Array.prototype.every;
                }
                orderedSets = this.prioritizeConditions(conditions, engine);
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
                    return _this2.runConditionSet(set, engine, method);
                  });
                });
                return _context3.abrupt('return', cursor);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function prioritizeAndRun(_x6, _x7, _x8) {
        return ref.apply(this, arguments);
      };
    }()
  }, {
    key: 'any',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(conditions, engine) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', this.prioritizeAndRun(conditions, engine, 'any'));

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function any(_x9, _x10) {
        return ref.apply(this, arguments);
      };
    }()
  }, {
    key: 'all',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(conditions, engine) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', this.prioritizeAndRun(conditions, engine, 'all'));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function all(_x11, _x12) {
        return ref.apply(this, arguments);
      };
    }()
  }, {
    key: 'evaluate',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(engine) {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!this.conditions.any) {
                  _context6.next = 6;
                  break;
                }

                _context6.next = 3;
                return this.any(this.conditions.any, engine);

              case 3:
                return _context6.abrupt('return', _context6.sent);

              case 6:
                _context6.next = 8;
                return this.all(this.conditions.all, engine);

              case 8:
                return _context6.abrupt('return', _context6.sent);

              case 9:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function evaluate(_x13) {
        return ref.apply(this, arguments);
      };
    }()
  }]);

  return Rule;
}();

exports.default = Rule;