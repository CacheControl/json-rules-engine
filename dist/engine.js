'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FINISHED = exports.RUNNING = exports.READY = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fact = require('./fact');

var _fact2 = _interopRequireDefault(_fact);

var _rule = require('./rule');

var _rule2 = _interopRequireDefault(_rule);

var _operator = require('./operator');

var _operator2 = _interopRequireDefault(_operator);

var _almanac = require('./almanac');

var _almanac2 = _interopRequireDefault(_almanac);

var _eventemitter = require('eventemitter2');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _engineDefaultOperators = require('./engine-default-operators');

var _engineDefaultOperators2 = _interopRequireDefault(_engineDefaultOperators);

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
    var rules = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Engine);

    var _this = _possibleConstructorReturn(this, (Engine.__proto__ || Object.getPrototypeOf(Engine)).call(this));

    _this.rules = [];
    _this.allowUndefinedFacts = options.allowUndefinedFacts || false;
    _this.pathResolver = options.pathResolver;
    _this.operators = new Map();
    _this.facts = new Map();
    _this.status = READY;
    rules.map(function (r) {
      return _this.addRule(r);
    });
    _engineDefaultOperators2.default.map(function (o) {
      return _this.addOperator(o);
    });
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
      if (!properties) throw new Error('Engine: addRule() requires options');

      var rule = void 0;
      if (properties instanceof _rule2.default) {
        rule = properties;
      } else {
        if (!Object.prototype.hasOwnProperty.call(properties, 'event')) throw new Error('Engine: addRule() argument requires "event" property');
        if (!Object.prototype.hasOwnProperty.call(properties, 'conditions')) throw new Error('Engine: addRule() argument requires "conditions" property');
        rule = new _rule2.default(properties);
      }
      rule.setEngine(this);
      this.rules.push(rule);
      this.prioritizedRules = null;
      return this;
    }

    /**
     * update a rule in the engine
     * @param {object|Rule} rule - rule definition. Must be a instance of Rule
     */

  }, {
    key: 'updateRule',
    value: function updateRule(rule) {
      var ruleIndex = this.rules.findIndex(function (ruleInEngine) {
        return ruleInEngine.name === rule.name;
      });
      if (ruleIndex > -1) {
        this.rules.splice(ruleIndex, 1);
        this.addRule(rule);
        this.prioritizedRules = null;
      } else {
        throw new Error('Engine: updateRule() rule not found');
      }
    }

    /**
     * Remove a rule from the engine
     * @param {object|Rule|string} rule - rule definition. Must be a instance of Rule
     */

  }, {
    key: 'removeRule',
    value: function removeRule(rule) {
      var ruleRemoved = false;
      if (!(rule instanceof _rule2.default)) {
        var filteredRules = this.rules.filter(function (ruleInEngine) {
          return ruleInEngine.name !== rule;
        });
        ruleRemoved = filteredRules.length !== this.rules.length;
        this.rules = filteredRules;
      } else {
        var index = this.rules.indexOf(rule);
        if (index > -1) {
          ruleRemoved = Boolean(this.rules.splice(index, 1).length);
        }
      }
      if (ruleRemoved) {
        this.prioritizedRules = null;
      }
      return ruleRemoved;
    }

    /**
     * Add a custom operator definition
     * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
     * @param {function(factValue, jsonValue)} callback - the method to execute when the operator is encountered.
     */

  }, {
    key: 'addOperator',
    value: function addOperator(operatorOrName, cb) {
      var operator = void 0;
      if (operatorOrName instanceof _operator2.default) {
        operator = operatorOrName;
      } else {
        operator = new _operator2.default(operatorOrName, cb);
      }
      (0, _debug2.default)('engine::addOperator name:' + operator.name);
      this.operators.set(operator.name, operator);
    }

    /**
     * Remove a custom operator definition
     * @param {string}   operatorOrName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
     * @param {function(factValue, jsonValue)} callback - the method to execute when the operator is encountered.
     */

  }, {
    key: 'removeOperator',
    value: function removeOperator(operatorOrName) {
      var operatorName = void 0;
      if (operatorOrName instanceof _operator2.default) {
        operatorName = operatorOrName.name;
      } else {
        operatorName = operatorOrName;
      }

      return this.operators.delete(operatorName);
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
      var fact = void 0;
      if (id instanceof _fact2.default) {
        factId = id.id;
        fact = id;
      } else {
        fact = new _fact2.default(id, valueOrMethod, options);
      }
      (0, _debug2.default)('engine::addFact id:' + factId);
      this.facts.set(factId, fact);
      return this;
    }

    /**
     * Remove a fact definition to the engine.  Facts are called by rules as they are evaluated.
     * @param {object|Fact} id - fact identifier or instance of Fact
     */

  }, {
    key: 'removeFact',
    value: function removeFact(factOrId) {
      var factId = void 0;
      if (!(factOrId instanceof _fact2.default)) {
        factId = factOrId;
      } else {
        factId = factOrId.id;
      }

      return this.facts.delete(factId);
    }

    /**
     * Iterates over the engine rules, organizing them by highest -> lowest priority
     * @return {Rule[][]} two dimensional array of Rules.
     *    Each outer array element represents a single priority(integer).  Inner array is
     *    all rules with that priority.
     */

  }, {
    key: 'prioritizeRules',
    value: function prioritizeRules() {
      if (!this.prioritizedRules) {
        var ruleSets = this.rules.reduce(function (sets, rule) {
          var priority = rule.priority;
          if (!sets[priority]) sets[priority] = [];
          sets[priority].push(rule);
          return sets;
        }, {});
        this.prioritizedRules = Object.keys(ruleSets).sort(function (a, b) {
          return Number(a) > Number(b) ? -1 : 1; // order highest priority -> lowest
        }).map(function (priority) {
          return ruleSets[priority];
        });
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
     * Returns a fact by fact-id
     * @param  {string} factId - fact identifier
     * @return {Fact} fact instance, or undefined if no such fact exists
     */

  }, {
    key: 'getFact',
    value: function getFact(factId) {
      return this.facts.get(factId);
    }

    /**
     * Runs an array of rules
     * @param  {Rule[]} array of rules to be evaluated
     * @return {Promise} resolves when all rules in the array have been evaluated
     */

  }, {
    key: 'evaluateRules',
    value: function evaluateRules(ruleArray, almanac) {
      var _this2 = this;

      return Promise.all(ruleArray.map(function (rule) {
        if (_this2.status !== RUNNING) {
          (0, _debug2.default)('engine::run status:' + _this2.status + '; skipping remaining rules');
          return Promise.resolve();
        }
        return rule.evaluate(almanac).then(function (ruleResult) {
          (0, _debug2.default)('engine::run ruleResult:' + ruleResult.result);
          almanac.addResult(ruleResult);
          if (ruleResult.result) {
            almanac.addEvent(ruleResult.event, 'success');
            return _this2.emitAsync('success', ruleResult.event, almanac, ruleResult).then(function () {
              return _this2.emitAsync(ruleResult.event.type, ruleResult.event.params, almanac, ruleResult);
            });
          } else {
            almanac.addEvent(ruleResult.event, 'failure');
            return _this2.emitAsync('failure', ruleResult.event, almanac, ruleResult);
          }
        });
      }));
    }

    /**
     * Runs the rules engine
     * @param  {Object} runtimeFacts - fact values known at runtime
     * @param  {Object} runOptions - run options
     * @return {Promise} resolves when the engine has completed running
     */

  }, {
    key: 'run',
    value: function run() {
      var _this3 = this;

      var runtimeFacts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      (0, _debug2.default)('engine::run started');
      this.status = RUNNING;
      var almanacOptions = {
        allowUndefinedFacts: this.allowUndefinedFacts,
        pathResolver: this.pathResolver
      };
      var almanac = new _almanac2.default(this.facts, runtimeFacts, almanacOptions);
      var orderedSets = this.prioritizeRules();
      var cursor = Promise.resolve();
      // for each rule set, evaluate in parallel,
      // before proceeding to the next priority set.
      return new Promise(function (resolve, reject) {
        orderedSets.map(function (set) {
          cursor = cursor.then(function () {
            return _this3.evaluateRules(set, almanac);
          }).catch(reject);
          return cursor;
        });
        cursor.then(function () {
          _this3.status = FINISHED;
          (0, _debug2.default)('engine::run completed');
          var ruleResults = almanac.getResults();

          var _ruleResults$reduce = ruleResults.reduce(function (hash, ruleResult) {
            var group = ruleResult.result ? 'results' : 'failureResults';
            hash[group].push(ruleResult);
            return hash;
          }, { results: [], failureResults: [] }),
              results = _ruleResults$reduce.results,
              failureResults = _ruleResults$reduce.failureResults;

          resolve({
            almanac: almanac,
            results: results,
            failureResults: failureResults,
            events: almanac.getEvents('success'),
            failureEvents: almanac.getEvents('failure')
          });
        }).catch(reject);
      });
    }
  }]);

  return Engine;
}(_eventemitter2.default);

exports.default = Engine;