'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _condition = require('./condition');

var _condition2 = _interopRequireDefault(_condition);

var _ruleResult = require('./rule-result');

var _ruleResult2 = _interopRequireDefault(_ruleResult);

var _debug = require('./debug');

var _debug2 = _interopRequireDefault(_debug);

var _eventemitter = require('eventemitter2');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
   * @param {any} options.name - identifier for a particular rule, particularly valuable in RuleResult output
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
    if (options && (options.name || options.name === 0)) {
      _this.setName(options.name);
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
     * Sets the name of the rule
     * @param {any} name - any truthy input and zero is allowed
     */

  }, {
    key: 'setName',
    value: function setName(name) {
      if (!name && name !== 0) {
        throw new Error('Rule "name" must be defined');
      }
      this.name = name;
      return this;
    }

    /**
     * Sets the conditions to run when evaluating the rule.
     * @param {object} conditions - conditions, root element must be a boolean operator
     */

  }, {
    key: 'setConditions',
    value: function setConditions(conditions) {
      if (!Object.prototype.hasOwnProperty.call(conditions, 'all') && !Object.prototype.hasOwnProperty.call(conditions, 'any') && !Object.prototype.hasOwnProperty.call(conditions, 'not')) {
        throw new Error('"conditions" root must contain a single instance of "all", "any", or "not"');
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
      if (!event) throw new Error('Rule: setEvent() requires event object');
      if (!Object.prototype.hasOwnProperty.call(event, 'type')) throw new Error('Rule: setEvent() requires event object with "type" property');
      this.ruleEvent = {
        type: event.type
      };
      if (event.params) this.ruleEvent.params = event.params;
      return this;
    }

    /**
     * returns the event object
     * @returns {Object} event
     */

  }, {
    key: 'getEvent',
    value: function getEvent() {
      return this.ruleEvent;
    }

    /**
     * returns the priority
     * @returns {Number} priority
     */

  }, {
    key: 'getPriority',
    value: function getPriority() {
      return this.priority;
    }

    /**
     * returns the event object
     * @returns {Object} event
     */

  }, {
    key: 'getConditions',
    value: function getConditions() {
      return this.conditions;
    }

    /**
     * returns the engine object
     * @returns {Object} engine
     */

  }, {
    key: 'getEngine',
    value: function getEngine() {
      return this.engine;
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
        event: this.ruleEvent,
        name: this.name
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
     * @return {Promise(RuleResult)} rule evaluation result
     */

  }, {
    key: 'evaluate',
    value: function evaluate(almanac) {
      var _this3 = this;

      var ruleResult = new _ruleResult2.default(this.conditions, this.ruleEvent, this.priority, this.name);

      /**
       * Evaluates the rule conditions
       * @param  {Condition} condition - condition to evaluate
       * @return {Promise(true|false)} - resolves with the result of the condition evaluation
       */
      var evaluateCondition = function evaluateCondition(condition) {
        if (condition.isBooleanOperator()) {
          var subConditions = condition[condition.operator];
          var comparisonPromise = void 0;
          if (condition.operator === 'all') {
            comparisonPromise = all(subConditions);
          } else if (condition.operator === 'any') {
            comparisonPromise = any(subConditions);
          } else {
            comparisonPromise = not(subConditions);
          }
          // for booleans, rule passing is determined by the all/any/not result
          return comparisonPromise.then(function (comparisonValue) {
            var passes = comparisonValue === true;
            condition.result = passes;
            return passes;
          });
        } else {
          return condition.evaluate(almanac, _this3.engine.operators).then(function (evaluationResult) {
            var passes = evaluationResult.result;
            condition.factResult = evaluationResult.leftHandSideValue;
            condition.result = passes;
            return passes;
          });
        }
      };

      /**
       * Evalutes an array of conditions, using an 'every' or 'some' array operation
       * @param  {Condition[]} conditions
       * @param  {string(every|some)} array method to call for determining result
       * @return {Promise(boolean)} whether conditions evaluated truthy or falsey based on condition evaluation + method
       */
      var evaluateConditions = function evaluateConditions(conditions, method) {
        if (!Array.isArray(conditions)) conditions = [conditions];

        return Promise.all(conditions.map(function (condition) {
          return evaluateCondition(condition);
        })).then(function (conditionResults) {
          (0, _debug2.default)('rule::evaluateConditions results', conditionResults);
          return method.call(conditionResults, function (result) {
            return result === true;
          });
        });
      };

      /**
       * Evaluates a set of conditions based on an 'all', 'any', or 'not' operator.
       *   First, orders the top level conditions based on priority
       *   Iterates over each priority set, evaluating each condition
       *   If any condition results in the rule to be guaranteed truthy or falsey,
       *   it will short-circuit and not bother evaluating any additional rules
       * @param  {Condition[]} conditions - conditions to be evaluated
       * @param  {string('all'|'any'|'not')} operator
       * @return {Promise(boolean)} rule evaluation result
       */
      var prioritizeAndRun = function prioritizeAndRun(conditions, operator) {
        if (conditions.length === 0) {
          return Promise.resolve(true);
        }
        if (conditions.length === 1) {
          // no prioritizing is necessary, just evaluate the single condition
          // 'all' and 'any' will give the same results with a single condition so no method is necessary
          // this also covers the 'not' case which should only ever have a single condition
          return evaluateCondition(conditions[0]);
        }
        var method = Array.prototype.some;
        if (operator === 'all') {
          method = Array.prototype.every;
        }
        var orderedSets = _this3.prioritizeConditions(conditions);
        var cursor = Promise.resolve();
        // use for() loop over Array.forEach to support IE8 without polyfill

        var _loop = function _loop(i) {
          var set = orderedSets[i];
          var stop = false;
          cursor = cursor.then(function (setResult) {
            // after the first set succeeds, don't fire off the remaining promises
            if (operator === 'any' && setResult === true || stop) {
              (0, _debug2.default)('prioritizeAndRun::detected truthy result; skipping remaining conditions');
              stop = true;
              return true;
            }

            // after the first set fails, don't fire off the remaining promises
            if (operator === 'all' && setResult === false || stop) {
              (0, _debug2.default)('prioritizeAndRun::detected falsey result; skipping remaining conditions');
              stop = true;
              return false;
            }
            // all conditions passed; proceed with running next set in parallel
            return evaluateConditions(set, method);
          });
        };

        for (var i = 0; i < orderedSets.length; i++) {
          _loop(i);
        }
        return cursor;
      };

      /**
       * Runs an 'any' boolean operator on an array of conditions
       * @param  {Condition[]} conditions to be evaluated
       * @return {Promise(boolean)} condition evaluation result
       */
      var any = function any(conditions) {
        return prioritizeAndRun(conditions, 'any');
      };

      /**
       * Runs an 'all' boolean operator on an array of conditions
       * @param  {Condition[]} conditions to be evaluated
       * @return {Promise(boolean)} condition evaluation result
       */
      var all = function all(conditions) {
        return prioritizeAndRun(conditions, 'all');
      };

      /**
       * Runs a 'not' boolean operator on a single condition
       * @param  {Condition} condition to be evaluated
       * @return {Promise(boolean)} condition evaluation result
       */
      var not = function not(condition) {
        return prioritizeAndRun([condition], 'not').then(function (result) {
          return !result;
        });
      };

      /**
       * Emits based on rule evaluation result, and decorates ruleResult with 'result' property
       * @param {RuleResult} ruleResult
       */
      var processResult = function processResult(result) {
        ruleResult.setResult(result);
        var event = result ? 'success' : 'failure';
        return _this3.emitAsync(event, ruleResult.event, almanac, ruleResult).then(function () {
          return ruleResult;
        });
      };

      if (ruleResult.conditions.any) {
        return any(ruleResult.conditions.any).then(function (result) {
          return processResult(result);
        });
      } else if (ruleResult.conditions.all) {
        return all(ruleResult.conditions.all).then(function (result) {
          return processResult(result);
        });
      } else {
        return not(ruleResult.conditions.not).then(function (result) {
          return processResult(result);
        });
      }
    }
  }]);

  return Rule;
}(_eventemitter2.default);

exports.default = Rule;