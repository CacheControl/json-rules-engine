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

  function Engine(set) {
    _classCallCheck(this, Engine);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Engine).call(this));

    _this.set = set;
    _this.rules = [];
    _this.facts = {};
    _this.factCache = new Map();
    _this.status = READY;
    return _this;
  }

  _createClass(Engine, [{
    key: 'addRule',
    value: function addRule(ruleProperties) {
      (0, _params2.default)(ruleProperties).require(['conditions', 'action']);

      var rule = undefined;
      if (ruleProperties instanceof _rule2.default) {
        rule = ruleProperties;
      } else {
        rule = new _rule2.default();
        rule.setPriority(ruleProperties.priority).setConditions(ruleProperties.conditions).setAction(ruleProperties.action);
      }
      debug('engine::addRule', rule);

      this.rules.push(rule);
    }
  }, {
    key: 'addFact',
    value: function addFact(id, options, definitionFunc) {
      var factId = id;
      var fact = undefined;
      if (id instanceof _fact2.default) {
        factId = id.id;
        fact = id;
      } else {
        if (arguments.length === 2) {
          definitionFunc = options;
        }
        fact = new _fact2.default(id, options, definitionFunc);
      }
      debug('engine::addFact id:' + factId);
      this.facts[factId] = fact;
    }
  }, {
    key: 'getFact',
    value: function getFact(factId) {
      return this.facts[factId];
    }
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
                fact = this.facts[factId];

                if (fact) {
                  _context.next = 3;
                  break;
                }

                throw new Error('Undefined fact: ' + factId);

              case 3:
                cacheKey = fact.getCacheKey(params);
                cacheVal = cacheKey && this.factCache.get(cacheKey);

                if (!cacheVal) {
                  _context.next = 8;
                  break;
                }

                debug('engine::factValue cache hit for \'' + factId + '\' cacheKey:' + cacheKey);
                return _context.abrupt('return', cacheVal);

              case 8:
                debug('engine::factValue cache miss for \'' + factId + '\' using cacheKey:' + cacheKey + '; calculating');
                this.factCache.set(cacheKey, fact.calculate(params, this));
                return _context.abrupt('return', this.factCache.get(cacheKey));

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function factValue(_x, _x2) {
        return ref.apply(this, arguments);
      };
    }()
  }, {
    key: 'prioritizeRules',
    value: function prioritizeRules() {
      var ruleSets = this.rules.reduce(function (sets, rule) {
        var priority = rule.priority;
        if (!sets[priority]) sets[priority] = [];
        sets[priority].push(rule);
        return sets;
      }, {});
      return Object.keys(ruleSets).sort(function (a, b) {
        return Number(a) > Number(b) ? -1 : 1; // order highest priority -> lowest
      }).map(function (priority) {
        return ruleSets[priority];
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.status = FINISHED;
      return this;
    }
  }, {
    key: 'runConditionSet',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(set) {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', Promise.all(set.map(function (rule) {
                  if (_this2.status !== RUNNING) {
                    debug('engine::run status:' + _this2.status + '; skipping remaining rules');
                    return;
                  }
                  return rule.evaluate(_this2).then(function (rulePasses) {
                    debug('engine::run ruleResult:' + rulePasses);
                    if (rulePasses) {
                      _this2.emit('action', rule.action, _this2);
                      _this2.emit(rule.action.type, rule.action.params, _this2);
                    }
                    if (!rulePasses) _this2.emit('failure', rule, _this2);
                  });
                })));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function runConditionSet(_x4) {
        return ref.apply(this, arguments);
      };
    }()
  }, {
    key: 'run',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var _this3 = this;

        var initialFacts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var runOptions = arguments.length <= 1 || arguments[1] === undefined ? { clearFactCache: true } : arguments[1];
        var key, orderedSets, cursor;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                debug('engine::run initialFacts:', initialFacts);
                this.status = RUNNING;
                if (runOptions.clearFactCache) {
                  this.factCache.clear();
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
                      return _this3.runConditionSet(set);
                    }).catch(reject);
                    return cursor;
                  });
                  cursor.then(function () {
                    _this3.status = FINISHED;
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

      return function run(_x5, _x6) {
        return ref.apply(this, arguments);
      };
    }()
  }]);

  return Engine;
}(_events.EventEmitter);

exports.default = Engine;